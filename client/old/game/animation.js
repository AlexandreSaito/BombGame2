import { colors } from './debug.js';
import { getImage, addAnimation, getAnimation } from '../../data.js'

export function getFromJson(owner, j) {
	if (typeof j === 'string') j = JSON.parse(j);

	const animations = {};
	for (let i = 0; i < j.animations.length; i++) {
		const anime = j.animations[i];
		const animeFrames = [];
		for (let y = 0; y < anime.frames.length; y++) {
			const f = anime.frames[y];
			animeFrames.push(new SpriteFrame({ x: f.spec.x, y: f.spec.y, width: f.spec.width, height: f.spec.height, offset: f.offset, grow: f.grow, frameSpace: f.frameSpace }));
		}
		animations[anime.name] = new Animation({ src: anime.src, loop: anime.loop, playUntilEnd: anime.playUntilEnd, spriteFrames: animeFrames, repeat: anime.repeatFrames });
	}
	const animationHandler = new AnimationHandler({ owner: owner, animations: animations });

	return animationHandler;
}

export class SpriteFrame {
	constructor({ x, y, width, height, offset, grow, frameSpace }) {
		if (x || x == 0 && y || y == 0 && width && height)
			this.spec = { x, y, width, height };

		this.offset = offset ?? {};
		this.grow = grow ?? {};
		this.frameSpace = frameSpace ?? 0;
		if (!this.offset.x) this.offset.x = 0;
		if (!this.offset.y) this.offset.y = 0;
		if (!this.grow.x) this.grow.x = 0;
		if (!this.grow.y) this.grow.y = 0;
	}

}

export class Animation {
	constructor({ src, onLoadImg, spriteFrames, loop, loopRollback, playUntilEnd, repeat }) {
		this.spriteSheet = null;
		if (src) {
			this.spriteSheet = getImage(src);
			if (!this.spriteSheet) {
				this.spriteSheet = new Image();
				this.spriteSheet.onload = () => { if (onLoadImg) onLoadImg };
				this.spriteSheet.src = src;
			}
		}

		this.repeat = repeat ?? false;
		this.spriteFrames = spriteFrames;
		if (!this.spriteFrames || this.spriteFrames.length == 0) this.spriteFrames = [new SpriteFrame({})];
		this.loop = loop;
		this.loopRollback = loopRollback;
		this.playUntilEnd = playUntilEnd;
		this.reset();
	}

	getCurrentFrame() {
		return this.spriteFrames[this.currentFrame];
	}

	reset() {
		this.currentFrame = 0;
		this.frameIncrement = 1;
		this.currentFrameSpace = 0;
		this.done = false;
	}

	changeFrame() {
		if (this.spriteFrames.length == 1) return;
		const frame = this.getCurrentFrame();
		if (frame.frameSpace >= this.currentFrameSpace) {
			this.currentFrameSpace++;
			return;
		}

		this.currentFrameSpace = 0;
		this.currentFrame += this.frameIncrement;

		if (this.currentFrame < 0) {
			this.frameIncrement = 1;
			this.currentFrame = 0;
			return;
		}
		if (this.currentFrame >= this.spriteFrames.length) {
			this.done = true;
			if (this.loop) {
				if (this.loopRollback) {
					this.frameIncrement = -1;
					this.currentFrame = this.spriteFrames.length - 1;
					return;
				}
				this.currentFrame = 0;
				return;
			}

			this.currentFrame = this.spriteFrames.length - 1;
			return;
		}
	}

	toJson(name) {
		return {
			name: name,
			src: this.spriteSheet.src,
			loop: this.loop,
			frames: this.spriteFrames.map(x => { return { ...x }; }),
		};
	}

}

export class AnimationHandler {
	constructor({ owner, animations }) {
		this.owner = owner;
		this.animations = animations;

		// variable
		this.posTextOffset = { x: 0, y: 10 }
		this.currentAnimation = 'idle';
		this.lastAnime = null;
		this.lastFrame = null;

		this.outlineColor = "#000";
		this.isVisible = true;
		this.showCollider = false;

		this.animationLock = false;
		this.frameLock = false;

		this.colorFilterLastId = 0;
		this.colorFilter = { };
	}

