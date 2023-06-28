import * as conn from '../connection.js'
import { typeIdName } from '../type.js'

function createOptionMenu(name, title, itens, position){
	const menu = document.createElement("nav");
	menu.classList.add("floating-menu");
	if(position) position.forEach(x => { menu.classList.add(x); });

	let html = "";

	itens.forEach((x, i) => {
		html += `<li><label><input id="${x.id}" type="radio" name="${name}" /> ${x.name}</label></li>`;
	});
	
	menu.innerHTML = `
<h3>${title}</h3>
<ul>${html}</ul>
	`;

	return menu;
}

const canvas = document.getElementById("game");

const menus = document.getElementById("menus");

const optionsMenu = createOptionMenu("option-map-edit", "Map editing", [ 
	{ id: "add-item", name: "Add" }, 
	{ id: "grab-item", name: "Grab" }, 
	{ id: "resize-item", name: "Resize" }, 
], [ "right" ]);

optionsMenu.querySelector("#add-item").onchange = onSelectAddItem;
optionsMenu.querySelector("#grab-item").onchange = onSelectGrabItem;
optionsMenu.querySelector("#resize-item").onchange = onSelectResizeItem;

let itensData = null;
let optionsItens = null;

conn.emit('get-item-list', {}, (data) => {
	//console.log('get-item-list', data);
	
	itensData = data;
	const itens = [];
	for(const item in data){
		itens.push({ id: item, name: data[item].name });
	}

	optionsItens = createOptionMenu("option-item-map-edit", "Item list", itens, [ "right", "bottom" ]);
	
	for(const item in data){
		optionsItens.querySelector(`#${item}`).onchange = () => { itemConstructor = (d) => { return { ...data[item], x : d.x, y: d.y } } };
	}
		
});

let current;
let currentObject;
let oldScale = 0;
let editing = false;

let editMode = null;

let itemConstructor = null;

let grabbedItem = null;
let resizebleItem = null;
let resizinItem = null;

const actions = {
	add: {
		onMouseDown: (e) => {
			const pos = getMousePosAsWorldPos(e);
			const drawData = itemConstructor(pos);
			console.log('drawData', drawData);
			currentObject = current.insertObject(drawData);
		},
		onMouseMove: (e) => {
			if(!currentObject || !currentObject.resizeable) return;
			const pos = getMousePosAsWorldPos(e);
			const endX = pos.x - currentObject.position.x;
			const endY = pos.y - currentObject.position.y;
			if(endX < 0){
				currentObject.setX(currentObject.position.x + endX);
				currentObject.setWidth(endX * -1);
			}else{
				currentObject.setWidth(endX);
			}
			if(endY < 0){
				currentObject.setY(currentObject.position.y + endY);
				currentObject.setHeight(endY * -1);
			}else{
				currentObject.setHeight(endY);
			}
		},
		onMouseUp: (e) => {
			if(!currentObject) return;
			currentObject.calcMax();
			current.removeObject(currentObject);
			current.addObject({ name: typeIdName[currentObject.typeId], position: currentObject.position, width: currentObject.width, height: currentObject.height });
			currentObject = null;
		},
	},
	grab: {
		onMouseDown: (e) => {
			const pos = getMousePosAsWorldPos(e);
			// find item
			grabbedItem = current.map.objects.find(x => x.position.x <= pos.x && x.maxX >= pos.x && x.position.y <= pos.y && x.maxY >= pos.y);
			if(grabbedItem) grabbedItem.highlight = true
		},
		onMouseMove: (e) => {
			if(!grabbedItem) return;
			const pos = getMousePosAsWorldPos(e);
			grabbedItem.position.x = pos.x;
			grabbedItem.position.y = pos.y;
		},
		onMouseUp: (e) => {
			if(!grabbedItem) return;
			grabbedItem.highlight = false
			grabbedItem.calcMax();
			grabbedItem = null;
		},
	},
	resize: {
		onMouseDown: (e) => {
			if(!resizebleItem || !resizebleItem.resizeable) return;
			const pos = getMousePosAsWorldPos(e);
			resizinItem = resizebleItem;
		},
		onMouseMove: (e) => {
			const pos = getMousePosAsWorldPos(e);
			if(!resizinItem){
				const newResizebleItem = current.map.objects.find(x => x.position.x == pos.x || x.maxX == pos.x || x.position.y == pos.y || x.maxY == pos.y);
				if(!newResizeableItem.resizeable) return;
				if(newResizebleItem) {
					resizebleItem = newResizebleItem 
					resizebleItem.highlight = true
				}
				else if (resizebleItem){
					resizebleItem.highlight = false
					resizebleItem = null
				}
				return;
			}

			if(pos.x <= resizinItem.position.x) return;
			if(pos.y <= resizinItem.position.y) return;

			resizinItem.width = pos.x - resizinItem.position.x;
			resizinItem.height = pos.y - resizinItem.position.y;
			
		},
		onMouseUp: (e) => {
			if(!resizinItem) return;
			resizinItem.highlight = false
			resizinItem.calcMax();
			resizinItem = null;
		},
	}
}

function onSelectAddItem(e){
	editMode = "add";
	menus.append(optionsItens);
}
function onSelectGrabItem(e){
	editMode = "grab";
	optionsItens.remove();
}
function onSelectResizeItem(e){
	editMode = "resize";
	optionsItens.remove();
}


function getMousePosAsWorldPos(e){
	const pos = { x: current.camera.position.x + e.offsetX, y: current.camera.position.y + e.offsetY };
	if(current.camera.followPlayer){
		pos.x += current.camera.render.width / 2 - current.player.width / 2;
		pos.y += current.camera.render.height / 2 - current.player.height / 2;
	}
	pos.x = Math.trunc(pos.x / current.camera.scale);
	pos.y = Math.trunc(pos.y / current.camera.scale);
	return pos;
}

function onMouseDown (e) {
	if(!editMode) return;
	actions[editMode].onMouseDown(e);
};

function onMouseMove(e){
	if(!editMode) return;
	actions[editMode].onMouseMove(e);
}

function onMouseUp(e){
	if(!editMode) return;
	actions[editMode].onMouseUp(e);
}

export function printMap(){
	if(editing){
		console.log(current);
		console.log(current.map.objects);
	}
}

export function startEdit(game){
	if(!editing){
		console.log("editing...");
		current = game;
		canvas.onmousedown = onMouseDown;
		canvas.onmousemove = onMouseMove;
		canvas.onmouseup = onMouseUp;
		editing = true;
		menus.append(optionsMenu);
		oldScale = current.camera.scale;
		current.camera.scale = 1;
	}else{
		canvas.onmousedown = null;
		canvas.onmousemove = null;
		canvas.onmouseup = null;
		editing = false;
		editMode = null;
		optionsMenu.remove();
		optionsItens.remove();
		current.camera.scale = oldScale;
	}
}
