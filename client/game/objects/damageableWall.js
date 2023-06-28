import Object from "../object.js";
import { typesId, objectTypeName, objectNames, draw } from '../../type.js'
import * as game from '../game.js'

export default class DmgWall extends Object{
	constructor(data, wallData){
		data.animation = 'dmgwall';
		super(data);

		this.powerup = wallData.powerup;
		this.hasChange = false;
		this.currentLife = 1;
	}

	onRemove(){
		if(this.powerup != null && this.powerup != undefined)
			// resize?
			game.addObject({ position: { ...this.position }, width: this.width, height: this.height, name: objectNames.powerup, typeId: typesId.powerup, type: draw.drawType.item, id: this.id, data: { powerup: this.powerup } });
	}
	
	takeDamage(amount){
		this.currentLife -= amount;
		if(this.currentLife >= this.maxLife) this.currentLife = this.maxLife;
		if(this.currentLife <= 0) game.requestRemoveObject(this);
	}
	
}
