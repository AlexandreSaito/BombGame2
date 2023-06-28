import Object from '../object.js'
import wallAnimation from '../../animation/objects/wall.json' assert {type: 'json'};

export default class Wall extends Object{
	constructor(objData, data){
		objData.animationJson = wallAnimation;
		super(objData);

		this.hasChange = false;
	}
	
	gerAnimationRepeat(){
		return { x: Math.ceil(this.width / this.game.mapGridSize), y: Math.ceil(this.height / this.game.mapGridSize) };
	}
	
	getAnimeModfy() {
		return `w${this.width}h${this.height}`;
	}
	
}
