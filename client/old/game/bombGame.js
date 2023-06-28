import * as conn from "../connection.js"
import { typeId, objectNames, powerUpId } from '../type.js'
import GameHandler from "./game.js"
import Entity from "./entity.js"
import Object from './object.js'
import Player from "./entities/player.js"
import Bomb from "./objects/bomb.js"
import Explosion from "./objects/explosion.js"
import Wall from './objects/wall.js'
import DmgWall from './objects/damageableWall.js'
import PowerUp from './objects/powerup.js'

function fillMapWithBombPlace(game){
	const gridData = { typeId: typeId.bombPlace, name: objectNames.bombPlace };
}

function getPowerUpIcons(){
	const icons = {};
	for(const x in powerUpId) { const img = new Image(); img.src = `/img/icons/${powerUpId[x]}.png`; icons[powerUpId[x]] = img; }
	return icons;
}

export default class BombGame extends GameHandler {
	constructor(gameData) {
		super(gameData);
		this.name = "Bomb";

		this.bombPlaces = [];

		this.registerController();
		this.icons.powerup = getPowerUpIcons();
		fillMapWithBombPlace(this);
	}

	registerConnectionEvents() {
		super.registerConnectionEvents();

		conn.on('bomb-placed', (data) => { this.insertObject(data); });
		conn.on('bomb-explode', (data) => {
			const bomb = this.map.objects.find(x => x.typeId == this.typesId.bomb && x.id == data.bombId);
			if (!bomb) return;
			bomb.explode();
			data.explosion.forEach(x => { this.insertObject({ ...x, type: this.types.effect, typeId: this.typesId.explosion, name: objectNames.explosion }); });
		});
	}

	registerController() {
		const game = this;
		const onKeyDown = (e) => {
			//if (e.key == 'j') game.debugMode = !game.debugMode;
			//if (e.key == "m") conn.emit('setMap');
			//if (e.key == 'u') animeEdit.startEdit(game.player);
			//if (e.key == 'ç') gridMapEdit.startEdit(game);
			//if (e.key == 'l') console.log(game.map.objects.map(x => x.toJSON()));
			if (!game.player || game.player.dead) return;
			//if (e.key == "p") game.player.updated = 0;
			//if (e.key == "o") game.player.first = false;
			const bind = game.player.binds[e.key];
			if (bind) if (game.player.action[bind]) game.player.action[bind].pressed = true; else console.log('key not found', e.key, bind);
		}
		const onKeyUp = (e) => {
			if (!game.player) return;
			const bind = game.player.binds[e.key];
			if (bind) if (game.player.action[bind].isHold) game.player.action[bind].pressed = false;
		}

		// Make the functions run whenever the events happen
		document.addEventListener('keydown', onKeyDown, false);
		document.addEventListener('keyup', onKeyUp, false);

		super.registerController();
	}

	onMouseDown() { }
	onMouseMove() { }
	onMouseUp() { }

	placeBomb(player) {
		const bombSpread = 3;
		if (!this.bombPlaces || this.bombPlaces.length == 0) {
			conn.emit("bomb-place", { position: player.position, spread: bombSpread });
			return;
		}

		const mp = { x: player.position.x + player.width / 2, y: player.position.y + player.height / 2 };
		const closestPlace = this.bombPlaces.find(x => mp.x >= x.position.x && mp.x <= x.maxX && mp.y >= x.position.y && mp.y <= x.maxY);
		if (!closestPlace || closestPlace.bombPlaced) return;
		const bombPos = { x: closestPlace.position.x + closestPlace.width / 2, y: closestPlace.position.y + closestPlace.height / 2 };
		conn.emit("bomb-place", { position: bombPos, posId: closestPlace.id, spread: bombSpread });
	}

	collectPowerUp(obj) {
		conn.emit('collect', { typeId: obj.typeId, id: obj.id, powerup: obj.powerup, quantity: obj.quantity }, (receive) => { if (receive) this.player.addPowerUp(obj.powerup, obj.quantity); });
	}

	addEntity(id, data) {
		if (id == this.userId) {
			this.player = new Player({ ...data, character: data.char, width: 40, height: 40, id: id, game: this });
			this.entities.push(this.player);
			return;
		}
		const e = new Entity({ ...data, character: data.char, width: 40, height: 40, id: id, game: this });
		this.entities.push(e);
	}

