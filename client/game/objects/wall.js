import Object from '../object.js'
import * as game from '../game.js'

export default class Wall extends Object{
	constructor(objData, data){
		objData.animation = 'wall';
		super(objData);

		this.hasChange = false;
	}
	
	gerAnimationRepeat(){
		return { x: Math.ceil(this.width / game.gridSize), y: Math.ceil(this.height / game.gridSize) };
	}
	
	getAnimationMod() {
		return `w${this.width}h${this.height}`;
	}
	
}