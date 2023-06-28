import animationJson from "../../animation/setas.json" assert {type: 'json'};
import * as communs from './communs.js';
import * as gridMapEdit from '../../gridMapEditor.js'

export const skillBinding = {
	skill1: { pressed: false, isHold: false },
	skill2: { pressed: false, isHold: false },
	skill3: { pressed: false, isHold: false },
	skill4: { pressed: false, isHold: false },
};

export const skills = {
	skill1: {
		init: function (data) {
			
			if(data.entity.id == data.helpers.game.getUserId()) {
				const onAnimationEnd = ({ animator }) => {
					animator.addColorFilter(0, 0, 25);
					animator.onAnimationEnd.remove(onAnimationEnd);
				}
				data.entity.animation.onAnimationEnd.add(onAnimationEnd);
				data.entity.animation.changeAnimation('invisible');
			}
			else{
				const onAnimationEnd = ({ animator }) => {
					animator.isVisible = false;
					animator.onAnimationEnd.remove(onAnimationEnd);
				}
				data.entity.animation.onAnimationEnd.add(onAnimationEnd);
				data.entity.animation.changeAnimation('invisible');
			}
		},
		end: function (data) { 
			data.entity.animation.isVisible = true; 
			data.entity.animation.removeColorFilter();
		},
		isClient: false,
		cd: 1000 * 60 * 1,
		activeTime: 8000
	},
	skill2: {
		init: function (data) {
			if(data.entity.skills.skill2.active){
				data.entity.skillEnd('skill2');
				return;
			}
			gridMapEdit.startEdit();
			data.entity.skills.skill2.active = true;
		},
		end: function (data) { 
			gridMapEdit.stopEdit();
			data.entity.skills.skill2.active = false;
		},
		isClient: true,
		cd: 1000 * 60 * 0.1,
		activeTime: -1000
	}
};

export function	getAnimationName(){
	return 'setas';
}
