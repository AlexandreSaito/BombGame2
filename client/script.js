import * as eng from "./game/eng.js"
import * as renderer from "./game/renderer.js"
//import Observer from './observer.js'


/*const canvas = new OffscreenCanvas(100, 100);
const ctx = canvas.getContext('2d');
ctx.beginPath();
ctx.strokeStyle = '#007936';
ctx.rect(10, 10, 80, 80);
ctx.stroke();

let c = 0;
const data = [];
for(let i = 0; i < 100; i++) {
	data.push({ canvas: canvas });
}
setInterval(() => { 
	for(let i = 0; i < data.length; i++) renderer.setItemCanvas({ canvas: data[i].canvas, position: { x: c, y: 0 }, width: 100, height: 100 }, "entity", 0, i);
	c++;
}, 1000/60);*/

eng.registerGame();
eng.startGameDrawLoop();

//eng.registerGame('bombGame');
//eng.startGameDrawLoop();

/*const myWorker = new Worker("worker.js", { type: 'module' });

//const offScreenCanvas = document.getElementById("teste").transferControlToOffscreen();

const fps = document.getElementById("workerFps");

myWorker.postMessage({ type: 0, data: "start" });
//myWorker.postMessage({ type: 1, canvas: offScreenCanvas }, [ offScreenCanvas ]);
myWorker.onmessage = function(e) {
	//console.log('Message received from worker', e.data);
	fps.innerHTML = e.data.fps;
}

setTimeout(() => { console.log(offScreenCanvas); }, 1000);*/