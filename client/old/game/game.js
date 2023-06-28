import Object from './object.js'
import * as conn from '../connection.js'
import { typeId, objectType } from '../type.js'

export default class GameHandler {
	constructor({ canvasList, cam, screen }) {
		setTimeout(() => { console.log("game", this); }, 1000);

		this.entityCtx = canvasList.entity.ctx;
		this.cenarioCtx = canvasList.cenario.ctx;
		this.itemCtx = canvasList.item.ctx;
		this.effectCtx = canvasList.effect.ctx;
		this.debugCtx = canvasList.debug.ctx;
		this.uiCtx = canvasList.ui.ctx;

		this.name = "game";
		this.gameState = { players: [] };
		this.map = { name: "default", objects: [] };
		this.mapGridSize = 50;
		this.userAccepted = false;

		this.userId = null;
		this.userAs = null;

		this.player = null;
		this.entities = [];

		this.running = true;

		this.currentTime = Date.now();
		this.perFrameTime = 0;

		this.typesId = typeId;
		this.types = objectType;

		this.hasCenarioUpdate = false;
		this.hasUIUpdate = true;

		this.world = { width: 2000, height: 1000 };

		const cameraPos = {x: 0, y: -486};
		this.camera = new Object({ x: cameraPos.x, y: cameraPos.y, width: this.world.width, height: this.world.height, hasAnimation: true, type: this.types.notRendered, name: 'camera', game: this });
		this.camera.followPlayer = false;
		this.camera.scale = cam.width / this.world.width;//0.5;
		this.camera.position = new Proxy(this.camera.position, { set: (target, prop, value) => { this.hasCenarioUpdate = true; target[prop] = value; return true; } });
		this.lastObjectId = 0;

		this.screen = screen;

		this.mapGrid = { show: false, showMouseOverlay: false, };

		this.debugMode = true;

		this.icons = { };
		
	}

	getMousePosAsWorldPos(e) {
		const pos = { x: this.camera.position.x + e.offsetX, y: this.camera.position.y + e.offsetY };
		if (this.camera.followPlayer) {
			pos.x += this.camera.render.width / 2 - this.player.width / 2;
			pos.y += this.camera.render.height / 2 - this.player.height / 2;
		}
		pos.x = Math.trunc(pos.x / this.camera.scale);
		pos.y = Math.trunc(pos.y / this.camera.scale);
		return pos;
	}

	registerConnectionEvents() {
		conn.on('object-add', (data) => { this.onObjectAdd(data); });
		conn.on('object-delete', (data) => { this.onObjectDelete(data); });
		conn.on('object-state', (data) => { this.onObjectState(data); });
		conn.on('death', (data) => { this.onUserDeath(data.userId); });
	}
	registerController() {
		const game = this;
		const gameElement = document.getElementById("game");
		gameElement.onmousedown = (e) => { if (game.onMouseDown) game.onMouseDown(e); };
		gameElement.onmousemove = (e) => { game.lastMouseScreenPos = { e: e, worldPos: this.getMousePosAsWorldPos(e) }; if (game.onMouseMove) game.onMouseMove(e); };
		gameElement.onmouseup = (e) => { if (game.onMouseUp) game.onMouseUp(e); };
	}
	loadObjects(objects) { }
	drawUI() { }
	addEntity(id, data) { }

	onUserDeath(userId) { 
		const player = userId == this.userId ? this.player : this.entities.find(x => x.id == userId); 
		if(player) { 
			player.dead = true;
			//player.animation.
		}
	}
	
	onObjectAdd(data) { this.insertObject(data); }
	onObjectDelete(data) {
		const obj = this.map.objects.find(x => x.id == data.id && x.typeId == data.typeId);
		this.deleteObject(obj);
	}
	onObjectState(data) {
		const obj = this.map.objects.find(x => x.id == data.id && x.typeId == data.typeId);
		if (obj) obj.state = data.state;
	}

	insertObject(object) {
		this.map.objects.push(object);
		if (!object.id) object.id = object.name + '-' + this.lastObjectId++;
		if (object.type == this.types.cenario) this.hasCenarioUpdate = true;
	}

	deleteObject(obj) {
		if (!obj) return;
		obj.destroy = true;
		if (obj.onRemove) obj.onRemove();
		this.map.objects = this.map.objects.filter(x => !x.destroy);
		if (obj.type == this.types.cenario) this.hasCenarioUpdate = true;
	}

	addObject(object) { conn.emit('object-add', object); }

	removeObject(obj, notify) {
		if (notify) {
			conn.emit('object-delete', { id: obj.id, typeId: obj.typeId });
			return;
		}
		this.deleteObject(obj);
	}

	loadRequired() { }

	getIntendedCtx(type) {
		switch (type) {
			case this.types.entity: return this.entityCtx;
			case this.types.cenario: if (this.hasCenarioUpdate) return this.cenarioCtx; else return undefined;
			case this.types.item: return this.itemCtx;
			case this.types.effect: return this.effectCtx;
			case this.types.debug: return this.debugCtx;
		}
		throw new Error(`not found canvas ${type}`);
	}

