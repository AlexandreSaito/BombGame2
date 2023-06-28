import * as game from './game.js'
import * as renderer from './renderer.js'
import * as type from '../type.js'

const blockedColor = 'hsl(0,0%,35%,33)';

const canvasUIType = type.draw.drawType.ui;
const uiItemType = -500;
const lifeId = 1;
const powerUpId = 2;
const skillId = 3;

const icons = {};
for(const x in type.powerup.powerUpsId) { 
	const img = new Image(); 
	img.src = `/img/icons/${type.powerup.powerUpsId[x]}.png`; 
	icons[type.powerup.powerUpsId[x]] = img; 
}

const lifeFrame = type.toReadonly({
	textHeight: 10,
	frameSize: { x: 100, y: 20 },
	frameGap: { x: 1, y: 1 },
});

const powerupFrame = type.toReadonly({
	textHeight: 10,
	frameSize: 50,
	frameGap: { x: 10, y: 10 },
});

const skillFrame = type.toReadonly({
	textHeight: 10,
	frameSize: 40,
	frameGap: { x: 5, y: 5 },
});

let oldLife;
let oldMaxLife;
let powerup = [];

function fixSize(width, height, position, gap){
	const screenSize = renderer.getScreenSize();
	const fixedWidth = screenSize.width < 500 ? width / 2 : width;
	const fixedHeight = screenSize.width < 500 ? height / 2 : height;

	if(Array.isArray(position)){
		const w = position[0];
		const h = position[1];
		position = { x: 0, y: 0 };
		
		if(w == 'middle') position.x = screenSize.width / 2 - fixedWidth / 2;
		else if(w == 'right') position.x = screenSize.width - fixedWidth;
		else if(w == 'left') position.x = 0;
		else position.x = w;
		
		if(h == 'middle') position.y = screenSize.height / 2 - fixedHeight / 2;
		else if(h == 'bottom') position.y = screenSize.height - fixedHeight;
		else if(h == 'top') position.y = 0;
		else position.y = h;
	}

	if(gap) {
		if(gap.x) position.x -= gap.x;
		if(gap.y) position.y -= gap.y;
	}
	
	return {
		position: position,
		width: fixedWidth,
		height: fixedHeight
	}
}

function getCanvasLife(player){
	const width = lifeFrame.frameSize.x + lifeFrame.frameGap.x * 2;
	const height = lifeFrame.frameSize.y + lifeFrame.frameGap.y * 2;
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d', { alpha: true });
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'red';
	ctx.fillRect(lifeFrame.frameGap.x, lifeFrame.frameGap.y, lifeFrame.frameSize.x * (oldLife / oldMaxLife), lifeFrame.frameSize.y);

	ctx.font = "bold " + lifeFrame.textHeight + "px Arial";
	const text = `${oldLife}/${oldMaxLife}`;
	const metrics = ctx.measureText(text);
	const textWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
	ctx.fillStyle = 'white';
	ctx.fillText(text, width / 2 - textWidth / 2, height - lifeFrame.textHeight + 2);
	
	return {
		...fixSize(width, height, [ 10, 10 ]),
		canvas: canvas,
		fixed: true,
	};
}

function getCanvasPowerUp(player) {
	const width = powerupFrame.frameGap.x + (powerupFrame.frameSize + powerupFrame.frameGap.x) * powerup.length;
	const height = powerupFrame.frameSize + powerupFrame.frameGap.y * 2;
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d', { alpha: true });
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.font = "bold " + powerupFrame.textHeight + "px Arial";
	for(let i = 0; i < powerup.length; i++){
		const pu = powerup[i];
		ctx.fillStyle = 'white';
		const width = powerupFrame.frameGap.x + (powerupFrame.frameSize + powerupFrame.frameGap.x) * i;
		//ctx.fillRect(width, powerupFrame.frameGap.y, powerupFrame.frameSize, powerupFrame.frameSize);
		ctx.drawImage(icons[pu.name], width, powerupFrame.frameGap.y, powerupFrame.frameSize, powerupFrame.frameSize);
		const metrics = ctx.measureText(`${pu.qtd}`);
		const textWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
		const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

		if(pu.qtd == 0) {
			ctx.fillStyle = blockedColor;
			ctx.fillRect(width, powerupFrame.frameGap.y, powerupFrame.frameSize, powerupFrame.frameSize);
		}
		
		ctx.fillStyle = 'red';
		ctx.fillText(`${pu.qtd}`, width + powerupFrame.frameSize - textWidth - 2, powerupFrame.frameSize + powerupFrame.frameGap.y - textHeight + 5);
	}
	
	const w = fixSize(lifeFrame.frameSize.x + lifeFrame.frameGap.x * 2, 1, [ 1, 1 ]).width + 15;
	
	return {
		...fixSize(width, height, [ w, 10 ]),
		canvas: canvas,
		fixed: true,
	};
}

