import Object from '../object.js'
import { typesId, objectNames } from '../../type.js'
import * as game from '../game.js'

export default class PlacedBomb extends Object{
	constructor(data, bombData){
		data.animation = 'bomb';
		super(data);
		
		this.timer = bombData?.time ?? Date.now();

		this.playerWhoPlace = bombData && bombData.player ? bombData.player : undefined;
		this.blockable = bombData ? bombData.player != game.getUserId() : true;

		const anime = this.animation.animes.find(x => x.name == 'idle');
		const frame = anime.frames[0];
		for(let i = 1; i < 4; i++){
			anime.frames.push({ ...frame, offset: { x: 2 * i, y: 2 * i }, grow: { x: 4 * i, y: 4 * i } });
		}
		
	}

	explode(){
		this.exploded = true;
		// change animation
		// delete after animation
	}
	
	update(){
		if(this.exploded) { this.remove(); return; } 
	}
	
}