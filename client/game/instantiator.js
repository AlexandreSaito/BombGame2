import Entity from "./entity/entity.js"
//import Player from "./entities/player.js"
import Object from './object.js'
import Wall from './objects/wall.js'
import Bomb from "./objects/bomb.js"
import Explosion from "./objects/explosion.js"
import DmgWall from './objects/damageableWall.js'
import PowerUp from './objects/powerup.js'
import { typesId, objectNames, powerup } from '../type.js'
const { powerUpsId, powerUps } = powerup;

export function instantiateObject(data){
	const objectData = { ...data };
	let object = null;
	if (data.typeId == typesId.wall) object = new Wall(objectData, data.data);
	else if (data.typeId == typesId.bomb) object = new Bomb(objectData, data.data);
	else if (data.typeId == typesId.explosion) object = new Explosion(objectData, data.data);
	else if (data.typeId == typesId.wallDamage) object = new DmgWall(objectData, data.data);
	else if (data.typeId == typesId.powerup) object = new PowerUp(objectData, data.data);
	else object = new Object(objectData);
	
	return object;
}

export function instantiateEntity(id, data){
	return new Entity({ ...data, character: data.char, width: 40, height: 40, id: id });
}
