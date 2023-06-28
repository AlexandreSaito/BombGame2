import Object from '../object.js'
import { typeId, objectNames } from '../../type.js'
import { getFromJson } from '../animation.js'
import animation from '../../animation/objects/bomb.json' assert {type: 'json'};

export default class PlacedBomb extends Object{
	constructor(data, bombData){
		data.hasAnimation = true;
		super(data);
		this.explodeTime = 3000;
		this.spread = 3;
		
		this.timer = bombData?.time ?? Date.now();

		this.explosion = { width: this.width, height: this.height };
		if(bombData) this.placedAt = this.game.bombPlaces.find(x => x.id == bombData.posId && x.typeId == typeId.bombPlace);
		if(this.placedAt)	{ 
			this.placedAt.bombPlaced = this;
			//this.position.x -= this.width / 2;
			//this.position.y -= this.height / 2;
			//this.explosion = { width: this.placedAt.width, height: this.placedAt.height };
		}

		this.playerWhoPlace = bombData && bombData.player ? bombData.player : undefined;
		this.blockable = bombData ? bombData.player != this.game.userId : true;

		this.animation = getFromJson(this, animation);
		const frame = this.animation.animations.idle.spriteFrames[0];
		for(let i = 1; i < 4; i++){
			this.animation.animations.idle.spriteFrames.push({ ...frame, offset: { x: 2 * i, y: 2 * i }, grow: { x: 4 * i, y: 4 * i } });
		}
		
	}

	addExplision(data){
		this.game.insertObject({ ...data, type: this.game.types.effect, typeId: this.game.typesId.explosion, name: objectNames.explosion });
	}

	explode(){
		this.exploded = true;
		if(this.placedAt) this.placedAt.bombPlaced = null;
		// change animation
		// delete after animation
	}

	/*createExplosion(){
		const expWidth = this.explosion.width;
		const expHeight = this.explosion.height;
		
		const middleX = this.position.x + this.width / 2;
		const middleY = this.position.y + this.height / 2;

		const startX = middleX - expWidth / 2;
		const startY = middleY - expHeight / 2;

		const topExpPos = { x: startX, y: startY - expHeight * this.spread, width: expWidth, height: expHeight * this.spread };
		const rightExpPos = { x: startX + expWidth, y: startY, width: expWidth * this.spread, height: expHeight };
		const bottomExpPos = { x: startX, y: startY + expHeight, width: expWidth, height: expHeight * this.spread };
		const leftExpPos = { x: startX - expWidth * this.spread, y: startY, width: expWidth * this.spread, height: expHeight };

		// check if can 'grow'
		const blockables = this.game.map.objects.filter(x => x.blockable && x.typeId != typeId.bomb);
		const objectOnTop = blockables.filter(x => x.isColliding(topExpPos));
		const objectOnRight = blockables.filter(x => x.isColliding(rightExpPos));
		const objectOnBottom = blockables.filter(x => x.isColliding(bottomExpPos));
		const objectOnLeft = blockables.filter(x => x.isColliding(leftExpPos));
		
		delete topExpPos.position;
		delete rightExpPos.position;
		delete bottomExpPos.position;
		delete leftExpPos.position;
		
		if(objectOnTop && objectOnTop.length > 0)	{
			const floor = Math.max(...objectOnTop.map(x => { return x.typeId == typeId.wallDamage ? x.position.y : x.maxY; }));
			topExpPos.y = floor;
			topExpPos.height = topExpPos.maxY - topExpPos.y;
		}
		if(objectOnRight && objectOnRight.length > 0)	{
			const floor = Math.min(...objectOnRight.map(x => { return x.typeId == typeId.wallDamage ? x.maxX : x.position.x; })) - 1;
			rightExpPos.width = floor - rightExpPos.x;
		}
		if(objectOnBottom && objectOnBottom.length > 0)	{
			const floor = Math.min(...objectOnBottom.map(x => { return x.typeId == typeId.wallDamage ? x.maxY : x.position.y; })) - 1;
			bottomExpPos.height = floor - bottomExpPos.y;
		}
		if(objectOnLeft && objectOnLeft.length > 0)	{
			const floor = Math.max(...objectOnLeft.map(x => { return x.typeId == typeId.wallDamage ? x.position.x : x.maxX; }));
			leftExpPos.x = floor;
			leftExpPos.width = leftExpPos.maxX - leftExpPos.x;
		}
		
		this.addExplision(topExpPos);
		this.addExplision(rightExpPos);
		this.addExplision(bottomExpPos);
		this.addExplision(leftExpPos);
	}*/
	
	update(){
		if(this.exploded) { this.game.removeObject(this); return; } 
		
		/*if(this.game.currentTime - this.timer > this.explodeTime) {
			if(this.placedAt) this.placedAt.bombPlaced = null;
			this.exploded = true;
			// spread in cross
			// if has wall dont spread
			const player = this.game.entities.find(x => x.id == this.playerWhoPlace);
			if(player && player.bombDeployed > 0) player.bombDeployed--;
			this.createExplosion();
			this.game.removeObject(this, true);
			// delete object from game
			return;
		}*/
		
	}
	
}