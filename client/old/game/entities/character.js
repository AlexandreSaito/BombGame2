import * as saito from './characters/saito.js';
import * as saitoadm from './characters/saitoadm.js';

function getDefault(char){
	return {
		animationJson: char.getAnimationJson(),
		skillBinding: char.skillBinding,
		skill1: char.skill1,
		skill2: char.skill2,
		skill3: char.skill3,
		skill4: char.skill4,
	};
}

export function getChar(char){
	if(char == 'saito') return getDefault(saito);
	if(char == 'saitoadm') return getDefault(saitoadm);
}
