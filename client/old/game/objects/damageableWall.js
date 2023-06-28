import Object from "../object.js";
import animation from '../../animation/objects/damageableWall.json' assert {type: 'json'};
import { typeId, objectType, objectNames } from '../../type.js'

export default class DmgWall extends Object{
	constructor(data, wallData){
		data.animationJson = animation;
		super(data);

		this.powerup = wallData.powerup;
		this.hasChange = false;
		this.currentLife = 1;
	}

	onRemove(){
		if(this.powerup != null && this.powerup != undefined)
			// resize?
			this.game.insertObject({ position: { ...this.position }, width: this.width, height: this.height, name: objectNames.powerup, typeId: typeId.powerup, type: objectType.item, id: this.id, data: { powerup: this.powerup } });
	}
	
	takeDamage(amount){
		this.currentLife -= amount;
		if(this.currentLife >= this.maxLife) this.currentLife = this.maxLife;
		if(this.currentLife <= 0) this.game.removeObject(this, true);
	}
	
}
