//Initialize the server
const app = require("express")();
const express = require("express");
const path = require("path");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const readline = require("node:readline");

//Serve the '/client' folder
const htmlPath = path.join(__dirname, "client");
app.use(express.static(htmlPath));

function toReadonly(obj) {
  return new Proxy(obj, {
    set: function () { return false; },
    get: function (target, prop) {
      if (target[prop] == undefined && prop != "toJSON") throw new Error(`${prop} not exist!`);
      return Reflect.get(...arguments);
    },
  });
}

const mapGridSize = 50;
const defaultExplodeTime = 3000;

const objectTypes = toReadonly({
  notRendered: -1,
  cenario: 0,
  item: 10,
  entity: 20,
  effect: 30,
  debug: 40,
	ui: 50,
});

const typesId = toReadonly({
  bomb: 0,
  explosion: 1,
  wall: 2,
  wallDamage: 3,
  //bombPlace: 4,
  entity: 5,
  powerup: 6,
	projectile: 7,
});

const objects = toReadonly({
  wall: { name: "Wall", drawType: objectTypes.cenario, typeId: typesId.wall, width: mapGridSize, height: mapGridSize, resizeable: true, blockable: true, },
  wallDamage: { name: "DmgWall", drawType: objectTypes.cenario, typeId: typesId.wallDamage, width: mapGridSize, height: mapGridSize, resizeable: true, blockable: true, },
  explosion: { name: "Explosion", drawType: objectTypes.effect, typeId: typesId.explosion, width: mapGridSize, height: mapGridSize, resizeable: false, },
  bomb: { name: "Bomb", drawType: objectTypes.item, typeId: typesId.bomb, width: mapGridSize, height: mapGridSize, resizeable: false, },
  //bombPlace: { name: "Bomb Place", drawType: objectTypes.debug, typeId: typesId.bombPlace, width: mapGridSize, height: mapGridSize, resizeable: false, },
  powerup: { name: "Power Up", drawType: objectTypes.item, typeId: typesId.powerup, width: mapGridSize, height: mapGridSize, resizeable: false, },
  projectile: { name: "Projectile", drawType: objectTypes.item, typeId: typesId.projectile, width: mapGridSize, height: mapGridSize, resizeable: false, },
});

const powerUps = toReadonly({
  bombPierce: 0, // -- pierce thru breakable wall
  bombCount: 1, // -- add max bomb
  bombSpread: 2, // -- add 1 tile of bomb spread
  maxLife: 3, // -- add max life
  bombDamage: 4, // -- add bomb damage
  speed: 5, // -- add movement speed (1 per effect)
});

const charList = toReadonly({
  saito: { name: "Saito", id: "saito" },
  akio: { name: "Akio", id: "akio" },
});

const entities = toReadonly({
  saitoadm: { x: 0, y: 0, z: 0, width: 40, height: 40, drawType: "entity", typeId: typesId.entity, animation: "idle", char: "saitoadm", },
  saito: { x: 0, y: 0, z: 0, width: 40, height: 40, drawType: "entity", typeId: typesId.entity, animation: "idle", char: charList.saito.id, },
  akio: { x: 0, y: 0, z: 0, width: 40, height: 40, drawType: "entity", typeId: typesId.entity, animation: "idle", char: charList.akio.id, },
});

const connections = { lastUserId: 0, users: {} };

const sprites = [];

const game = {
  started: false,
  ids: {
    bomb: 0,
  },
  state: { players: {}, watchers: {} },
  map: {
    objects: [],
		rules: { spawnPoint: [ { x: 100, y: 100 } ] }
  },
};

addSprite(["img"]);

function addSprite(sections) {
  const directoryPath = path.join(__dirname, "client", ...sections);
  const aux = path.join(...sections);
  const files = fs.readdirSync(directoryPath);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.includes(".")) {
      addSprite([...sections, file]);
      continue;
    }
    sprites.push({ src: `/${aux}/${file}` });
  }
}

let fps = 0;
let serverFpsInterval = null;