	setWidth(w, canvas) {
		if(!canvas) canvas = this.offScreenCanvas;
		canvas.width = w == 0 ? 1 : w;
	}

	setHeight(h, canvas) {
		if(!canvas) canvas = this.offScreenCanvas;
		canvas.height = h == 0 ? 1 : h;
	}

	removeColorFilter(id){
		delete this.colorFilter[id];
	}
	
	addColorFilter(h, s = 100, l = 50){
		const id = ++this.colorFilterLastId;
		this.colorFilter[id] = `hsl(${h},${s}%,${l}%)`;
		return id;
	}
	
	changeAnimation(animation, onAnimationDone) {
		if (this.animationLock) return;
		if (this.currentAnimation == animation) return;
		const current = this.getCurrentAnimation();
		if (current.playUntilEnd && !current.done) return;
		this.currentAnimation = animation;
		this.onAnimationDone = onAnimationDone;
		this.getCurrentAnimation().reset();
	}

	getCurrentAnimation() {
		const anime = this.animations[this.currentAnimation];
		return anime ?? this.animations.idle
	}

	toScreenPos(object) {
		const camera = this.owner.game.camera;
		return {
			position: {
				x: (object.position.x - camera.position.x) * camera.scale,
				y: (object.position.y - camera.position.y) * camera.scale,
			},
			width: object.width * camera.scale,
			height: object.height * camera.scale
		};
	}

	toJson(name) {
		const animations = [];
		for (const anime in this.animations) {
			animations.push(this.animations[anime].toJson(anime));
		}
		return {
			name: name,
			animations: animations,
		};
	}

	changeAnimationFrame() {
		const anime = this.getCurrentAnimation();
		anime.changeFrame();
	}

	createOffCanvas(frame){
		if(!frame) frame = { offset: { x: 0, y: 0 }, grow: { x: 0, y:0 } };
		const offScreenCanvas = new OffscreenCanvas(1, 1);
		let maxWidth = this.owner.width + frame.offset.x + frame.grow.x;
		let maxHeight = this.owner.height + frame.offset.y + frame.grow.y;
		if (maxWidth < 0) maxWidth = 1;
		if (maxHeight < 0) maxHeight = 1;
		this.setWidth(maxWidth, offScreenCanvas);
		this.setHeight(maxHeight, offScreenCanvas);
		return offScreenCanvas;
	}
	