	changeMap(map) {
		console.log(map);
		const objects = map.objects;
		this.map = map;
		this.loadObjects(objects);
	}

	updateCenario() {
		this.hasCenarioUpdate = true;
	}

	updateState(newState) {
		if (!this.c) console.log(newState);
		this.c = true;
		this.gameState = { ...newState };
		const toRemove = [];
		this.entities.forEach((x) => {
			const data = newState.players[x.id];
			if (!data) { toRemove.push(x.id); return; }

			// update character state
			if (x.id != this.userId) {
				x.setPos(data.pos);
				if (x.animation.currentAnimation != data.animation)
					x.animation.changeAnimation(data.animation);
			}
			delete newState.players[x.id];
		});

		this.entities = this.entities.filter(x => !toRemove.includes(x.id));

		for (let player in newState.players) {
			const data = this.gameState.players[player];
			if (data.type == undefined) continue;
			this.addEntity(player, data);
		}

	}

	update() {
		const currentTime = Date.now();
		this.perFrameTime = currentTime - this.currentTime;
		this.currentTime = currentTime;

		const newDraw = [];

		this.entities.forEach(x => {
			//if(x.isColliding(this.camera)) { 
			if (x.draw) newDraw.push(x);
			if (x.animation?.renderOnOffScreen) x.animation?.renderOnOffScreen();
			const anime = x.animation?.getCurrentAnimation();
			if(anime && anime.playUntilEnd && anime.done && x.animation.onAnimationDone) { x.animation.onAnimationDone(x); x.animation.onAnimationDone = null; }
			//}
			x.update();
		});

		if (this.map?.objects) this.map.objects.forEach(x => {
			//if(x.isColliding(this.camera)) {
			newDraw.push(x);
			if (x.animation?.renderOnOffScreen) x.animation?.renderOnOffScreen();
			//}
			if (x.update) x.update();
		});

		this.toDraw = newDraw;

		if (this.camera.followPlayer && this.player) {
			this.camera.setPos({ x: (this.player.position.x + this.player.width / 2 - this.camera.render.width / 2), y: (this.player.position.y + this.player.height / 2 - this.camera.render.height / 2) });
		}

	}

	draw() {
		//clear the canvas
		if (this.hasCenarioUpdate) this.cenarioCtx.clearRect(0, 0, this.screen.width, this.screen.height);
		if (this.hasUIUpdate) this.uiCtx.clearRect(0, 0, this.screen.width, this.screen.height);
		if (this.debugMode) this.debugCtx.clearRect(0, 0, this.screen.width, this.screen.height);
		this.itemCtx.clearRect(0, 0, this.screen.width, this.screen.height);
		this.entityCtx.clearRect(0, 0, this.screen.width, this.screen.height);
		this.effectCtx.clearRect(0, 0, this.screen.width, this.screen.height);

		if (this.toDraw) this.toDraw.forEach(x => { x.draw(); });

		if (this.hasUIUpdate) this.drawUI();

		if (this.mapGrid && this.mapGrid.show) {

			const startX = this.camera.position.x - this.camera.position.x % this.mapGridSize;
			const startY = this.camera.position.y - this.camera.position.y % this.mapGridSize;
			const endX = (this.camera.position.x + this.screen.width) / this.camera.scale;
			const endY = (this.camera.position.y + this.screen.height) / this.camera.scale;
			for (let x = startX - this.mapGridSize; x < endX; x += this.mapGridSize) {
				for (let y = startY - this.mapGridSize; y < endY; y += this.mapGridSize) {
					this.debugCtx.save();
					this.debugCtx.strokeRect((x - this.camera.position.x) * this.camera.scale, (y - this.camera.position.y) * this.camera.scale, this.mapGridSize * this.camera.scale, this.mapGridSize * this.camera.scale);
					this.debugCtx.restore();
				}
			}

			if (this.mapGrid.showMouseOverlay && this.lastMouseScreenPos) {
				const lastMousePos = {
					x: (this.lastMouseScreenPos.worldPos.x - (this.lastMouseScreenPos.worldPos.x % this.mapGridSize) - this.camera.position.x) * this.camera.scale,
					y: (this.lastMouseScreenPos.worldPos.y - (this.lastMouseScreenPos.worldPos.y % this.mapGridSize) - this.camera.position.y) * this.camera.scale
				};
				this.debugCtx.save();
				this.debugCtx.fillStyle = "#9acd3261";
				this.debugCtx.fillRect(lastMousePos.x, lastMousePos.y, this.mapGridSize * this.camera.scale, this.mapGridSize * this.camera.scale);
				this.debugCtx.restore();
			}
		}

		if (this.debugDraw) this.debugDraw();

		this.hasCenarioUpdate = false;
		this.hasUIUpdate = false;
	}

}