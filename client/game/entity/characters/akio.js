import animationJson from "../../animation/setas.json" assert {type: 'json'};
import * as renderer from '../../renderer.js'
import * as type from '../../../type.js'
const aExternal = document.getElementById('a-external');

export const skillBinding = {
	skill1: { pressed: false, isHold: false },
	skill2: { pressed: false, isHold: false },
	skill3: { pressed: false, isHold: false },
	skill4: { pressed: false, isHold: false },
};

export const skills = {
	skill1: {
		init: function (data) {
			data.entity.canWalk = false;
			// play animation
			// on end animation
			//setTimeout(() => { data.entity.skillEnd('skill1'); }, data.entity.skill1.activeTime);
		},
		end: function (data) { 
			data.entity.canWalk = true;
			aExternal.href = 'https://www.notion.so/pt-br';
			aExternal.click();
		},
		isClient: true,
		cd: 1000 * 60 * 0.01,
		activeTime: 10000
	},
	skill2: {
		init: function (data) {
			if(data.entity.skills.skill2.active) {
				data.entity.skillEnd('skill2');
				return;
			}
			if(data.entity.id == data.helpers.game.getUserId()){
				if(!data.entity.skillData) data.entity.skillData = {};
				if(!data.entity.skillData.onShoot) {
					data.entity.skillData.aimId = renderer.getSingleId(-10);
					data.entity.skillData.canvas = new OffscreenCanvas(data.helpers.game.gridSize, data.helpers.game.gridSize);
					drawAim(data.entity.skillData.canvas, data);
					data.entity.skillData.onShoot = (e) => { shoot(e, data); };
					data.entity.skillData.onAimMove = (e) => { onAimMove(e, data); };
				}
				data.helpers.game.registerMouseEvent('mouseup', data.entity.skillData.onShoot);
				data.helpers.game.registerMouseEvent('mousemove', data.entity.skillData.onAimMove);
			}
			data.entity.skills.skill2.active = true;
			data.entity.skillData.endSkill2Timeout = setTimeout(() => { if(data.entity.skills.skill2?.active) data.entity.skillEnd('skill2'); }, data.entity.skill2.activeTime * 2 * -1);
		},
		end: function (data) { 
			if(data.entity.id == data.helpers.game.getUserId()){
				data.helpers.game.removeMouseEvent('mouseup', data.entity.skillData.onShoot);
				data.helpers.game.removeMouseEvent('mousemove', data.entity.skillData.onAimMove);
				renderer.setItemCanvas(null, renderer.getDrawType().effect, -10, data.entity.skillData.aimId);
			}
			clearTimeout(data.entity.skillData.endSkill2Timeout);
			data.entity.skills.skill2.active = false;
		},
		isClient: true,
		cd: 1000 * 60 * 0.1,
		activeTime: -8000
	}
};

export function	getAnimationName(){
	return 'setas';
}

function drawAim(canvas, data){
	const ctx = canvas.getContext('2d');
	ctx.fillRect(0, 0, data.helpers.game.gridSize, data.helpers.game.gridSize);
}

function onAimMove(eventData, data){
	// change entity animation?
	
	// place aim
	const canvasData = {
		canvas: data.entity.skillData.canvas,
		position: eventData.asGridPos,
		width: data.helpers.game.gridSize,
		height: data.helpers.game.gridSize
	};
	renderer.setItemCanvas(canvasData, renderer.getDrawType().effect, -10, data.entity.skillData.aimId);
}

function shoot(eventData, data){
	// invoke shoot
	data.helpers.game.requestObject({ 
		type: type.typesId.projectile, 
		name: 'projectile', 
		position: { ...data.entity.position }, 
		width: data.helpers.game.gridSize / 3,
		height: data.helpers.game.gridSize / 3,
		data: { 
			destination: { 
				x: eventData.asGridPos.x + (data.helpers.game.gridSize - data.helpers.game.gridSize / 3) / 2, 
				y: eventData.asGridPos.y + (data.helpers.game.gridSize - data.helpers.game.gridSize / 3) / 2
			}, 
			type: 'akio_shoot' 
		} 
	});
	data.entity.skillEnd('skill2');
}