	renderOnOffScreen() {
		const anime = this.getCurrentAnimation();
		const frame = anime.getCurrentFrame();

		if (!this.owner.hasChange && this.lastAnime == anime && this.lastFrame == anime.currentFrame) return;

		this.lastAnime = anime;
		this.lastFrame = anime.currentFrame;

		let wasSavedAnimation = true;
		const modify = this.owner.getAnimeModfy ? this.owner.getAnimeModfy() : '';
		const colorFilter = Object.values(this.colorFilter).join('');
		const addons = '';
		this.offScreenCanvas = getAnimation(this.owner.typeId, this.currentAnimation, anime.currentFrame, modify, colorFilter, addons);
		/*if (animeModfy != '') this.offScreenCanvas = getAnimation(this.owner.typeId, this.currentAnimation, anime.currentFrame, colorFilter);
		else this.offScreenCanvas = null;*/

		if (!this.offScreenCanvas) {
			this.offScreenCanvas = this.createOffCanvas(frame);
			wasSavedAnimation = false;
		}

		const draw = {
			position: {
				x: this.offScreenCanvas.width / 2 - this.owner.width / 2 - frame.offset.x,
				y: this.offScreenCanvas.height / 2 - this.owner.height / 2 - frame.offset.y
			},
			width: this.owner.width + frame.grow.x,
			height: this.owner.height + frame.grow.y,
		};
		const correctPos = { x: draw.position.x + frame.offset.x, y: draw.position.y + frame.offset.y };

		this.lastDrawPos = correctPos;

		if (wasSavedAnimation) {
			if (this.owner.onAnimationChange) this.owner.onAnimationChange();
			return;
		}
		let ctx = this.offScreenCanvas.getContext("2d", { alpha: true });

		ctx.clearRect(0, 0, this.offScreenCanvas.width, this.offScreenCanvas.height);

		ctx.save();
		if (anime.spriteSheet && anime.spriteSheet.complete) {
			// draw image
			let mainCtx = null;
			let repeat = null;
			let canvas = null;
			if(anime.repeat){
				mainCtx = ctx;
				canvas = this.createOffCanvas(frame);
				ctx = canvas.getContext('2d', { alpha: true });
				repeat = this.owner.gerAnimationRepeat ? this.owner.gerAnimationRepeat(draw) : null;
				this.setWidth(Math.ceil(canvas.width / repeat.x), canvas);
				this.setHeight(Math.ceil(canvas.height / repeat.y), canvas);
			}
			const correctWidth = repeat ? draw.width / repeat.x : draw.width;
			const correctHeight = repeat ? draw.height / repeat.y: draw.height;
			if (frame.spec) {
				ctx.drawImage(anime.spriteSheet,
					frame.spec.x, frame.spec.y, frame.spec.width, frame.spec.height,
					draw.position.x, draw.position.y, correctWidth, correctHeight);
			} else {
				ctx.drawImage(anime.spriteSheet, draw.position.x, draw.position.y, correctWidth, correctHeight);
			}

			// draw addon
			
			if(mainCtx){
				const pattern = mainCtx.createPattern(canvas, "repeat");
				mainCtx.fillStyle = pattern;
				mainCtx.fillRect(draw.position.x, draw.position.y, draw.width, draw.height);
				ctx = mainCtx;
			}
			
		} else {
			// draw rect
			ctx.beginPath();
			ctx.strokeStyle = this.outlineColor;
			ctx.rect(draw.position.x, draw.position.y, draw.width, draw.height);
			ctx.stroke();
		}
		ctx.restore();

		for(const colorFilter in this.colorFilter){
			ctx.save();
			ctx.globalCompositeOperation = "source-atop";
			ctx.fillStyle = this.colorFilter[colorFilter];
			ctx.fillRect(draw.position.x, draw.position.y, draw.width, draw.height);
			ctx.restore();
		}

		if (this.owner.game.debugMode && this.owner.highlight) {
			ctx.save();
			ctx.strokeStyle = colors.highlight;
			ctx.strokeRect(draw.position.x, draw.position.y, draw.width, draw.height);
			ctx.restore();
		}

		if (this.owner.onAnimationChange) this.owner.onAnimationChange();

		addAnimation(this.offScreenCanvas, this.owner.typeId, this.currentAnimation, anime.currentFrame, modify, colorFilter, addons);

	}

	draw() {
		if (!this.animations) {
			throw new Error(`No animations found ${this.owner.name}, ${this.owner.id}`);
		}
		if (!this.isVisible) return;

		const drawCtx = this.owner.game.getIntendedCtx(this.owner.type);
		if (!drawCtx) return;

		const anime = this.getCurrentAnimation();
		if (!this.frameLock) anime.changeFrame();
		this.renderOnOffScreen();

		const screenPos = this.toScreenPos({
			position: {
				x: this.owner.position.x - this.lastDrawPos.x,
				y: this.owner.position.y - this.lastDrawPos.y,
			},
			width: this.offScreenCanvas.width,
			height: this.offScreenCanvas.height,
		});

		drawCtx.drawImage(this.offScreenCanvas, (screenPos.position.x - 1), (screenPos.position.y - 1), (screenPos.width + 2), (screenPos.height + 2));

		if (this.owner.game.debugMode && this.showCollider) {
			const ctx = this.owner.game.debugCtx;
			const objectCollider = this.toScreenPos(this.owner);

			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = colors.boxCollider;
			ctx.rect(objectCollider.position.x, objectCollider.position.y, objectCollider.width, objectCollider.height);
			ctx.stroke();
			ctx.font = "bold 12px Arial";
			ctx.fillStyle = "red";
			ctx.fillText(`X: ${this.owner.position.x} - Y: ${this.owner.position.y}`, objectCollider.position.x, objectCollider.position.y + this.posTextOffset.y);
			ctx.restore();
		}
	}

}