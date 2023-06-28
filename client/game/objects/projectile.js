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
		if(!this.wasEnded && this.position.x < this.destination.x + velocity && this.position.x > this.destination.x - velocity &&
			 this.position.y < this.destination.y + velocity && this.position.y > this.destination.y - velocity) {
			if(game.getPlayer().isColliding(this)) {
				game.getPlayer().takeDamage(this.damage, 1);
			}
			game.requestRemoveObject(this);
			this.wasEnded = true;
		}
		
		this.move({ x: this.destination.x - this.position.x, y: this.destination.y - this.position.y });
	}
	
}