	insertObject(data) {
		const objectData = { ...data, game: this };
		let object = null;
		if (data.typeId == typeId.bomb) object = new Bomb(objectData, data.data);
		else if (data.typeId == typeId.explosion) object = new Explosion(objectData, data.data);
		else if (data.typeId == typeId.wallDamage) object = new DmgWall(objectData, data.data);
		else if (data.typeId == typeId.wall) object = new Wall(objectData, data.data);
		else if (data.typeId == typeId.powerup) object = new PowerUp(objectData, data.data);
		else object = new Object(objectData);

		if (data.typeId == typeId.bombPlace) this.bombPlaces.push(object);

		super.insertObject(object);

		return object;
	}

	loadObjects(objects) {
		this.map.objects = [];
		if (objects) {
			objects.sort(x => x.typeId == typeId.bombPlace ? -1 : x.typeId).forEach(data => { this.insertObject(data) });
		}
	}

	drawUI() {
		const ctx = this.uiCtx;
		const game = this;

		const textPlaces = [
			{
				margin: { left: 10, top: 10 },
				height: 12,
				text: {
					margin: { left: 10, right: 10, top: 15, bottom: 15 },
					getValue: () => { return game.player ? `Life ${game.player.currentLife}` : 'Life count' },
				}
			},
		];

		const draw = (f) => {
			if (!f.text.margin.left) f.text.margin.left = 0;
			if (!f.text.margin.right) f.text.margin.right = 0;
			if (!f.text.margin.top) f.text.margin.top = 0;
			if (!f.text.margin.bottom) f.text.margin.bottom = 0;
			if (!f.margin.left) f.margin.left = 0;
			if (!f.margin.right) f.margin.right = 0;
			if (!f.margin.top) f.margin.top = 0;
			if (!f.margin.bottom) f.margin.bottom = 0;
			const text = f.text.getValue ? f.text.getValue() : f.text.value;
			const metrics = ctx.measureText(text);
			const textWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
			const boxWidth = textWidth + f.text.margin.left + f.text.margin.right;
			const boxHeight = f.height + f.text.margin.top + f.text.margin.bottom;
			const startX = f.margin.right != 0 ? (ctx.canvas.width - (f.margin.right + boxWidth)) : f.margin.left;
			const startY = f.margin.bottom != 0 ? (ctx.canvas.height - (f.margin.bottom + boxHeight)) : f.margin.top;
			ctx.save();
			ctx.strokeStyle = "#000";
			ctx.font = "bold " + f.height + "px Arial";
			ctx.fillRect(startX, startY, boxWidth, boxHeight);
			ctx.restore();
			if(f.image){
				ctx.save();
				ctx.drawImage(f.image.img, startX + f.image.margin.left, startY + f.image.margin.top, boxWidth, boxHeight);
				ctx.restore();
			}
			ctx.save();
			ctx.font = "bold " + f.height + "px Arial";
			ctx.fillStyle = "white";
			ctx.fillText(text, startX + f.text.margin.left, startY + f.text.margin.top);
			ctx.restore();
			f.textWidth = textWidth;
			f.boxWidth = boxWidth;
			f.boxHeight = boxHeight;
		};

		textPlaces.forEach(x => { draw(x); });
		if(this.player){
			let lastPos = ctx.canvas.width;
			for(const effect in this.player.effects) { 
				const value = this.player.effects[effect];
				if(value == 0) continue;
				const image = this.icons.powerup[effect];
				const width = 40;
				const height = 30;
				const margin = 10;
				const paddingTxtBottom = 5;
				const paddingTxtRight = 10;
				const posX = lastPos = lastPos - (width + margin);
				const posY = 10;
				const fontHeight = 12;
				const text = value;
					
				ctx.save();
				ctx.drawImage(image, posX, posY, width, height);
				ctx.restore();
				ctx.save();
					
				ctx.font = "bold " + fontHeight + "px Arial";
				ctx.fillStyle = "white";
				ctx.fillText(text, posX + width - paddingTxtRight, posY + height - paddingTxtBottom);
				ctx.restore();
			}
		}
		
	}

}