//Function that is called whenever someone joins
io.on("connection", (socket) => {
  if (!connections.users[socket.id]) connections.users[socket.id] = ++connections.lastUserId;
  const userId = connections.users[socket.id];

  socket.emit("preload", { sprites, charList });

  socket.on("ping", (dt) => { socket.emit("pong", dt); });

  socket.on("get-item-list", (data, callback) => { callback(objects); });

  socket.on("get-char-list", (data, callback) => { callback(charList); });

  socket.on("player-state", (data) => { game.state.players[userId] = { ...game.state.players[userId], ...data }; });

  socket.on("setMap", setMap);

  socket.on("skill", (data) => { io.sockets.emit("skill", { ...data, userId: userId }); });

	socket.on('death', () => { io.sockets.emit('death', { userId }); });
	
  socket.on("enter-game", (data, callback) => {
    const returnData = {
      enterAs: game.started ? "watcher" : "player",
      userId: userId,
      map: game.map,
    };
		console.log('enter', data);
		
    if (!game.started || entities[data.char] == undefined) {
      if (!game.state.players[userId]) {
				const spawnPoint = game.map.rules.spawnPoint[userId % game.map.rules.spawnPoint.length];
        const effects = {};
        effects[powerUps.bombSpread] = 1;
        effects[powerUps.bombDamage] = 1;
        effects[powerUps.bombCount] = 1;
        game.state.players[userId] = {
					...entities[data.char],
					x: spawnPoint.x,
					y: spawnPoint.y,
          char: data.char,
          defaultMaxBomb: 0,
          maxLife: 3,
          data: { effects: effects },
        };
      }
    } else {
      if (!game.state.watchers[userId]) game.state.watchers[userId] = {};
    }

    callback(returnData);
  });

  socket.on("object-add", (data) => {
    if (data.typeId == typesId.bomb) { placeBomb(userId, data); return; }
		addObject(data);
  });

  socket.on("object-delete", (data) => {
    if (removeObject(data.id, data.typeId)) io.sockets.emit("object-delete", data);
  });

  socket.on("collect", (data, callback) => {
    if (removeObject(data.id, data.typeId)) {
      const user = game.state.players[userId];
			if(!user.data.effects[data.powerup] || user.data.effects[data.powerup] < 10) {
	      callback(true);
	      if (data.typeId == typesId.powerup) {
	        if (!user.data.effects[data.powerup]) user.data.effects[data.powerup] = 0;
					if( data.quantity == null || data.quantity == undefined)  data.quantity = 1;
	        user.data.effects[data.powerup] += data.quantity;
					if(user.data.effects[data.powerup] > 10) user.data.effects[data.powerup] = 10;
	      }
	      io.sockets.emit("object-delete", data);
	      return;
			}
    }
    callback(false);
  });

  // todo: god mode listening

  socket.on("disconnect", () => {
    delete game.state.players[userId];
    delete game.state.watchers[userId];
    delete connections.users[socket.id];
  });
	
});

function addPowerUpToWall(wall) {
  if (!wall.data) wall.data = {};
  const value = Math.random() * 100;
  if (value < 20) wall.data.powerup = powerUps.bombSpread;
  else if (value < 50) wall.data.powerup = powerUps.bombCount;
  else if (value < 96.5) wall.data.powerup = null;
  else if (value < 97) wall.data.powerup = powerUps.bombPierce;
  else if (value < 98) wall.data.powerup = powerUps.maxLife;
  else if (value < 99) wall.data.powerup = powerUps.bombDamage;
  else if (value < 100) wall.data.powerup = powerUps.speed;
}

function addPowerUpToWalls() {
  game.map.objects.forEach((x) => { if (x.typeId == typesId.wallDamage) addPowerUpToWall(x); });
}

function getPowerUp(player, powerup) {
  if (player.data.effects[powerup] == undefined) powerup = powerUps[powerup];
  return player.data.effects[powerup] ?? 0;
}

function setMap(map) {
  game.map = JSON.parse(fs.readFileSync(`./maps/${map}.json`));
  addPowerUpToWalls();
  io.sockets.emit("changeMap", game.map);
}

function addObject(data){
	if (game.ids[data.name] == undefined) game.ids[data.name] = 0;
	const obj = {
		...objects[data.name],
		data: { ...data.data },
		id: ++game.ids[data.name],
		position: { ...data.position }
	};
	if(data.width != undefined) obj.width = data.width;
	if(data.height != undefined) obj.height = data.height;
	if (data.typeId == typesId.wallDamage) addPowerUpToWall(obj);
	game.map.objects.push(obj);
	io.sockets.emit("object-add", obj);
}

