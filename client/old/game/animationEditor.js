
const menus = document.getElementById("menus");

const spriteEditor = document.createElement('div');
const spriteSheetPreview = document.createElement('div');
menus.append(spriteEditor);
menus.append(spriteSheetPreview);

const expectedPlayerAnimation = new Proxy({
	idle: { minFrame: 1 },
	walkUp: { minFrame: 4 },
	walkRight: { minFrame: 4 },
	walkDown: { minFrame: 4 },
	walkLeft: { minFrame: 4 },
}, { set: function() { return false; } })

function createInput(name, type, data) {
	const wrapper = document.createElement('div');

	let inputName = 'input';
	if (type == 'select') inputName = 'select';
	const input = document.createElement(inputName);
	if (type == 'select') input.innerHTML = data.options.map(x => { return `<option value="${x.value}">${x.name}</option>`; });
	else {
		input.type = type;
		if (type == 'range') { input.min = data.min; input.max = data.max; }

		if (data && data.default != undefined) input.value = data.default;
	}
	const label = document.createElement('label');
	label.innerHTML = name;

	wrapper.append(label);
	wrapper.append(input);
	return [wrapper, input];
}

function int(value) {
	return parseInt(!value || value == "" ? "0" : value);
}

export function startEdit(player) {
	player.animation.frameLock = true;
	player.animation.animationLock = true;
	
	const animations = player.animation.animations;
	const customMenu = document.createElement('div');
	spriteEditor.append(customMenu);

	const animationWrappers = document.createElement('div');
	const animationOptions = [];
	for (const a in animations) animationOptions.push({ name: a });
	const [currentAnimationWrapper, currentAnimationInput] = createInput('Current Animation', 'select', { options: animationOptions.map(x => { return { name: x.name, value: x.name } }) });
	currentAnimationInput.value = '';

	customMenu.append(currentAnimationWrapper);
	customMenu.append(animationWrappers);

	currentAnimationInput.onchange = function(e) {
		e.preventDefault();

		player.animation.animationLock = false;
		player.animation.changeAnimation(currentAnimationInput.value);
		player.animation.animationLock = true;

		const anime = animations[currentAnimationInput.value];
		const frameWrapper = document.createElement('div');
		const [currentFrameWrapper, currentFrameInput] = createInput('Current Frame', 'range', { min: 0, max: anime.spriteFrames.length - 1, default: anime.currentFrame });

		animationWrappers.innerHTML = `
<h4>${currentAnimationInput.value}</h4>
<div>Loop: <b>${anime.loop}</b></div>
<div>SRC: <b>${anime.spriteSheet.src}</b></div>`;
		animationWrappers.append(currentFrameWrapper);
		animationWrappers.append(frameWrapper);

		currentFrameInput.onchange = function(e) {
			anime.currentFrame = currentFrameInput.value;
			const frame = anime.spriteFrames[currentFrameInput.value];
			const [frameSpaceWrapper, frameSpaceInput] = createInput('Frame Space', 'number', { default: frame.frameSpace });
			const [frameOffsetXWrapper, frameOffsetXInput] = createInput('Offset X', 'number', { default: frame.offset.x });
			const [frameOffsetYWrapper, frameOffsetYInput] = createInput('Offset Y', 'number', { default: frame.offset.y });
			const [frameGrowXWrapper, frameGrowXInput] = createInput('Grow X', 'number', { default: frame.grow.x });
			const [frameGrowYWrapper, frameGrowYInput] = createInput('Grow Y', 'number', { default: frame.grow.y });

			const [frameSpecXWrapper, frameSpecXInput] = createInput('Sheet X', 'number', { default: frame.spec.x });
			const [frameSpecYWrapper, frameSpecYInput] = createInput('Sheet Y', 'number', { default: frame.spec.y });
			const [frameSpecWidthWrapper, frameSpecWidthInput] = createInput('Sheet Width', 'number', { default: frame.spec.width });
			const [frameSpecHeightWrapper, frameSpecHeightInput] = createInput('Sheet Height', 'number', { default: frame.spec.height });

			frameSpaceInput.onchange = (e) => { frame.frameSpace = int(frameSpaceInput.value); };
			frameOffsetXInput.onchange = (e) => { frame.offset.x = int(frameOffsetXInput.value); };
			frameOffsetYInput.onchange = (e) => { frame.offset.y = int(frameOffsetYInput.value); };
			frameGrowXInput.onchange = (e) => { frame.grow.x = int(frameGrowXInput.value); };
			frameGrowYInput.onchange = (e) => { frame.grow.y = int(frameGrowYInput.value); };

			frameSpecXInput.onchange = (e) => { frame.spec.x = int(frameSpecXInput.value); };
			frameSpecYInput.onchange = (e) => { frame.spec.y = int(frameSpecYInput.value); };
			frameSpecWidthInput.onchange = (e) => { frame.spec.width = int(frameSpecWidthInput.value); };
			frameSpecHeightInput.onchange = (e) => { frame.spec.height = int(frameSpecHeightInput.value); };

			frameWrapper.innerHTML = `<h5>Frame: ${currentFrameInput.value}</h5>`;
			frameWrapper.append(frameSpaceWrapper);
			frameWrapper.append(frameOffsetXWrapper);
			frameWrapper.append(frameOffsetYWrapper);
			frameWrapper.append(frameGrowXWrapper);
			frameWrapper.append(frameGrowYWrapper);

			frameWrapper.append(frameSpecXWrapper);
			frameWrapper.append(frameSpecYWrapper);
			frameWrapper.append(frameSpecWidthWrapper);
			frameWrapper.append(frameSpecHeightWrapper);
		}
		currentFrameInput.onchange();
	}

}

export function getAnimationData(player) {
	return player.animation.toJson('teste');
}
