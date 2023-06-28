import Observer from '../../observer.js'
import Object from '../object.js'
import * as game from '../game.js'
import { getChar } from './character.js';
import { powerup, draw } from '../../type.js'
const { powerUpsId, powerUps } = powerup;
const { drawType } = draw;

function setEffect(target, prop, value) {
	if (value == undefined || value == null) value = 1;
	if(value > 10) value = 10;
	if (!target[prop]) {
		if (!powerUpsId[prop]) return false;
		target[powerUpsId[prop]] = value;
		return true;
	}
	target[prop] = value;
	return true;
}

function getEffect(target, prop) {
	if (target[prop] == undefined) {
		if (!powerUpsId[prop] == undefined) throw new Error(`Fail to get effect ${prop}`);
		return target[powerUpsId[prop]];
	}
	return target[prop];
}

export default class Entity extends Object {
	constructor(objData) {
		if (!objData.name) objData.name = 'Entity';
		const char = getChar(objData.character);

		super({ ...objData, drawType: drawType.entity, animation: char.animation });

		this.maxLife = objData.maxLife;
		this.currentLife = this.maxLife;

		this.originalBombLimit = objData.defaultMaxBomb;
		this.bombLimit = this.originalBombLimit;
		//this.bombDeployed = 0;
		this.canWalk = true;
		
		this.invulnerableTime = 3000;
		this.invulnerable = false;
		this.highlight = true;

		this.skillBinding = char.skillBinding;
		
		this.skills = { };
		for(const skillName in char.skillBinding){
			this[skillName] = char[skillName];
			//this.skills[skillName] = {};
		}
		
		this.effects = new Proxy({
			bombPierce: 0, // -- pierce thru breakable wall
			bombCount: 0, // -- add max bomb
			bombSpread: 0, // -- add 1 tile of bomb spread
			maxLife: 0, // -- add max life
			bombDamage: 0, // -- add bomb damage
			speed: 0, // -- add movement speed (1 per effect)
		}, { set: setEffect, get: getEffect });

		for (const effect in objData.data.effects) this.effects[effect] = objData.data.effects[effect];

		this.onSkill = new Observer();
		this.onSkillIni = new Observer();
		this.onSkillEnd = new Observer();
		this.onMove = new Observer();
		this.onTakeDamage = new Observer();
		
		char.register(this);
	}

	skillStart(skill) {
		if(this.skills[skill] && this.skills[skill].onCD) return;
		this.onSkill.exec({ name: skill, entity: this });
	}

	skillInit(skill, data) {
		if(this.skills[skill] && this.skills[skill].onCD) return;
		if(!this.skills[skill]) this.skills[skill] = {};
		this.skills[skill].onCD = true;
		this.onSkillIni.exec({ name: skill, data, entity: this });
		if(this[skill].activeTime >= 0) this.skills[skill].active = true;
	}

	skillEnd(skill) {
		if(this[skill].activeTime > 0) this.skills[skill].active = false;
		this.onSkillEnd.exec({ name: skill, entity: this });
	}

	die(){
		if(this.id == game.getUserId()){
			game.requestDeath();
			this.death();
		}
	}
	
	death() { 
		console.log('i\'m dead');
		this.canWalk = false;
		this.animation.removeColorFilter();
		this.animation.changeAnimation('death');
		const onDeathEnd = (anime) => {
			if(anime.animator.currentAnimation != 'death') return;
			anime.animator.onAnimationEnd.remove(onDeathEnd);
			anime.animator.owner.isDead = true;
		};
		this.animation.onAnimationEnd.add(onDeathEnd);
	}

	move(direction){
		const lastPosition = { ...this.position };
		super.move(direction);
		if (direction.x == 0 && direction.y == 0) this.animation.changeAnimation('idle');
		else if (direction.y < 0) this.animation.changeAnimation('walkUp');
		else if (direction.y > 0) this.animation.changeAnimation('walkDown');
		else if (direction.x > 0) this.animation.changeAnimation('walkRight');
		else if (direction.x < 0) this.animation.changeAnimation('walkLeft');
		this.onMove.exec({ entity: this, lastPosition, direction });
	}

	setInvulnerable(time){
		if (time == undefined || time == null) time = this.invulnerableTime;
		this.invulnerable = true;
		let hasColor = false;
		const colorInterval = setInterval(() => { 
			if (hasColor) this.animation.removeColorFilter(); 
			else this.animation.addColorFilter(354);
			hasColor = !hasColor;
		}, 150);
		setTimeout(() => { clearInterval(colorInterval); this.invulnerable = false; this.animation.removeColorFilter(); }, time);
	}

	getMaxLife() {
		return this.maxLife + this.effects.maxLife;
	}
	
	takeDamage(amount, invulnerableTime) {
		if (this.invulnerable && amount > 0) return false;
		const fixedMaxLife = this.getMaxLife();
		this.currentLife -= amount;
		this.setInvulnerable(invulnerableTime);
		this.onTakeDamage.exec({ entity: this });
		if (this.currentLife >= fixedMaxLife) this.currentLife = fixedMaxLife;
		if (this.currentLife <= 0) { this.die(); return true; }
		if (amount > 0) this.animation.changeAnimation('takeHit');
		
		return true;
	}

	update() {
		super.update();		
	}

}