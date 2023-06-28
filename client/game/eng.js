import { addImage, setItemList } from '../data.js'
import { toReadonly, draw } from '../type.js'
import * as renderer from './renderer.js'
import * as conn from "../connection.js"
import * as game from './game.js'
import * as gameUI from './gameUI.js'

const pingElement = document.getElementById("ping");
const fpsElement = document.getElementById("fps");
const clientFpsElement = document.getElementById("clientFps");

const charSelectorDialog = document.getElementById("char-selector-dialog");
const charSelector = document.getElementById("char-selector");
const btnSaito = document.getElementById("btn-saito");

const screen = { 
	width: document.documentElement.clientWidth,
	height: document.documentElement.clientHeight 
};

const canvasList = toReadonly({
	entity: { canvas: document.getElementById("entity") },
	item: { canvas: document.getElementById("item") },
	cenario: { canvas: document.getElementById("cenario") },
	effect: { canvas: document.getElementById("effect") },
	debug: { canvas: document.getElementById("debug") },
	ui: { canvas: document.getElementById("ui") }
});

for (const itemName in canvasList) {
	const item = canvasList[itemName];
	if (!item.ctx) {
		item.ctx = item.canvas.getContext("2d");
		//set canvas size
		item.canvas.width = screen.width;
		item.canvas.height = screen.height;
	}
}

export function getScreen() { return screen; }
export function getCanvasList() { return canvasList; }

let fps = 0;
let clientFps = 0;

let preloading = null;

btnSaito.onclick = () => { charSelector.innerHTML = '<option value="saitoadm">saitoadm</option>'; };

charSelectorDialog.onsubmit = () => {
	const playerData = { char: charSelector.value };

	conn.emit('enter-game', playerData, (data) => {
		game.init();
		game.setUser(data.userId, data.enterAs);
		changeMap(data.map);
	});
};

export function registerGame() {
	conn.on('object-add', (data) => { game.onObjectAdd(data); });
	conn.on('object-delete', (data) => { game.onObjectDelete(data); });
	conn.on('object-state', (data) => { game.onObjectState(data); });
	conn.on('death', (data) => { const entity = game.getEntity(data.userId); if(entity) entity.death(); });
	
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
	renderLoop();
}

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

conn.on('state', (gameState) => { game.updateState(gameState); });

conn.on('changeMap', changeMap);

conn.on('skill', (data) => {
	const char = game.getEntity(data.userId);
	if (char) char.skillInit(data.name, data.data);
});

conn.on('bomb-explode', (data) => { game.bombExplode(data.bombId, data.explosion); });
	
function changeMap(map) {
	game.clearObject();
	map.objects.sort(x => x.typeId).forEach(data => { game.addObject(data); });
}

function renderLoop() {
	clientFps++;
	renderer.render();
	gameUI.update();
	requestAnimationFrame(renderLoop);
}

const loop = setInterval(() => {
	fps++;
	game.updateDraw();
	game.update();
	const player = game.getPlayer();
	if(player){
		const state = { action: { ...player.action }, pos: { ...player.position }, animation: player.animation.currentAnimation };
		conn.emit('player-state', state);
	}
}, 1000/60);

const minuteTimer = setInterval(() => {
	conn.emit('ping', Date.now());
	clientFpsElement.innerHTML = clientFps;
	fpsElement.innerHTML = fps;
	clientFps = 0;
	fps = 0;
}, 1000);
