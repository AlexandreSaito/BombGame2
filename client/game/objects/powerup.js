import Object from '../object.js'
import { powerup } from '../../type.js'
import * as game from '../game.js'
import { typesId } from '../../type.js'
const { powerUps, powerUpsId } = powerup;

export default class PowerUp extends Object {
	constructor(objData, data) {
		objData.animation = 'powerup';
		super(objData);

		this.animation.changeAnimation(powerUpsId[data.powerup]);
		this.powerup = data.powerup;
		this.blockable = false;
		this.invulnerable = true;
		setTimeout(() => { this.invulnerable = false; }, 200);
	}

	getAnimeModfy() {	return this.powerup; }
	
	takeDamage() {
		if (!this.invulnerable) game.requestRemoveObject(this);
	}

	onCollide(obj) {
		if (obj.typeId == typesId.entity && obj.id == game.getUserId()) game.collectPowerUp(this);
	}

}
