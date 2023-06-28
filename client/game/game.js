import Object from './object.js'
import Observer from '../observer.js'
import * as instatiator from './instantiator.js'
import * as conn from '../connection.js'
import * as renderer from './renderer.js'
import * as types from '../type.js'
import * as eng from './eng.js'
import keys from "../json/keys.json" assert { type: 'json' };

const onMouseMove = new Observer();
const onMouseDown = new Observer();
const onMouseUp = new Observer();

const worldSize = {
	width: 100,
	height: 100,
}

let userId;
let userType;
let player;

let entities = [];
let state = { players: [] };

let lastTickTime = 0;
let perFrameTick = 0;

export const gridSize = 50;

const map = {
	objects: [],
};

const actions = {
	up: { pressed: false, isHold: true, isHolding: false },
	down: { pressed: false, isHold: true, isHolding: false },
	left: { pressed: false, isHold: true, isHolding: false },
	right: { pressed: false, isHold: true, isHolding: false },
	cameraRight: { pressed: false, isHold: true, isHolding: false },
	cameraLeft: { pressed: false, isHold: true, isHolding: false },
	cameraUp: { pressed: false, isHold: true, isHolding: false },
	cameraDown: { pressed: false, isHold: true, isHolding: false },
	placeBomb: { pressed: false, isHold: false, isHolding: false },
	skill1: { pressed: false, isHold: false, isHolding: false },
	skill2: { pressed: false, isHold: false, isHolding: false },
	skill3: { pressed: false, isHold: false, isHolding: false },
	skill4: { pressed: false, isHold: false, isHolding: false }
}

export function getPlayer() { return player; }
export function getUserId() { return userId; }

export function setUser(id, type) { userId = id; userType = type; }

export function clearObject(){ map.objects = [] }

export function addObject(data) { map.objects.push(instatiator.instantiateObject(data)); };

export function addEntity(playerId, data) { 
	const entity = instatiator.instantiateEntity(playerId, data);
	entities.push(entity); 
	if(playerId == userId) { 
		player = entity;
		player.onMove.add(playerCollider);
	}
}
export function getEntity(playerId){
	return entities.find(x => x.id == playerId);
}

export function updateState(newState){
	state = { ...newState };
	entities.forEach((x) => {
		const data = newState.players[x.id];
		if (!data) { x.remove(); return; }

		// update character state
		if (x.id != userId) {
			x.setPos(data.pos);
			if (x.animation.currentAnimation != data.animation)
				x.changeAnimation(data.animation);
		}
		delete newState.players[x.id];
	});

	for (let playerId in newState.players) {
		const data = state.players[playerId];
		if (data.typeId == undefined) continue;
		addEntity(playerId, data);
	}
}

export function requestDeath() { conn.emit('death'); }
export function requestObject(data) { conn.emit('object-add', data); }
export function requestRemoveObject(data) { conn.emit('object-delete', { id: data.id, typeId: data.typeId }); }

export function	onObjectAdd(data) { addObject(data); }
export function	onObjectDelete(data) {
	const obj = map.objects.find(x => x.id == data.id && x.typeId == data.typeId);
	if(obj) obj.remove();
}
export function	onObjectState(data) {
	const obj = map.objects.find(x => x.id == data.id && x.typeId == data.typeId);
	if (obj) obj.state = data.state;
}

export function update(){
	const currentTime = Date.now();
	perFrameTick = currentTime - lastTickTime;
	lastTickTime = currentTime;

	if(player){
		handleController();
	}
	
	entities = entities.filter(x => !x.delete);
	map.objects = map.objects.filter(x => !x.delete);
	entities.forEach(x => { x.update();	});
	map.objects.forEach(x => { x.update();	});
}

export function updateDraw(){
	// update frame
	map.objects.forEach(x => { if(x.delete) return; x.animation.update();	});
	entities.forEach(x => { if(x.delete) return; x.animation.update(); });
}

export function getObjects(){
	return map.objects;
}

export function getTickFrame(){
	return perFrameTick;
}

export function getTickTime(){
	return lastTickTime;
}

export function isColliding(obj1, obj2){
	if (!obj2.position) obj2.position = { x: obj2.x, y: obj2.y };
	if (!obj2.maxX) obj2.maxX = obj2.position.x + obj2.width;
	if (!obj2.maxY) obj2.maxY = obj2.position.y + obj2.height;
	return obj1.position.x < obj2.maxX && obj1.maxX > obj2.position.x && obj1.position.y < obj2.maxY && obj1.maxY > obj2.position.y;
}

function inGameControllerKeyDown(e){
	if(!player) return;
	const bind = keys.binds[e.key];
	if (!bind) return; 
	if (!actions[bind]) {
		console.log('key not found', e.key, bind);
	}
	const action = actions[bind];
	if(action.pressed) return;
	action.pressed = true;
	if(action.isHold) return;
	
}

function inGameControllerKeyUp(e){
	if(!player) return;
	const bind = keys.binds[e.key];
	if (!bind) return; 
	if (!actions[bind]) {
		console.log('key not found', e.key, bind);
	}
	const action = actions[bind];
	action.pressed = false;
	action.isHolding = false;
}

export function registerMouseEvent(event, action){
	if(event == 'mousemove') onMouseMove.add(action);
	else if(event == 'mouseup') onMouseUp.add(action);
	else if(event == 'mousedown') onMouseDown.add(action);
}

export function removeMouseEvent(event, action){
	if(event == 'mousemove') onMouseMove.remove(action);
	else if(event == 'mouseup') onMouseUp.remove(action);
	else if(event == 'mousedown') onMouseDown.remove(action);
}

