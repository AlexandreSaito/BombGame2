
//initialize socket.io
const socket = io();

export function emit(name, data, callback){
	//console.log("emit", name);
	socket.emit(name, data, callback);
}

export function on(name, func){
	console.log("on", name);
	socket.on(name, func);
}
