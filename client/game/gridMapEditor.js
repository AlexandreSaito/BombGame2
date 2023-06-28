import * as conn from '../connection.js'
import * as game from './game.js'
import * as renderer from './renderer.js'
import { getItemList } from '../data.js'
import { draw } from '../type.js'
const { drawType } = draw;

const menus = document.getElementById("menus");
const wrapper = document.createElement('div');
menus.append(wrapper);

const selectedColor = "#2f4db959";
const screen = { width: document.documentElement.clientWidth,	height: document.documentElement.clientHeight }

const mouseRenderData = {  };

let currentMousePosition = { x: 0, y: 0 };
let positionList = [];
let editMode;
let itemConstructor;
let optionsItens;
let fillMode = '';

function renderMouseHightlight(){
	const canvasMouseHighlight = new OffscreenCanvas(game.gridSize, game.gridSize);
	const ctxMouseHighlight = canvasMouseHighlight.getContext('2d', { alpha: true });
	ctxMouseHighlight.fillStyle = selectedColor;
	ctxMouseHighlight.fillRect(0, 0, game.gridSize, game.gridSize);
	mouseRenderData.canvas = canvasMouseHighlight;
	mouseRenderData.width = game.gridSize;
	mouseRenderData.height = game.gridSize;
	mouseRenderData.position = currentMousePosition;
}

function toGridPos(position){
	const resX = (position.x >= 0 ? position.x : position.x * -1) % game.gridSize;
	const resY = (position.y >= 0 ? position.y : position.y * -1) % game.gridSize;
	const pos = { 
		x: position.x - (position.x >= 0 ? resX : resX * -1), 
		y: position.y - resY
	};
	return pos;
}

function setMousePos() {
	const resX = currentMousePosition.x % game.gridSize;
	const resY = currentMousePosition.y % game.gridSize;
	mouseRenderData.position = toGridPos(currentMousePosition);
	renderer.setItemCanvas({ ...mouseRenderData }, drawType.debug, -1, -2);
}

function renderGrid(){
	const scale = renderer.getScale();
	const fix = { width: screen.width + screen.width / scale.x, height: screen.height + screen.height / scale.y };
	const canvasGrid = new OffscreenCanvas(fix.width, fix.height);
	const ctxGrid = canvasGrid.getContext('2d');
	ctxGrid.clearRect(0, 0, fix.width, fix.height);
	for(let x = 0; x < fix.width; x += game.gridSize){
		for(let y = 0; y < fix.height; y += game.gridSize){
			ctxGrid.rect(x, y, game.gridSize, game.gridSize);
			ctxGrid.stroke();
		}
	}
	const renderData = { ...fix, canvas: canvasGrid, position: { x: 0, y: 0 } };
	renderer.setItemCanvas({ ...renderData }, drawType.debug, -1, -1);
}

function onMouseMove(data){
	currentMousePosition = data.inWorldPos;
	setMousePos();
	actions[editMode]?.onMouseMove(data);
}
function onMouseDown(data){
	currentMousePosition = data.inWorldPos;
	setMousePos();
	actions[editMode]?.onMouseDown(data);
}
function onMouseUp(data){
	currentMousePosition = data.inWorldPos;
	setMousePos();
	actions[editMode]?.onMouseUp(data);
}

export function startEdit(){
	console.log('editting map');
	renderGrid();
	renderMouseHightlight();
	loadActions();
	game.registerMouseEvent('mousemove', onMouseMove);
	game.registerMouseEvent('mouseup', onMouseUp);
	game.registerMouseEvent('mousedown', onMouseDown);
}

export function stopEdit(){
	console.log('closing editor');
	game.removeMouseEvent('mousemove', onMouseMove);
	game.removeMouseEvent('mouseup', onMouseUp);
	game.removeMouseEvent('mousedown', onMouseDown);
	renderer.setItemCanvas(null, drawType.debug, -1, -1);
	renderer.setItemCanvas(null, drawType.debug, -1, -2);
	wrapper.innerHTML = '';
}

const actions = {
	add: {
		onMouseDown: function(data) {
			fillMode = data.e.ctrlKey ? 'fill' : 'each';
			if (itemConstructor) positionList.push(toGridPos(data.inWorldPos));
		},
		onMouseMove: function(data) {
			if (positionList.length == 0 || fillMode == 'fill') return;
			const pos1 = toGridPos(data.inWorldPos);
			const pos2 = positionList.find(x => x.x == pos1.x && x.y == pos1.y);
			if (!pos2) positionList.push(pos1);
		},
		onMouseUp: function(data) {
			if(!itemConstructor) return;
			if(fillMode == 'fill'){
				const start = { ...positionList[0] };
				const end = data.inWorldPos;
				for(let x = start.x; x < end.x + game.gridSize; x += game.gridSize)
					for(let y = start.y; y < end.y + game.gridSize; y += game.gridSize)
						game.requestObject(itemConstructor({ x: x, y: y, width: game.gridSize, height: game.gridSize }));
				positionList = [];
				return;
			}
			if (itemConstructor({}).name == "wall" && positionList.length > 1) {
				const minX = positionList.map(x => x.x).sort((a, b) => a - b)[0];
				const maxX = positionList.map(x => x.x).sort((a, b) => b - a)[0];
				const minY = positionList.map(x => x.y).sort((a, b) => a - b)[0];
				const maxY = positionList.map(x => x.y).sort((a, b) => b - a)[0];
				game.requestObject(itemConstructor({ x: minX, y: minY, width: (maxX - minX) + game.gridSize, height: (maxY - minY) + game.gridSize }));
			} else {
				const data = {};
				if (itemConstructor({}).name == "powerup") data.powerup = prompt();
				for (let i = 0; i < positionList.length; i++) {
					game.requestObject(itemConstructor({ ...positionList[i], data: { ...data }, width: game.gridSize, height: game.gridSize }));
				}
				for(let i = 0; i < 1000; i++) {
					game.requestObject(itemConstructor({ ...positionList[0], data: { ...data }, width: game.gridSize, height: game.gridSize }));
				}
			}
			positionList = [];
		},
	},
	ping: {
		onMouseDown: function(data) { },
		onMouseMove: function(data) { },
		onMouseUp: function(data) {
			console.log("World POS: ", data.inWorldPos);
		},
	}
};

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