function placeBomb(userId, data) {
  const user = game.state.players[userId];
	const bombPlaced = game.map.objects.filter((x) => x.typeId == typesId.bomb && x.position.x == data.position.x && x.position.y == data.position.y);
	if(bombPlaced && bombPlaced.length != 0) { return; }
  if (!data.god) {
    if (!user) return;
    const bombsFromUser = game.map.objects.filter((x) => x.typeId == typesId.bomb && x.data.player == userId);
    user.maxBomb = user.defaultMaxBomb + getPowerUp(user, "bombCount");
    if (bombsFromUser && bombsFromUser.length >= user.maxBomb) { return; }
  }
  const bombData = { 
		player: !data.god ? userId : undefined, 
		posId: data.posId, 
		time: Date.now(), 
		explodeTime: data.explodeTime ? data.explodeTime : defaultExplodeTime, 
		spread: data.spread ?? 3, 
	};
  const dataObject = { ...objects.bomb, position: { ...data.position }, data: bombData, id: ++game.ids.bomb, };
  if (data.posId) {
    const place = game.map.objects.find((x) => x.typeId == typesId.bombPlace && x.id == data.posId);
    if (place) {
      dataObject.width = place.width;
      dataObject.height = place.height;
      dataObject.position = { ...place.position };
    }
  }
  game.map.objects.push(dataObject);
  io.sockets.emit("object-add", dataObject);
}

function explodeBomb(bomb) {
  const player = bomb.data.player ? game.state.players[bomb.data.player] : undefined;
  const bombPierce = player ? getPowerUp(player, "bombPierce") : 0;
  const explosions = [];

  const expWidth = mapGridSize;
  const expHeight = mapGridSize;

  const middleX = bomb.position.x + bomb.width / 2;
  const middleY = bomb.position.y + bomb.height / 2;

  const startX = middleX - expWidth / 2;
  const startY = middleY - expHeight / 2;

  const spread = bomb.data.spread + player ? getPowerUp(player, "bombSpread") : 0;
  const exp = { ...objects.explosion, origin: bomb.data.player, damage: getPowerUp(player, "bombDamage"), spread: spread };
  const topExpPos = { ...exp, id: bomb.id * 4 - 3, x: startX, y: startY - expHeight * spread, width: expWidth, height: expHeight * spread, };
  const rightExpPos = { ...exp, id: bomb.id * 4 - 2, x: startX + expWidth, y: startY, width: expWidth * spread, height: expHeight, };
  const bottomExpPos = { ...exp, id: bomb.id * 4 - 1, x: startX, y: startY + expHeight, width: expWidth, height: expHeight * spread, };
  const leftExpPos = { ...exp, id: bomb.id * 4, x: startX - expWidth * spread, y: startY, width: expWidth * spread, height: expHeight, };

  // check if can 'grow'
  const blockables = game.map.objects.filter((x) => x.blockable && x.typeId != typesId.bomb);
  const objectOnTop = blockables.filter((x) => isColliding(x, topExpPos));
  const objectOnRight = blockables.filter((x) => isColliding(x, rightExpPos));
  const objectOnBottom = blockables.filter((x) => isColliding(x, bottomExpPos));
  const objectOnLeft = blockables.filter((x) => isColliding(x, leftExpPos));

  delete topExpPos.position;
  delete rightExpPos.position;
  delete bottomExpPos.position;
  delete leftExpPos.position;

  if (objectOnTop && objectOnTop.length > 0) {
    const list = objectOnTop.map((x) => x.typeId == typesId.wallDamage ? x.position.y : x.maxY ).sort((a, b) => b - a);
    const pierce = bombPierce >= list.length ? list.length - 1 : bombPierce;
    const floor = list[pierce];
    topExpPos.y = floor;
    topExpPos.height = topExpPos.maxY - topExpPos.y;
    topExpPos.spread = Math.ceil(topExpPos.height / expHeight);
  }
  if (objectOnRight && objectOnRight.length > 0) {
    const list = objectOnRight.map((x) => x.typeId == typesId.wallDamage ? x.maxX : x.position.x ).sort((a, b) => a - b);
    const floor = list[bombPierce >= list.length ? list.length - 1 : bombPierce];
    rightExpPos.width = floor - rightExpPos.x;
    topExpPos.spread = Math.ceil(rightExpPos.width / expWidth);
  }
  if (objectOnBottom && objectOnBottom.length > 0) {
    const list = objectOnBottom.map((x) =>  x.typeId == typesId.wallDamage ? x.maxY : x.position.y ).sort((a, b) => a - b);
    const floor = list[bombPierce >= list.length ? list.length - 1 : bombPierce];
    bottomExpPos.height = floor - bottomExpPos.y;
    topExpPos.spread = Math.ceil(bottomExpPos.height / expHeight);
  }
  if (objectOnLeft && objectOnLeft.length > 0) {
    const list = objectOnLeft.map((x) => x.typeId == typesId.wallDamage ? x.position.x : x.maxX ).sort((a, b) => b - a);
    const floor = list[bombPierce >= list.length ? list.length - 1 : bombPierce];
    leftExpPos.x = floor;
    leftExpPos.width = leftExpPos.maxX - leftExpPos.x;
    topExpPos.spread = Math.ceil(leftExpPos.width / expWidth);
  }

  explosions.push(topExpPos);
  explosions.push(rightExpPos);
  explosions.push(bottomExpPos);
  explosions.push(leftExpPos);

  io.sockets.emit("bomb-explode", { bombId: bomb.id, explosion: explosions });
}

