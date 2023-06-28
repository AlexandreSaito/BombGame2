import Observer from './observer.js'
import * as game from './game/game.js'
import keys from "./json/keys.json" assert { type: 'json' };

let inGame = true;

const possibilities = {
	move: new Observer(),
	placeBomb: new Observer(),
	sendSkill: new Observer(),
};

export const controller = {
	setIngame: (ingame) => {
		inGame = ingame;
	},
	on: (action, func) => {
		possibilities[action].add(func);
	},
	remove: (action, func) => {
		possibilities[action].remove(func);
	}
} 

const onKeyDown = function (e) {
	if(!inGame || e.key == "F5") return;
	inGameControllerKeyDown(e);
};

const onKeyUp = function (e) {
	if(!inGame || e.key == "F5") return;
	inGameControllerKeyUp(e);
}


function inGameControllerKeyDown(e){
	const bind = keys.binds[e.key];
	if (!bind) return; 
	const player = game.getPlayer();
	if(!player) return;
	if (!player.actions[bind]) {
		console.log('key not found', e.key, bind);
	}
	const action = player.actions[bind];
	if(action.pressed) return;
	action.pressed = true;
	if(action.isHold) return;
	
}

function inGameControllerKeyUp(e){
	const bind = keys.binds[e.key];
	if (!bind) return; 
	const player = game.getPlayer();
	if(!player) return;
	if (!player.actions[bind]) {
		console.log('key not found', e.key, bind);
	}
	const action = player.actions[bind];
	action.pressed = true;
}

export function init(){
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

export function stop(){
	document.removeEventListener('keydown', onKeyDown, false);
	document.removeEventListener('keyup', onKeyUp, false);
}
