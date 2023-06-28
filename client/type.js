import objects from './type.json' assert { type: 'json' };
//{ "id": 4, "name": "Bomb Place", "typeName": "bombPlace" },

export function toReadonly(data) {
	return new Proxy(data, { set: function() { return false; }, get: function(target, prop) { if (target[prop] == undefined && prop != 'toJSON') throw new Error(`${prop} not exist!`); return Reflect.get(...arguments); } });
}

export function readOnlyType(data){
	const idName = {};
	for (const prop in data) idName[data[prop]] = prop;
	return [ new Proxy(data, { 
		set: function() { return false; }, 
		get: function(target, prop) { 
			if (target[prop] == undefined && prop != 'toJSON') { 
				//prop = String(prop);
				if(idName[prop] == undefined) throw new Error(`${prop} not exist!`); 
				return target[idName[prop]];
			}
			return target[prop]; 
		} 
	}), toReadonly(idName)];
}

const [ drawType, drawTypeId ] = readOnlyType({
	notRendered: -1,
	cenario: 0,
	item: 10,
	entity: 20,
	effect: 30,
	debug: 40,
	ui: 50,
});

const [ powerUps, powerUpsId ] = readOnlyType({
	bombPierce: 0,
	bombCount: 1,
	bombSpread: 2,
	maxLife: 3,
	bombDamage: 4,
	speed: 5,
});

export const draw = { drawType, drawTypeId };
export const powerup = { powerUps, powerUpsId };

const objNameT = {};
const objTNT = {};
const tIdT = {};
const tIdNT = {};

for (let i = 0; i < objects.length; i++) {
	const obj = objects[i];
	objNameT[obj.typeName] = obj.name;
	objTNT[obj.typeName] = obj.typeName;
	tIdT[obj.typeName] = obj.id;
	tIdNT[obj.id] = obj.typeName;
}

export const objectNames = toReadonly(objNameT);

export const objectTypeName = toReadonly(objTNT);

const [ tId ] = readOnlyType(tIdT);
export const typesId = tId;

//export const typeIdName = toReadonly(tIdNT);
