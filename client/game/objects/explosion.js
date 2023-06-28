import Object from '../object.js'
import { typesId } from '../../type.js'
import * as game from '../game.js'

export default class Explosion extends Object {
	constructor(data) {
		data.animation = 'explosion';
		super(data);

		this.damage = !data.damage ? 1 : data.damage;
		this.started = Date.now();
		this.duration = 300;
	}

	update() {
		if (game.getTickTime() - this.started >= this.duration) {
			this.remove();
			return;
		}

		game.getObjects().forEach(x => {
			if ((x.typeId == typesId.wallDamage || x.typeId == typesId.powerup) && this.isColliding(x)) this.onCollide(x)
		});

	}

	gerAnimationRepeat(){
		if(this.width == this.height) return null;
		if(this.width > this.height) return { x: Math.ceil(this.width / game.gridSize), y: 1};
		if(this.width < this.height) return { x: 1, y: Math.ceil(this.height / game.gridSize)};
	}
	
	getAnimationMod() {
		return `w${this.width}h${this.height}`;
	}

	onCollide(object) {
		if (object.takeDamage) object.takeDamage(this.damage);
	}

}
