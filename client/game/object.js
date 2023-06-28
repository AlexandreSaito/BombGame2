import * as game from './game.js'
import Animation from './animation.js'

export default class Object {
	constructor({ x, y, z, position, width, height, 
							 drawType, typeId, name, id, 
							 canBeStopped, blockable, resizeable, animation }) {
		// fixeds
		this.name = name;
		this.id = id;

		if (typeof typeId === 'string') this.typeId = this.game.typesId[typeId];
		else this.typeId = typeId;

		if (typeof drawType === 'string') this.drawType = this.game.drawType[drawType];
		else this.drawType = drawType;

		// variable
		if (!position) position = {}
		if (!position.x) position.x = x ?? 0;
		if (!position.y) position.y = y ?? 0;
		if (!position.z) position.z = z ?? 0;
		this.position = position;

		this.width = width;
		this.height = height;
		this.calcMax();

		this.originalMovementSpeed = 20;
		this.movementSpeed = this.originalMovementSpeed;
		this.canWalk = false;

		this.canBeStopped = canBeStopped ?? true;
		this.blockable = blockable ?? false;
		this.resizeable = resizeable ?? true;
		this.isVisible = true;
		this.destroy = false;

		this.animation = new Animation(animation, this);
	}

	onMove(){}
	onAnimationChange(){}
	onAnimationInit(){}
	onAnimationEnd(){}
	onCollide(){}
	onDeath(){}
	
	calcMax() {
		this.maxX = this.position.x + this.width;
		this.maxY = this.position.y + this.height;
	}

	setX(x) {
		this.setPos({ x: x });
	}

	setY(y) {
		this.setPos({ y: y });
	}

	setZ(z) {
		this.setPos({ z: z });
	}

	setPos(position) {
		this.lastPos = { ...this.position };
		if (position) {
			if (position.x != undefined) this.position.x = position.x;
			if (position.y != undefined) this.position.y = position.y;
			if (position.z != undefined) this.position.z = position.z;
			this.calcMax();
			this.hasChange = true;
		}
	}

	setWidth(w) {
		this.width = w;
		if (this.animation) this.animation.setWidth(w);
		this.hasChange = true;
	}

	setHeight(h) {
		this.height = h;
		if (this.animation) this.animation.setHeight(h);
		this.hasChange = true;
	}

	getVelocity(){
		const frameTime = game.getTickFrame() / 100;
		const velocityModify = ((this.effects?.speed ?? 0) / 10) * this.movementSpeed;
		const velocity = (this.movementSpeed + velocityModify) * frameTime;
		return velocity;
	}
	
	move(direction) {
		if (!direction.x) direction.x = 0;
		if (!direction.y) direction.y = 0;
		if (direction.x > 1) direction.x = 1;
		if (direction.x < -1) direction.x = -1;
		if (direction.y > 1) direction.y = 1;
		if (direction.y < -1) direction.y = -1;
		const velocity = this.getVelocity();
		this.setPos({ x: this.position.x + direction.x * velocity, y: this.position.y + direction.y * velocity });
	}

	isColliding(obj) {
		return game.isColliding(this, obj);
	}

	getAnimationMod(){
		return null;
	}
	
	update() { }

	draw() { if (this.animation) this.animation.draw(); }

	remove(){
		this.animation.remove();
		this.delete = true;
		if(this.onRemove) this.onRemove();
	}
	
	toJSON(){
		return { 
			position: { ...this.position }, 
			width: this.width, 
			height: this.height, 
			typeId: this.typeId, 
			type: this.type, 
			name: this.name 
		};
	}

}