const images = {};
const animations = {};
let itemList = [];

export function setItemList(data){
	itemList = data;
}

export function getItemList() { return itemList; }

export function addImage(name, image) {
	//if(images[name]) throw new Error(`Já foi registrado uma imagem com o nome: ${name}`);
	images[name] = image;
}

export function getImage(name) { return images[name]; }

export function addAnimation(canvas, name, animationName, frame, mod, addon, colorFilter) {
	if(mod == undefined || mod == null || mod == '') mod = 'default';
	if(addon == undefined || addon == null || addon == '') addon = 'default';
	if(colorFilter == undefined || colorFilter == null || colorFilter == '') colorFilter = 'default';
	
	const params = [ name, animationName, frame, mod, addon ];
	
	let last = animations;
	for(let i = 0; i < params.length; i ++){
		const param = params[i];
		last = last[param] ? last[param] : last[param] = {};
	}
	last[colorFilter] = canvas;
}

export function getAnimation(name, animationName, frame, mod, addon, colorFilter) {
	try{
		if(mod == undefined || mod == '') mod = 'default';
		if(addon == undefined || addon == '') addon = 'default';
		if(colorFilter == undefined || colorFilter == '') colorFilter = 'default';
		return animations[name][animationName][frame][mod][addon][colorFilter];
	}catch(e){
		return undefined;
	}
}
