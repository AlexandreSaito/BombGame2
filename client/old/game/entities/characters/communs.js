import * as conn from '../../../connection.js'

export function emitSkill(name, data){
	conn.emit('skill', { name: name, data: data });
}