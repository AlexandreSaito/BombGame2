import Object from '../object.js'
import { powerUps, powerUpId } from '../../type.js'
import powerupAnimation from '../../animation/objects/powerup.json' assert { type: 'json' };

function getAnimationByPowerUp(powerup){
	const anime = powerupAnimation.find(x => x.name == powerUpId[powerup]);
	if(!anime) throw new Error(`animation not found ${powerup} - ${powerUpId[powerup]}`);
	return anime;
}

export default class Wall extends Object {
	constructor(objData, data) {
		objData.animationJson = getAnimationByPowerUp(data.powerup);
		super(objData);

		this.powerup = data.powerup;
		this.blockable = false;
		this.invulnerable = true;
		setTimeout(() => { this.invulnerable = false; }, 200);
	}

	getAnimeModfy() {	return this.powerup; }
	
	takeDamage() {
		if (!this.invulnerable) this.game.removeObject(this, true);
	}

	onCollide(obj) {
		if (obj.typeId == this.game.typesId.entity && obj.id == this.game.userId) this.game.collectPowerUp(this);
	}

}
