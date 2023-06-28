import Object from '../object.js'
import * as game from '../game.js'

export default class Projectile extends Object {
	constructor(data, projectData){
		data.animation = projectData.type;
		super(data);

		this.destination = projectData.destination;
		this.damage = 1;
		this.wasEnded = false;
		this.velocity = 8;
	}

	update(){
		super.update();
		const velocity = this.getVelocity();
		const distx = this.destination.x - this.position.x;
		const disty = this.destination.y - this.position.y;
		if(!this.wasEnded && distx < velocity && distx > velocity * -1 &&
			 disty < velocity && disty > velocity * -1) {
			if(game.getPlayer().isColliding(this)) {
				game.getPlayer().takeDamage(this.damage, 1);
			}
			game.requestRemoveObject(this);
			this.wasEnded = true;
		}
		
		this.move({ x: distx, y: disty });
	}
	
}
