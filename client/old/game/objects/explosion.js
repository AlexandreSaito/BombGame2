import Object from '../object.js'
import { typeId } from '../../type.js'
import animation from '../../animation/objects/explosion.json' assert { type: 'json' };

export default class Explosion extends Object {
	constructor(data) {
		data.animationJson = animation;
		super(data);

		this.animation.outlineColor = "#ff0000";

		this.spread = data.spread ?? 1;
		this.damage = !data.damage ? 1 : data.damage;
		this.started = Date.now();
		this.duration = 300;
	}

	update() {
		if (this.game.currentTime - this.started >= this.duration) {
			this.game.removeObject(this);
			return;
		}

		this.game.map.objects.forEach(x => {
			if ((x.typeId == typeId.wallDamage || x.typeId == typeId.powerup) && this.isColliding(x)) this.onCollide(x)
		});

	}

	gerAnimationRepeat(){
		return { x: this.width > this.height ? this.spread : 1, y: this.height > this.width ? this.spread : 1 };
	}
	
	getAnimeModfy() {
		return `w${this.width}h${this.height}`;
	}

	onCollide(object) {
		if (object.takeDamage) object.takeDamage(this.damage);
	}

}
