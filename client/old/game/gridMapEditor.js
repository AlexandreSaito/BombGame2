import * as conn from '../connection.js'
import { typeIdName } from '../type.js'
import { getItemList } from '../data.js'

const canvas = document.getElementById("game");
const menus = document.getElementById("menus");
const wrapper = document.createElement('div');
menus.append(wrapper);

let oldScale;
let editing = false;
let current;
let ctx;
let editMode;
let itemConstructor;
let optionsItens;

function createOptionMenu(name, title, itens, position) {
	const menu = document.createElement("nav");
	menu.classList.add("floating-menu");
	if (position) position.forEach(x => { menu.classList.add(x); });
	let html = "";
	itens.forEach((x) => { html += `<li><label><input id="${x.id}" type="radio" name="${name}" /> ${x.name}</label></li>`; });
	menu.innerHTML = `<h3>${title}</h3><ul>${html}</ul>`;
	return menu;
}

function onSelectAddItem(e) {
	editMode = "add";
	wrapper.append(optionsItens);
}
function onSelectPing(e) {
	editMode = "ping";
	optionsItens.remove();
}

function loadActions() {
	const optionsMenu = createOptionMenu("option-map-edit", "Map editing", [
		{ id: "add-item", name: "Add" },
		{ id: "ping-position", name: "Ping" },
	], ["right"]);

	optionsMenu.querySelector("#add-item").onchange = onSelectAddItem;
	optionsMenu.querySelector("#ping-position").onchange = onSelectPing;
	wrapper.append(optionsMenu);
	const data = getItemList();
	const itens = [];
	for (const item in data) { itens.push({ id: item, name: data[item].name }); }
	optionsItens = createOptionMenu("option-item-map-edit", "Item list", itens, ["right", "bottom"]);
	for (const item in data) {
		optionsItens.querySelector(`#${item}`).onchange = () => { 
			itemConstructor = (d) => { 
				const itemData = { ...data[item], name: item, position: { x: d.x, y: d.y }, width: d.width, height: d.height, god: true };  
				if(!itemData.data) itemData.data = {};
				itemData.data = { ...itemData.data, ...d.data };
				return itemData; 
			} 
		};
	}
}

let positionList = [];

function makeGrid() {
	ctx.save();
	ctx.fillStyle = "#2f4db959";
	for (let i = 0; i < positionList.length; i++) {
		ctx.fillRect((positionList[i].x - current.camera.position.x) * current.camera.scale, (positionList[i].y - current.camera.position.y) * current.camera.scale, current.mapGridSize * current.camera.scale, current.mapGridSize * current.camera.scale);
	}
	ctx.restore();
}

function currentMousePosToGrid() {
	const pos = {
		x: current.lastMouseScreenPos.worldPos.x - (current.lastMouseScreenPos.worldPos.x % current.mapGridSize),
		y: current.lastMouseScreenPos.worldPos.y - (current.lastMouseScreenPos.worldPos.y % current.mapGridSize)
	};
	return pos;
}

let fillMode = '';

const actions = {
	add: {
		onMouseDown: function(e) {
			fillMode = e.ctrlKey ? 'fill' : 'each';
			if (itemConstructor) positionList.push(currentMousePosToGrid(e));
		},
		onMouseMove: function(e) {
			if (positionList.length == 0 || fillMode == 'fill') return;
			const pos1 = currentMousePosToGrid(e);
			const pos2 = positionList.find(x => x.x == pos1.x && x.y == pos1.y);
			if (!pos2) positionList.push(pos1);
		},
		onMouseUp: function(e) {
			if(fillMode == 'fill'){
				const start = { ...positionList[0] };
				const end = currentMousePosToGrid(e);
				for(let x = start.x; x < end.x + current.mapGridSize; x += current.mapGridSize)
					for(let y = start.y; y < end.y + current.mapGridSize; y += current.mapGridSize)
						current.addObject(itemConstructor({ x: x, y: y, width: current.mapGridSize, height: current.mapGridSize }));
				positionList = [];
				return;
			}
			if (itemConstructor({}).name == "wall" && positionList.length > 1) {
				const minX = positionList.map(x => x.x).sort((a, b) => a - b)[0];
				const maxX = positionList.map(x => x.x).sort((a, b) => b - a)[0];
				const minY = positionList.map(x => x.y).sort((a, b) => a - b)[0];
				const maxY = positionList.map(x => x.y).sort((a, b) => b - a)[0];
				current.addObject(itemConstructor({ x: minX, y: minY, width: (maxX - minX) + current.mapGridSize, height: (maxY - minY) + current.mapGridSize }));
			} else {
				const data = {};
				if (itemConstructor({}).name == "powerup") data.powerup = prompt();
				for (let i = 0; i < positionList.length; i++) {
					current.addObject(itemConstructor({ ...positionList[i], data: { ...data }, width: current.mapGridSize, height: current.mapGridSize }));
				}
			}
			positionList = [];
		},
	},
	ping: {
		onMouseDown: function(e) { },
		onMouseMove: function(e) { },
		onMouseUp: function(e) {
			console.log("World POS: ", currentMousePosToGrid(e));
		},
	}
};

function onMouseDown(e) {
	if (!editMode) return;
	actions[editMode].onMouseDown(e);
};

function onMouseMove(e) {
	if (!editMode) return;
	actions[editMode].onMouseMove(e);
}

function onMouseUp(e) {
	if (!editMode) return;
	actions[editMode].onMouseUp(e);
}

export function startEdit(game) {
	if (!editing) {
		console.log("editing...");
		current = game;
		ctx = game.debugCtx;
		editing = true;
		oldScale = current.camera.scale;
		game.hasCenarioUpdate = true;
		current.onMouseDown = onMouseDown;
		current.onMouseMove = onMouseMove;
		current.onMouseUp = onMouseUp;
		//current.camera.scale = 1;
		current.debugDraw = makeGrid;
		current.mapGrid.show = true;
		current.mapGrid.showMouseOverlay = true;
		current.hasCenarioUpdate = true;
		loadActions();
	} else {
		stopEdit();
	}
}

export function stopEdit() {
	current.onMouseDown = null;
	current.onMouseMove = null;
	current.onMouseUp = null;
	current.debugDraw = null;
	current.camera.scale = oldScale;
	current.hasCenarioUpdate = true;
	current.mapGrid.show = false;
	current.mapGrid.showMouseOverlay = false;
	wrapper.innerHTML = '';
	editMode = null;
	editing = false;
	itemConstructor = null;
}