function removeObject(id, typeId) {
  const obj = game.map.objects.find((x) => x.id == id && x.typeId == typeId);
  if (!obj) return false;
  if (obj.typeId == typesId.wallDamage && obj.data.powerup != null && obj.data.powerup != undefined) {
    obj.typeId = typesId.powerup;
    obj.name = objects.powerup.name;
    obj.blockable = false;
    // resize?
    return true;
  }
  game.map.objects = game.map.objects.filter((x) => x != obj);
  return true;
}

function isColliding(obj1, obj2) {
  if (!obj1.position) obj1.position = { x: parseInt(obj1.x), y: parseInt(obj1.y) };
  if (!obj2.position) obj2.position = { x: parseInt(obj2.x), y: parseInt(obj2.y) };
  if (!obj1.maxX) obj1.maxX = obj1.position.x + obj1.width;
  if (!obj1.maxY) obj1.maxY = obj1.position.y + obj1.height;
  if (!obj2.maxX) obj2.maxX = obj2.position.x + obj2.width;
  if (!obj2.maxY) obj2.maxY = obj2.position.y + obj2.height;
  return (obj2.position.x < obj1.maxX && obj2.maxX > obj1.position.x && obj2.position.y < obj1.maxY && obj2.maxY > obj1.position.y);
}

// Emit the gamestate to the clients 30 times / second
setInterval(() => {
  // all timing things should be done here
  // some objects should have calc on server side
  io.sockets.emit("state", game.state);

  const currentTime = Date.now();

  game.map.objects.forEach((x) => {
    if (x.typeId == typesId.bomb) {
      if (currentTime - x.data.time >= x.data.explodeTime) {
        // create explosion and emit bomb exploded
        explodeBomb(x);
        removeObject(x.id, x.typeId);
      }
    }
  });

  fps++;
}, 1000 / 30);

//Start the server on port 3000
http.listen(3000, () => { console.log("listening on *:3000"); });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, });

rl.on("line", (input) => {
  console.log(`Received: ${input}`);
  if (input == "log map") {
    console.log(game.map.objects);
  }
  if (input == "log entity") {
    console.log(connections.users);
    for (const player in game.state.players) {
      console.log(game.state.players[player], game.state.players[player]?.data?.effects);
    }
  }
	if(input.includes('save map')){
		const mapName = input.replace('save map ', '');
		const map = { ...game.map };
		map.objects.forEach(x => { if(x.typeId == typesId.wallDamage) delete x.data.powerup; });
		fs.writeFile(`./maps/${mapName}.json`, JSON.stringify(map), (err) => { if (err) console.log(`Failed to save map!`, err) });
		return;
	}
	if(input.includes('load map')){
		const mapName = input.replace('load map ', '');
		setMap(mapName);
		return;
	}
  if (input == "show fps") serverFpsInterval = setInterval(() => { console.log(`FPS: ${fps}`); fps = 0; }, 1000);
  if (input == "hide fps") clearInterval(serverFpsInterval);
});
