import animationJson from "../../../animation/setas.json" assert {type: 'json'};
import * as communs from './communs.js';
import * as gridMapEdit from '../../gridMapEditor.js'

export const skillBinding = {
	skill1: { pressed: false, isHold: false },
	skill2: { pressed: false, isHold: false },
	skill3: { pressed: false, isHold: false },
};

export function	getAnimationJson(){
	return animationJson;
}

export function skill1(data, currentSkillData){
	if(!data.tag || data.tag == '') throw new Error("Skill was sended without 'tag'");

	if(data.tag == 'press'){
		if(currentSkillData.onCD) return;
		if(currentSkillData.active) return;
		communs.emitSkill('skill1', { tag: 'init' });
		return;
	}
	
	if(data.tag == 'init'){
		currentSkillData.active = true;
		currentSkillData.onCD = true;
		currentSkillData.lastActive = Date.now();
		currentSkillData.activedTime = 1000;
		currentSkillData.CDTime = 1000;
		gridMapEdit.startEdit(this.game);
		return;
	}

	if(data.tag == 'inactive'){
		currentSkillData.active = false;
		gridMapEdit.stopEdit();
		return;
	}
	
	if(data.tag == 'clearCD'){
		currentSkillData.onCD = false;
		return;
	}
	
}

export function skill2(data, currentSkillData){
	if(!data.tag || data.tag == '') throw new Error("Skill was sended without 'tag'");

	if(data.tag == 'press'){
		if(currentSkillData.onCD) return;
		communs.emitSkill('skill2', { tag: 'init' });
		return;
	}
	
	if(data.tag == 'init'){
		currentSkillData.onCD = true;
		currentSkillData.lastActive = Date.now();
		currentSkillData.activedTime = 0;
		currentSkillData.CDTime = 1000;
		if(currentSkillData.active) {
			currentSkillData.active = false;
			gridMapEdit.stopEdit();
		}else {
			currentSkillData.active = true;
			gridMapEdit.startEdit(this.game);
		}
		return;
	}

	if(data.tag == 'inactive'){
		currentSkillData.active = false;
		return;
	}
	
	if(data.tag == 'clearCD'){
		currentSkillData.onCD = false;
		return;
	}
}

export function skill3(data, currentSkillData){
	if(!data.tag || data.tag == '') throw new Error("Skill was sended without 'tag'");

	if(data.tag == 'press'){
		if(currentSkillData.onCD) return;
		if(currentSkillData.active) return;
		communs.emitSkill('skill3', { tag: 'init' });
		return;
	}
	
	if(data.tag == 'init'){
		currentSkillData.active = true;
		currentSkillData.onCD = true;
		currentSkillData.lastActive = Date.now();
		currentSkillData.activedTime = 10000;
		currentSkillData.CDTime = 1000;
		if(this.id != this.game.userId) 
			this.animation.changeAnimation('invisible', function (x) { x.animation.isVisible = false; });
		else
			this.animation.changeAnimation('invisible', function (x) { currentSkillData.colorId = this.addColorFilter(0, 0, 25); });
		
		return;
	}

	if(data.tag == 'inactive'){
		currentSkillData.active = false;
		this.animation.isVisible = true;
		if(currentSkillData.colorId) this.animation.removeColorFilter(currentSkillData.colorId);
		return;
	}
	
	if(data.tag == 'clearCD'){
		currentSkillData.onCD = false;
		return;
	}
	
}