function mouseMove(e){
	const data = { inWorldPos: renderer.getMousePosAsWorldPos(e), e: e };
	onMouseMove.exec(data);
}
function mouseUp(e){
	const data = { inWorldPos: renderer.getMousePosAsWorldPos(e), e: e };
	onMouseUp.exec(data);
}
function mouseDown(e){
	const data = { inWorldPos: renderer.getMousePosAsWorldPos(e), e: e };
	onMouseDown.exec(data);
}

export function init(){
	const canvas = eng.getCanvasList().ui.canvas;
	document.addEventListener('keydown', inGameControllerKeyDown, false);
	document.addEventListener('keyup', inGameControllerKeyUp, false);
	canvas.addEventListener('mousemove', mouseMove, false);
	canvas.addEventListener('mouseup', mouseUp, false);
	canvas.addEventListener('mousedown', mouseDown, false);
}

export function stop(){
	const canvas = eng.getCanvasList().ui;
	document.removeEventListener('keydown', inGameControllerKeyDown, false);
	document.removeEventListener('keyup', inGameControllerKeyUp, false);
	canvas.removeEventListener('mousemove', mouseMove, false);
	canvas.removeEventListener('mouseup', mouseUp, false);
	canvas.removeEventListener('mousedown', mouseDown, false);
}

function handleController(){
	if (player.canWalk) {
		const pMove = { x: 0, y: 0 };
		if (actions.right.pressed) pMove.x += 1;
		if (actions.left.pressed) pMove.x -= 1;
		if (actions.up.pressed) pMove.y -= 1;
		if (actions.down.pressed) pMove.y += 1;
		player.move(pMove);
	}
	const cMove = { x: 0, y: 0 };
	if (actions.cameraRight.pressed) cMove.x += 1;
	if (actions.cameraLeft.pressed) cMove.x -= 1;
	if (actions.cameraUp.pressed) cMove.y -= 1;
	if (actions.cameraDown.pressed) cMove.y += 1;
	if(cMove.x != 0 || cMove.y != 0){
		renderer.moveRenderer(cMove);
	}
	
	if(actions.placeBomb.pressed && !actions.placeBomb.isHolding) { actions.placeBomb.isHolding = true; placeBomb(); }
	if(actions.skill1.pressed && !actions.skill1.isHolding) { actions.skill1.isHolding = true; player.skillStart('skill1'); }
	if(actions.skill2.pressed && !actions.skill2.isHolding) { actions.skill2.isHolding = true; player.skillStart('skill2'); }
	if(actions.skill3.pressed && !actions.skill3.isHolding) { actions.skill3.isHolding = true; player.skillStart('skill3'); }
	if(actions.skill4.pressed && !actions.skill4.isHolding) { actions.skill4.isHolding = true; player.skillStart('skill4'); }
}

function placeBomb(){
	const x = Math.trunc(player.position.x - (player.position.x % gridSize));
	const y = Math.trunc(player.position.y - (player.position.y % gridSize));
	conn.emit('object-add', { position: { x: x, y: y }, typeId: types.typesId.bomb })
}

export function bombExplode(bombId, explosions){
	const bomb = map.objects.find(x => x.typeId == types.typesId.bomb && x.id == bombId);
	if (!bomb) return;
	bomb.explode();
	explosions.forEach(x => { addObject(x); });
}

export function collectPowerUp(obj){
	if(!obj.quantity) obj.quantity = 1;
	conn.emit('collect', { typeId: obj.typeId, id: obj.id, powerup: obj.powerup, quantity: obj.quantity }, (receive) => { 
		if (!receive) return;
		player.effects[obj.powerup] = player.effects[obj.powerup] + obj.quantity;
		if(obj.powerup == types.powerup.powerUps.maxLife || obj.powerup == types.powerup.powerUpsId[types.powerup.powerUps.maxLife]){
			player.takeDamage(-1, 1);
		}
	});
}

function playerCollider(data){
	const entity = data.entity;
	const newPosition = { ...entity.position };

	const velocity = entity.getVelocity();
	const area = { 
		position: { x: data.lastPosition.x - (velocity * 2), y: data.lastPosition.y - (velocity * 2) }, 
		width: entity.width + (velocity * 4),
		height: entity.height + (velocity * 4) 
	}
	const collidable = map.objects.filter(x => (x.blockable || x.onCollide) && x.isColliding(area));
	const collidingWith = collidable.find(x => x.isColliding(entity));
	if(!collidingWith) return;
	if(!collidingWith.blockable && collidingWith.onCollide) {
		collidingWith.onCollide(entity);
		return;
	}
	
	// TODO: define position in base with CollideX and CollideY
	
	if(data.direction.x != 0) {
		entity.position.x = newPosition.x;
		entity.position.y = data.lastPosition.y;
		const collideX = collidable.find(x => x.isColliding(entity));
		if(!collideX) return;
		if(collideX) {
			/*if(data.direction.x > 0) {
				entity.position.x = collideX.position.x;
			}
			if(data.direction.x < 0) {
				entity.position.x = collideX.maxX;
			}*/
		}
	}

	if(data.direction.y != 0) {
		entity.position.x = data.lastPosition.x;
		entity.position.y = newPosition.y;
		const collideY = collidable.find(x => x.isColliding(entity));
		if(!collideY) return;
		if(collideY) {
			/*if(data.direction.y > 0) {
				entity.position.y = collideY.position.y;
			}
			if(data.direction.y < 0) {
				entity.position.y = collideY.maxY;
			}*/
		}
	}

	entity.position.x = data.lastPosition.x;
	entity.position.y = data.lastPosition.y;
	
}

