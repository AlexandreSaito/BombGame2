import animeSetas from './setas.json' assert { type: 'json' };
import animeBomb from './objects/bomb.json' assert { type: 'json' };
import animeDW from './objects/damageableWall.json' assert { type: 'json' };
import animeExplosion from './objects/explosion.json' assert { type: 'json' };
import animePowerup from './objects/powerup.json' assert { type: 'json' };
import animeWall from './objects/wall.json' assert { type: 'json' };
import animeAkioShoot from './objects/akio_shoot.json' assert { type: 'json' };
const animations = {};
animations['setas'] = animeSetas;
animations['wall'] = animeWall;
animations['powerup'] = animePowerup;
animations['bomb'] = animeBomb;
animations['dmgwall'] = animeDW;
animations['explosion'] = animeExplosion;
animations['akio_shoot'] = animeAkioShoot;

export function getAnimation(name){
	return animations[name].animations;
}