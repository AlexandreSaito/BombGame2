import { getItemList } from './data.js';

let currentFps = 0;
let offscreenCanvas;
let ctx;
onmessage = function(e) {
	const data = e.data;
  console.log('Worker: Message received from main script', data);
	if(data.type == 0) { start(); setInterval(() => { postMessage({ type: 0, fps: currentFps }); currentFps = 0; }, 1000) }
	if(data.type == 1) { offscreenCanvas = e.data.canvas; ctx = offscreenCanvas.getContext('2d'); }
}

console.log(document);

function start(){
	currentFps++;
	if(ctx){
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		for(let i = 0; i < 100; i++)
			for(let y = 0; y < 100; y++)
				ctx.fillRect(i*0, y*0, 50, 50);
	}
	requestAnimationFrame(start);
}