function getCanvasSkill(player){
	const width = skillFrame.frameSize * 4 + skillFrame.frameGap.x * 5;
	const height = skillFrame.frameSize + skillFrame.frameGap.y * 2;
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d', { alpha: true });
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.font = "bold " + skillFrame.textHeight + "px Arial";
	const lastTick = game.getTickTime();
	for(let i = 0; i < 4; i++) {
		const startWidth = skillFrame.frameGap.x + (skillFrame.frameGap.x + skillFrame.frameSize) * i;
		const maxWidth = skillFrame.frameGap.x + (skillFrame.frameGap.x + skillFrame.frameSize) * i + skillFrame.frameSize;
		const maxHeight = skillFrame.frameGap.y + skillFrame.frameSize;
		ctx.fillStyle = 'white';
		ctx.fillRect(startWidth, skillFrame.frameGap.y, skillFrame.frameSize, skillFrame.frameSize);
		// add skill icon
		const activedSkill = player.skills[`skill${i+1}`];
		const skill = player[`skill${i+1}`];
		if(!activedSkill || !skill) continue;
		let time = 0;
		
		if(activedSkill.onCD) {
			if(activedSkill.active) {
				if(skill.activeTime < 0) {
					const currentTimePassed = lastTick - (activedSkill.activeTimeStamp);
					time = ((skill.activeTime * -1) - currentTimePassed) / 1000;
				}else{
					time = skill.cd / 1000;
				}
			}else{
				const currentTimePassed = lastTick - (activedSkill.activeTimeStamp + (skill.activeTime < 0 ? skill.activeTime * -1 : skill.activeTime));
				time = (skill.cd - currentTimePassed) / 1000;
			}
		}

		if(activedSkill.active == false){
			ctx.fillStyle = blockedColor;
			ctx.fillRect(startWidth, skillFrame.frameGap.y, skillFrame.frameSize, skillFrame.frameSize);
		}
		
		const cdText = `${Math.floor(time)}s`;
		const cdMetrics = ctx.measureText(cdText);
		const cdTextWidth = cdMetrics.actualBoundingBoxRight + cdMetrics.actualBoundingBoxLeft;
		ctx.fillStyle = 'red';
		ctx.fillText(cdText, maxWidth - cdTextWidth - 2, maxHeight - skillFrame.textHeight + 5);
	}
	
	const h = fixSize(1, powerupFrame.frameSize + powerupFrame.frameGap.y * 2, [ 1, 1 ]).height + 15;
	
	return {
		...fixSize(width, height, [ 'middle', h ]),
		canvas: canvas,
		fixed: true,
	};
}

export function update() {
	const player = game.getPlayer();
	if(!player) return;
	if(player.currentLife != oldLife || player.getMaxLife() != oldMaxLife) {
		oldMaxLife = player.getMaxLife();
		oldLife = player.currentLife;
		const canvasLife = getCanvasLife(player);
		renderer.setItemCanvas(canvasLife, canvasUIType, uiItemType, lifeId);
	}
	let hasPowerUpChange = false;
	for(const effectName in player.effects) {
		const old = powerup.find(x => x.name == effectName);
		const qtd = player.effects[effectName];
		if(!old) {
			powerup.push({ name: effectName, qtd: qtd });
			hasPowerUpChange = true;
			continue;
		}
		if(old.qtd != qtd) {
			old.qtd = qtd;
			hasPowerUpChange = true;
		}
	}
	if(hasPowerUpChange) {
		const canvasPowerUp = getCanvasPowerUp();
		renderer.setItemCanvas(canvasPowerUp, canvasUIType, uiItemType, powerUpId);
	}
	const canvasSkill = getCanvasSkill(player);
	renderer.setItemCanvas(canvasSkill, canvasUIType, uiItemType, skillId);
}
