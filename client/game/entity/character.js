import * as conn from '../../connection.js'
import * as saito from './characters/saito.js';
import * as saitoadm from './characters/saitoadm.js';
import * as game from '../game.js'

function getDefault(char){

	const actionHandlers = defaultActionHandlers();
	const animationHandler = defaultAnimationHandlers();
	
	return {
		animation: char.getAnimationName(),
		skillBinding: char.skillBinding,
		register: (entity) => { 
			for (const handlerName in animationHandler.start) {
				const handler = animationHandler.start[handlerName];
				entity.animation.onAnimationStart.add(handler);
			}
			for (const handlerName in animationHandler.end) {
				const handler = animationHandler.end[handlerName];
				entity.animation.onAnimationEnd.add(handler);
			}
			for (const handlerName in actionHandlers) {
				if(!entity[handlerName]) throw new Error(`Observer not found ${handlerName}`);
				const handler = actionHandlers[handlerName];
				for(let i = 0; i < handler.length; i++){
					entity[handlerName].add(handler[i]);
				}
			}
			register(char, entity); 
		},
		skill1: char.skills.skill1,
		skill2: char.skills.skill2,
		skill3: char.skills.skill3,
		skill4: char.skills.skill4,
	};
}

export function getChar(char) {
	if(char == 'saito') return getDefault(saito, entity);
	if(char == 'saitoadm') return getDefault(saitoadm, entity);
}

function register(char, entity) {
	const skillsSended = {};
	const helpers = { game };
	entity.onSkill.add(function (data) { 
		if(skillsSended[data.name]) { data.stopProgapation = true; return; }
		const skill = char.skills[data.name];
		if(!skill) return;

		if(skill.activeTime < 0 && (!entity.skills[data.name] || !entity.skills[data.name].active)){
			setTimeout(() => { entity.skills[data.name].onCD = false; }, skill.activeTime * -1);
		}

		if(skill.isClient){
			entity.skillInit(data.name, data.data);
			return;
		}
		
		skillsSended[data.name] = true;
		setTimeout(() => { delete skillsSended[data.name]; }, 500);
		conn.emit('skill', { name: data.name, data: data.data }); 
	});
	entity.onSkillIni.add(function (data) {
		delete skillsSended[data.name];
		data.stopProgapation = true;
		
		const skill = char.skills[data.name];
		if(!skill) return;
		entity.skills[data.name].activeTimeStamp = Date.now();
		data.helpers = { ...helpers };
		
		skill.init(data);

		if(skill.activeTime >= 0){
			setTimeout(() => { entity.skillEnd(data.name); }, skill.activeTime);
		}
	});
	entity.onSkillEnd.add(function (data) {
		data.stopProgapation = true;

		const skill = char.skills[data.name];
		if(!skill) return;
		data.helpers = { ...helpers };
		
		skill.end(data);
		setTimeout(() => { delete entity.skills[data.name]; }, skill.cd);
	});
}

function defaultActionHandlers(){
	return {
		onTakeDamage: [
			function () {
				
			}
		],
	};
}

function defaultAnimationHandlers(){
	return {
		start: {
			death: function (anime){
				if(anime.currentAnimation != 'death') return;
			}
		},
		end: {
			death: function (anime){
				if(anime.currentAnimation != 'death') return;
				// place something?
			}
		}
	};
}
