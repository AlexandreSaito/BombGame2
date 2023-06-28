import * as conn from "../connection.js"
import BombGame from "./bombGame.js"
import { addImage, setItemList } from '../data.js'

const pingElement = document.getElementById("ping");
const fpsElement = document.getElementById("fps");
const clientFpsElement = document.getElementById("clientFps");

const charSelectorDialog = document.getElementById("char-selector-dialog");
const charSelector = document.getElementById("char-selector");
const btnSaito = document.getElementById("btn-saito");

const screen = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };

const canvasList = {
	entity: { canvas: document.getElementById("entity"), },
	item: { canvas: document.getElementById("item"), },
	cenario: { canvas: document.getElementById("cenario"), },
	effect: { canvas: document.getElementById("effect"), },
	debug: { canvas: document.getElementById("debug"), },
	ui: { canvas: document.getElementById("ui"), }
};

for (const itemName in canvasList) {
	const item = canvasList[itemName];
	if (!item.ctx) {
		item.ctx = item.canvas.getContext("2d");
		//set canvas size
		item.canvas.width = screen.width;
		item.canvas.height = screen.height;
	}
}

let currentFps = 0;
let currentClientFps = 0;

let game;

let preloading = null;

conn.on("connect_error", (err) => { console.error(`connect_error due to ${err.message}`); });

conn.emit('get-item-list', {}, (data) => { setItemList(data); });

conn.on('preload', (itens) => {
	console.log('preload', itens)
	preloading = itens.sprites.map(x => {
		const img = new Image();
		img.onload = () => {
			preloading = preloading.filter(y => y != img);
			console.log('loaded', x.src);
			addImage(x.src, img);
		};
		img.src = x.src;
		return img;
	});

	charSelector.innerHTML = Object.getOwnPropertyNames(itens.charList).map(x => `<option value="${itens.charList[x].id}">${itens.charList[x].name}</option>`);
	
});

conn.on('pong', (dt) => { pingElement.innerHTML = Date.now() - dt; });

conn.on('state', (gameState) => {
	//update local gamestate
	game?.updateState(gameState);
});

conn.on('changeMap', (map) => { game?.changeMap(map); });

conn.on('skill', (data) => {
	const char = game?.entities.find(x => x.id == data.userId);
	if (char) char.onSkill(data.name, data.data);
});

btnSaito.onclick = () => {
	charSelector.innerHTML = '<option value="saitoadm">saitoadm</option>';
};

charSelectorDialog.onsubmit = () => {
	const playerData = {
		char: charSelector.value
	};

	conn.emit('enter-game', playerData, (data) => {
		game.userId = data.userId;
		game.userAs = data.enterAs;
		game.changeMap(data.map);
	});
};

export function registerGame(newGame) {
	if (newGame == 'bombGame') game = new BombGame({
		canvasList: canvasList,
		cam: { width: screen.width, height: screen.height },
		screen: screen,
	});
	game.registerConnectionEvents();

	const join = (e) => {
		if (e.key == "F5") return;
		e.preventDefault();
		if (preloading == null || preloading.length > 0) {
			console.log('loading resources')
			return;
		}
		document.removeEventListener('keydown', join, false);

		// any player configuration has to be on dialog
		charSelectorDialog.showModal();
	};
	document.addEventListener('keydown', join, false);
}

export function startGameDrawLoop() {
	console.log(secondLoop);
	drawLoop();
}

const secondLoop = setInterval(() => {
	fpsElement.innerHTML = currentFps;
	clientFpsElement.innerHTML = currentClientFps;
	currentFps = 0;
	currentClientFps = 0;
	conn.emit('ping', Date.now());
}, 1000);
const gameLoop = setInterval(() => {
	currentFps++;
	if (!game) return;
	if (!game.running) {
		return;
	}

	// send player state
	if (game.player) {
		const state = { action: { ...game.player.action }, pos: { ...game.player.position }, animation: game.player.animation.currentAnimation };
		conn.emit('player-state', state);
	}
	game.update();

}, 1000 / 60);
const drawLoop = function() {
	currentClientFps++;
	game?.draw();
	requestAnimationFrame(drawLoop);
}
