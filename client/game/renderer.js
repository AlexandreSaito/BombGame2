import { toReadonly, draw } from '../type.js'
import * as eng from './eng.js'
const { drawTypeId } = draw; 

let rerender = false;

const renderer = { 
	position: { x: 0, y: 0 },
	scale: { x: 0.5, y: 0.5 },
	screen: { x: 0, y: 100 }
};

const renderData = {};

export function getScreenSize(){
	return eng.getScreen();;
}

export function getGameScreenPosition(){
	return { ...renderer.screen };
}

export function getScale(){
	return { ...renderer.scale };
}

export function getGameRendererPosition(){
	return { ...renderer.position };
}

function getCanvas(type) {
	const canvasList = eng.getCanvasList();
	return canvasList[drawTypeId[type]];
}

export function setRendererScale(scale){
	if(scale.x) renderer.scale.x = scale.x;
	if(scale.y) renderer.scale.y = scale.y;
}

export function setRendererSize(width, height){
	
}

export function setGameScreenPosition(position){
	if(position.x != null && position.x != undefined) renderer.screen.x = position.x;
	if(position.y != null && position.y != undefined) renderer.screen.y = position.y;
}

export function moveRenderer(position){
	const velocity = 10;
	if(position.x) renderer.position.x += (position.x * velocity);
	if(position.y) renderer.position.y = (position.y * velocity);
	rerender = true;
}

export function setItemCanvas(drawData, drawType, itemType, itemId){
	if(!drawData) { 
		if(renderData[drawType] && renderData[drawType][itemType] && renderData[drawType][itemType][itemId]){
			delete renderData[drawType][itemType][itemId];
			getCanvas(drawType).hasUpdate = true;
		}
		return;
	}
	if(!renderData[drawType]) renderData[drawType] = {};
	if(!renderData[drawType][itemType]) renderData[drawType][itemType] = {};
	const item = renderData[drawType][itemType][itemId];
	if(item && item.canvas == drawData.canvas && item.height == drawData.height && item.width == drawData.width && 
		 item.position.x == drawData.position.x && item.position.y == drawData.position.y)
		return;
	renderData[drawType][itemType][itemId] = drawData;
	getCanvas(drawType).hasUpdate = true;
}

export function render(){
	renderGame();
	renderUI();
}

function renderGame(){
	for(const drawType in renderData) {
		const drawData = renderData[drawType];
		const canvasData = getCanvas(drawType);
		if(canvasData.hasUpdate == false && rerender == false) continue;
		const ctx = canvasData.ctx;
		ctx.clearRect(0, 0, canvasData.canvas.width, canvasData.canvas.height);
		for(const typeId in drawData) {
			const type = drawData[typeId];
			for(const id in type){
				const data = type[id];
				const x = data.fixed ? data.position.x : (data.position.x - renderer.position.x) * renderer.scale.x + renderer.screen.x;
				const y = data.fixed ? data.position.y : (data.position.y - renderer.position.y) * renderer.scale.y + renderer.screen.y;
				if(data.fixed) ctx.drawImage(data.canvas, x, y, data.width, data.height);
				else ctx.drawImage(data.canvas, x, y, data.width * renderer.scale.x, data.height * renderer.scale.y);
			}
		}
		canvasData.hasUpdate = false;
	}
}

function renderUI(){
	
}

export function getMousePosAsWorldPos(e) {
	const pos = { x: renderer.position.x + e.offsetX - renderer.screen.x, y: renderer.position.y + e.offsetY - renderer.screen.y};
	pos.x = Math.trunc(pos.x / renderer.scale.x);
	pos.y = Math.trunc(pos.y / renderer.scale.y);
	return pos;
}
