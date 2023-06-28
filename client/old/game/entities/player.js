import Entity from "../entity.js"
import keys from "./keys.json" assert { type: 'json' };
import * as conn from "../../connection.js"
import { powerUpId, powerUps } from '../../type.js'

export default class Player extends Entity {
	constructor(entityData) {
		super(entityData);

		if (!this.skillBinding) this.skillBinding = {};
		this.binds = keys.binds;

		this.action = {
			up: { pressed: false, isHold: true },
			down: { pressed: false, isHold: true },
			left: { pressed: false, isHold: true },
			right: { pressed: false, isHold: true },
			cameraRight: { pressed: false, isHold: true },
			cameraLeft: { pressed: false, isHold: true },
			cameraUp: { pressed: false, isHold: true },
			cameraDown: { pressed: false, isHold: true },
			placeBomb: { pressed: false, isHold: false },
			...this.skillBinding
		};
		
		this.canWalk = true;
		this.updated = 1;

		this.game.hasUIUpdate = true;
	}

	addPowerUp(powerup, quantity) {
		if (!quantity) quantity = 1;
		this.effects[powerup] = this.effects[powerup] + quantity;

		if(powerup == powerUps.maxLife || powerup == powerUpId[powerUps.maxLife]){
			this.takeDamage(-1, 1);
		}
		
		this.game.hasUIUpdate = true;
	}

	onDeath() { conn.emit('death'); }

	takeDamage(amount, invulnerableTime) {
		if(super.takeDamage(amount, invulnerableTime)){
			this.game.hasUIUpdate = true;
			return true;
		}
		return false;
	}

	update() {
		super.update();
		
		if (this.action.placeBomb.pressed) {
			this.action.placeBomb.pressed = false;
			this.game.placeBomb(this);
		}

		if (this.action.skill1 && this.action.skill1.pressed) {
			this.action.skill1.pressed = false;
			this.onSkill('skill1', { tag: 'press' });
		}
		if (this.action.skill2 && this.action.skill2.pressed) {
			this.action.skill2.pressed = false;
			this.onSkill('skill2', { tag: 'press' });
		}
		if (this.action.skill3 && this.action.skill3.pressed) {
			this.action.skill3.pressed = false;
			this.onSkill('skill3', { tag: 'press' });
		}
		if (this.action.skill4 && this.action.skill4.pressed) {
			this.action.skill4.pressed = false;
			this.onSkill('skill4', { tag: 'press' });
		}

		const cMove = { x: 0, y: 0 };
		if (this.action.cameraRight.pressed) cMove.x += 1;
		if (this.action.cameraLeft.pressed) cMove.x -= 1;
		if (this.action.cameraUp.pressed) cMove.y -= 1;
		if (this.action.cameraDown.pressed) cMove.y += 1;
		this.game.camera.move(cMove);

		const pMove = { x: 0, y: 0 };
		if (this.canWalk) {
			if (this.action.right.pressed) pMove.x += 1;
			if (this.action.left.pressed) pMove.x -= 1;
			if (this.action.up.pressed) pMove.y -= 1;
			if (this.action.down.pressed) pMove.y += 1;

			if (pMove.x == 0 && pMove.y == 0) this.animation.changeAnimation('idle');
			else if (pMove.y < 0) this.animation.changeAnimation('walkUp');
			else if (pMove.y > 0) this.animation.changeAnimation('walkDown');
			else if (pMove.x > 0) this.animation.changeAnimation('walkRight');
			else if (pMove.x < 0) this.animation.changeAnimation('walkLeft');
		}

		this.move(pMove);
		this.checkCollision();
	}

	checkCollision() {

		if (this.position.y < 0) this.position.y = 0;
		if (this.position.x < 0) this.position.x = 0;

		if (this.updated != 1) {
			console.log(this);
		}

		let hasCorrection = true;
		let tries = 0;
		while (hasCorrection && tries < 3) {
			tries++;
			hasCorrection = false;
			this.calcMax();
			this.game.map.objects.forEach(x => {
				if (x.blockable || x.onCollide) {
					if (this.isColliding(x)) {
						if (x.onCollide) if (x.onCollide(this) != true) return;

						/*if(this.game.map.objects.find(x => x.blockable && x.isColliding({ position: { x: this.lastPos.x, y: this.position.y }, width: this.width, height: this.height })) == undefined){
							this.position = { x: this.lastPos.x, y: this.position.y };
						}else if(this.game.map.objects.find(x => x.blockable && x.isColliding({ position: { x: this.position.x, y: this.lastPos.y }, width: this.width, height: this.height })) == undefined){
							this.position = { x: this.position.x, y: this.lastPos.y };
						}*/
							
						// x > 0 moving left, x < 0 moving right
						// y > 0 moving up, y < 0 moving down
						const offset = { x: this.lastPos.x - this.position.x, y: this.lastPos.y - this.position.y };

						if (offset.y == 0) {
							if (offset.x > 0) this.position.x = x.position.x + x.width;
							if (offset.x < 0) this.position.x = x.position.x - this.width;
						}
						else if (offset.x == 0) {
							if (offset.y > 0) this.position.y = x.position.y + x.height;
							if (offset.y < 0) this.position.y = x.position.y - this.height;
						}
						else if (offset.x != 0 && offset.y != 0) {
							if(this.game.map.objects.find(x => x.blockable && x.isColliding({ position: { x: this.lastPos.x, y: this.position.y }, width: this.width, height: this.height })) == undefined){
								this.position = { x: this.lastPos.x, y: this.position.y };
							}else if(this.game.map.objects.find(x => x.blockable && x.isColliding({ position: { x: this.position.x, y: this.lastPos.y }, width: this.width, height: this.height })) == undefined){
								this.position = { x: this.position.x, y: this.lastPos.y };
							}else{
								this.position = { ...this.lastPos };
							}
						} else {
							// calculate pos (player is probably being pushed by something)
						}
						hasCorrection = true;
					}
				}
				if (this.updated != 1) console.log(x);
			});
		}
		this.updated = 1;

		this.calcMax();

	}

}