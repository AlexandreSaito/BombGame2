import { getFromJson, AnimationHandler, Animation, SpriteFrame } from './animation.js'
import * as game from '..'
export default class Object {
	constructor({ x, y, z, position, width, height, type, typeId, canBeStopped, blockable, resizeable, hasAnimation, animationJson, game, name, id }) {
		// fixeds
		this.game = game;
		this.name = name;
		this.id = id;

		if (typeof typeId === 'string') this.typeId = this.game.typesId[typeId];
		else this.typeId = typeId;

		if (typeof type === 'string') this.type = this.game.types[type];
		else this.type = type;

		// variable
		if (!position) position = {}
		if (!position.x) position.x = x ?? 0;
		if (!position.y) position.y = y ?? 0;
		if (!position.z) position.z = z ?? 0;
		this.position = position;

		this.width = width;
		this.height = height;
		this.calcMax();

		this.movementSpeed = 20;
		this.currentMovementSpeed = this.movementSpeed;

		this.group = null;
		this.canBeStopped = canBeStopped ?? false;
		this.blockable = blockable ?? false;
		this.resizeable = resizeable ?? true;
		this.isVisible = true;
		this.destroy = false;

		if (!hasAnimation) {
			if (animationJson) {
				this.animation = getFromJson(this, animationJson);
			} else {
				this.animation = new AnimationHandler({
					owner: this,
					animations: { idle: new Animation({ spriteFrames: [new SpriteFrame({ x: 0, y: 0, width: 0, height: 0, offset: { x: 0, y: 0 }, grow: { x: 0, y: 0 } })] }) }
				});
			}
		}
	}

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

	move(direction) {
		if (!direction.x) direction.x = 0;
		if (!direction.y) direction.y = 0;
		const frameTime = this.game.perFrameTime / 100;
		const velocityModify = ((this.effects?.speed ?? 0) / 10) * this.movementSpeed;
		const velocity = (this.movementSpeed + velocityModify) * frameTime;
		this.setPos({ x: this.position.x + direction.x * velocity, y: this.position.y + direction.y * velocity });
	}

	isColliding(obj) {
		if (!obj.position) obj.position = { x: obj.x, y: obj.y };
		if (!obj.maxX) obj.maxX = obj.position.x + obj.width;
		if (!obj.maxY) obj.maxY = obj.position.y + obj.height;
		return this.position.x < obj.maxX && this.maxX > obj.position.x && this.position.y < obj.maxY && this.maxY > obj.position.y;
	}

	update() { }

	draw() {
		if (this.animation) this.animation.draw();
	}

	toJSON(){
		return { position: { ...this.position }, width: this.width, height: this.height, typeId: this.typeId, type: this.type, name: this.name };
	}

}