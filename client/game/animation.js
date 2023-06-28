import { getImage, addAnimation, getAnimation } from '../../data.js'
import Observer from '../observer.js'
import * as renderer from './renderer.js'
import * as animations from './animation/animations.js'

export default class Animation {
	constructor(name, owner) {
		this.name = name;
		this.animes = animations.getAnimation(this.name);
		this.owner = owner;
		
		this.onAnimationStart = new Observer();
		this.onAnimationEnd = new Observer();
		
		this.colorFilter = null;
		this.isVisible = true;
		this.changeAnimation('idle');

	}

	animationStart() {
		this.reset();
		const anime = this.getCurrentAnimation();
		this.done = !anime.playUntilEnd;
		this.doneExecuted = false;
		this.onAnimationStart.exec({ animator: this });
	}
	
	animationEnd() {
		const anime = this.getCurrentAnimation();
		this.done = true;
		if (anime.loop) this.changeAnimation(this.currentAnimation);
		if (this.doneExecuted) return;
		this.doneExecuted = true;
		this.onAnimationEnd.exec({ animator: this });
	}

	reset() {
		this.currentFrame = 0;
		this.frameIncrement = 1;
		this.currentFrameSpace = 0;
	}

	addColorFilter(h, s = 100, l = 50, a = 50){
		this.colorFilter = `hsl(${h},${s}%,${l}%,${a}%)`;
	}

	removeColorFilter(){
		this.colorFilter = null;
	}
	
	changeAnimation(animation) {
		if (animation == this.currentAnimation) return true;
		const anime = this.getCurrentAnimation();
		if (anime && anime.playUntilEnd && !this.done) return false;
		this.currentAnimation = animation;
		this.animationStart();
		return true;
	}

	getCurrentAnimation() {
		const anime = this.animes.find(x => x.name == this.currentAnimation);
		return anime;
	}

	getCurrentFrame() {
		return this.getCurrentAnimation().frames[this.currentFrame];
	}

	updateFrame() {
		const anime = this.getCurrentAnimation();
		const frame = this.getCurrentFrame();
		const maxFrames = anime.frames.length;

		if (this.currentFrameSpace > frame.frameSpace) {
			this.currentFrameSpace = 0;
			this.currentFrame += this.frameIncrement;
			if (this.currentFrame >= maxFrames) {
				// done execute
				this.currentFrame = maxFrames - 1;
				// has to rewind frames
				if (anime.regress) {
					this.frameIncrement = -1;
					this.currentFrame -= 1;
					return true;
				}
				this.animationEnd();
				return false;
			}
			if (this.currentFrame < 0) {
				// done execute
				this.currentFrame = 0;
				this.animationEnd();
				if (anime.loop) { 
					this.animationStart();
					return true;
				}
			}
		}

		this.currentFrameSpace++;
		return true;
	}

	getRenderDef(){
		if(this.owner.drawType == undefined) throw new Error('Draw type nulo!');
		return [this.owner.drawType, this.owner.typeId, this.owner.id];
	}

	remove(){
		const renderDef = this.getRenderDef();
		renderer.setItemCanvas(null, ...renderDef);
	}
					
	update() {
		if (!this.updateFrame()) return;
		if(!this.isVisible) {
			this.remove();
			return;
		}
		const renderDef = this.getRenderDef();
		const def = [this.owner.name, this.currentAnimation, this.currentFrame, this.owner.getAnimationMod(), 'addon', this.colorFilter];
		//const defWithoutColor = [this.owner.name, this.currentAnimation, this.currentFrame, 'mod', 'addon', null];
		let canvas = getAnimation(...def);
		const animation = this.getCurrentAnimation();
		const frame = this.getCurrentFrame();

		const fullSize = {
			x: this.owner.width + frame.grow.x,
			y: this.owner.height + frame.grow.y
		}
		const repeat = this.owner.gerAnimationRepeat ? this.owner.gerAnimationRepeat() : null;
		const imageSize = {
			width: repeat ? this.owner.width / repeat.x : this.owner.width, 
			height: repeat ? this.owner.height / repeat.y : this.owner.height, 
		};
		const imgData = {
			x: 0,
			y: 0,
			width: imageSize.width + frame.grow.x,
			height: imageSize.height + frame.grow.y,
		};
		const imgPositionOnWorld = { x: this.owner.position.x - frame.offset.x, y: this.owner.position.y - frame.offset.y };
		const data = { canvas: canvas, position: { ...imgPositionOnWorld }, width: fullSize.x, height: fullSize.y };

		if (!canvas) {
			const img = getImage(animation.src);
			canvas = new OffscreenCanvas(fullSize.x, fullSize.y);
			let ctx = canvas.getContext('2d', { alpha: true });
			ctx.drawImage(img, frame.spec.x, frame.spec.y, frame.spec.width, frame.spec.height, imgData.x, imgData.y, imgData.width, imgData.height);
			if(repeat){
				for(let x = 0; x < repeat.x; x++){
					for(let y = 0; y < repeat.y; y++){
						if(x == 0 && y == 0) continue;
						const pos = { x: imgData.x + (imgData.width * x), y: imgData.y + (imgData.height * y) };
						ctx.drawImage(img, frame.spec.x, frame.spec.y, frame.spec.width, frame.spec.height, pos.x, pos.y, imgData.width, imgData.height);	
					}
				}
				/*const repeatCanvas = new OffscreenCanvas(fullSize.x, fullSize.y);
				const repeatCtx = canvas.getContext('2d', { alpha: true });
				const pattern = repeatCtx.createPattern(canvas, "repeat");
				ctx.save();
				repeatCtx.fillStyle = pattern;
				repeatCtx.fillRect(0, 0, fullSize.x, fullSize.y);
				ctx.restore();
				canvas = repeatCanvas;
				ctx = repeatCtx;*/
			}
			//addAnimation(canvas, ...defWithoutColor);
			if (this.colorFilter) {
				//const filterCanvas = new OffscreenCanvas(fullSize.x + 1, fullSize.y + 1);
				//const filterCtx = canvas.getContext('2d', { alpha: true });
				//filterCtx.drawImage(canvas, 0, 0);
				ctx.save();
				ctx.globalCompositeOperation = "source-atop";
				ctx.fillStyle = this.colorFilter;
				ctx.fillRect(0, 0, fullSize.x, fullSize.y);
				ctx.restore();
				//canvas = filterCanvas;
			}
			data.canvas = canvas;
			addAnimation(canvas, ...def);
		}

		/*const canvashb = new OffscreenCanvas(this.owner.width, this.owner.height);
		const ctxhb = canvashb.getContext('2d', { alpha: true });
		ctxhb.beginPath();
		ctxhb.strokeStyle = '#FFFFF';
		ctxhb.rect(0, 0, canvashb.width, canvashb.height);
		ctxhb.stroke();
		renderer.setItemCanvas({
			canvas: canvashb,
			position: { x: this.owner.position.x, y: this.owner.position.y },
			width: this.owner.width,
			height: this.owner.height
		}, 40, this.owner.typeId, this.owner.id);*/
		renderer.setItemCanvas(data, ...renderDef);

	}

}
