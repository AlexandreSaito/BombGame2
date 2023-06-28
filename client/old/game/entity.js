import Object from './object.js'
import animationJsonn from "../animation/teste.json" assert { type: 'json' };
import { getChar } from './entities/character.js';
import { powerUpId, powerUps } from '../type.js'

function setEffect(target, prop, value) {
	if (value == undefined || value == null) value = 1;
	if (!target[prop]) {
		if (!powerUpId[prop]) return false;
		target[powerUpId[prop]] = value;
		return true;
	}
	target[prop] = value;
	return true;
}

function getEffect(target, prop) {
	if (target[prop] == undefined) {
		if (!powerUpId[prop] == undefined) throw new Error(`Fail to get effect ${prop}`);
		return target[powerUpId[prop]];
	}
	return target[prop];
}

export default class Entity extends Object {
	constructor({ x, y, z, type, typeId, width, height, game, id, name, character, data }) {
		if (!name) name = 'Entity';

		const char = getChar(character);

		super({ x, y, z, type: game.types.entity, typeId: typeId, width, height, game, name, hasAnimation: false, animationJson: char.animationJson });

		this.id = id;

		this.maxLife = 3;
		this.currentLife = this.maxLife;

		this.originalBombLimit = 1;
		this.bombLimit = this.originalBombLimit;
		this.bombDeployed = 0;

		this.invulnerableColorInterval = 150;
		this.invulnerableTime = 3000;
		this.invulnerable = false;
		this.currentLife = this.maxLife;
		this.highlight = true;

		this.skillBinding = char.skillBinding;
		
		this.skills = { };
		for(const skillName in char.skillBinding){
			this[skillName] = char[skillName];
			this.skills[skillName] = {};
		}
		
		this.effects = new Proxy({
			bombPierce: 0, // -- pierce thru breakable wall
			bombCount: 0, // -- add max bomb
			bombSpread: 0, // -- add 1 tile of bomb spread
			maxLife: 0, // -- add max life
			bombDamage: 0, // -- add bomb damage
			speed: 0, // -- add movement speed (1 per effect)
		}, { set: setEffect, get: getEffect });

		for (const effect in data.effects) this.effects[effect] = data.effects[effect];

	}

	onSkill(skill, data){
		if(!this.skills[skill]) throw new Error(`Skill not registered ${skill}`);
		if(!this[skill]) throw new Error(`Skill action not registered ${skill}`);
		const currentSkillData = this.skills[skill];
		console.log('USING Skill', skill, data, currentSkillData, this);
		this[skill](data, currentSkillData);
	}
			
	onDeath() { console.log('i\'m dead') }

	getAnimation() {
		if (this.invulnerable) return false;
	}

	takeDamage(amount, invulnerableTime) {
		if (this.invulnerable && amount > 0) return false;
		if (invulnerableTime == undefined || invulnerableTime == null) invulnerableTime = this.invulnerableTime;
		this.invulnerable = true;
		this.hasChange = true;
		let lastId = null;
		const addColor = () => { lastId = this.animation.addColorFilter(354); };
		const remColor = () => { lastId = this.animation.removeColorFilter(lastId); };
		const colorInterval = setInterval(() => { if (lastId) remColor(); else addColor(); }, this.invulnerableColorInterval);
		setTimeout(() => { clearInterval(colorInterval); this.invulnerable = false; this.hasChange = false; remColor(); }, invulnerableTime);
		this.currentLife -= amount;
		console.log(this.currentLife);
		if (amount > 0) this.animation.changeAnimation('takeHit');
		const fixedMaxLife = this.maxLife + this.effects.maxLife;
		if (this.currentLife >= fixedMaxLife) this.currentLife = fixedMaxLife;
		if (this.currentLife <= 0) this.onDeath();
		return true;
	}

	update() {
		super.update();

		for(const skillName in this.skills){
			const skill = this.skills[skillName];
			if(skill.active){
				if(skill.activedTime > 0 && this.game.currentTime - skill.lastActive >= skill.activedTime){
					this.onSkill(skillName, { tag: 'inactive' });
				}
			}
			if(skill.onCD){
				if(this.game.currentTime - (skill.lastActive + skill.activedTime) >= skill.CDTime) {
					this.onSkill(skillName, { tag: 'clearCD' });
				}
			}
		}
		
		this.hasChange = true;
	}

}