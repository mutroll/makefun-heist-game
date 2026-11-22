// The Sunspire Job — the thief: movement, sneaking, coin throws, case cracking.
// One job: what the player does and what it costs.

import {
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_RADIUS,
  START_COINS,
  CRACK_SECONDS,
  CRACK_REACH,
  COIN_THROW_RANGE,
} from './config.js';
import { PLAYER_START, VAULT_CASE, rectCenter, moveCircle } from './level.js';
import { playCoinClink, playCrackTick } from './audio.js';

export function makePlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    angle: -Math.PI / 2, // facing up the hall, toward the diamond
    sneaking: false,
    moving: false,
    coins: START_COINS,
    crackProgress: 0, // 0..1 while holding E beside the case
    crackTick: 0,
  };
}

/** The thief sneaks when held: slower, quieter, harder for cones to hold. */
export function playerIsSneaking(player) {
  return player.sneaking;
}

/**
 * Step the thief from the held keys. Returns 'cracking' while E is held beside
 * the case, 'cracked' the moment the case opens, otherwise 'none'.
 */
export function updatePlayer(player, keys, dt, world) {
  let mx = 0;
  let my = 0;
  if (keys['arrowleft'] || keys['a']) mx -= 1;
  if (keys['arrowright'] || keys['d']) mx += 1;
  if (keys['arrowup'] || keys['w']) my -= 1;
  if (keys['arrowdown'] || keys['s']) my += 1;
  player.sneaking = Boolean(keys['shift']);
  player.moving = mx !== 0 || my !== 0;
  if (player.moving) {
    const len = Math.hypot(mx, my);
    const speed = (player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED) * dt;
    const dx = (mx / len) * speed;
    const dy = (my / len) * speed;
    moveCircle(player, dx, dy, PLAYER_RADIUS);
    player.angle = Math.atan2(dy, dx);
  }

  // Cracking the case: hold E beside it; moving away or letting go loses progress.
  const caseCentre = rectCenter(VAULT_CASE);
  const nearCase =
    Math.hypot(player.x - caseCentre.x, player.y - caseCentre.y) < CRACK_REACH + 30;
  if (!world.lootTaken && nearCase && keys['e']) {
    player.crackProgress += dt / CRACK_SECONDS;
    player.crackTick += dt;
    if (player.crackTick > 0.4) {
      player.crackTick = 0;
      playCrackTick();
    }
    if (player.crackProgress >= 1) {
      player.crackProgress = 0;
      world.lootTaken = true;
      return 'cracked';
    }
    return 'cracking';
  }
  player.crackProgress = 0;
  player.crackTick = 0;
  return 'none';
}

/**
 * Throw a brass coin toward (tx, ty) — at most COIN_THROW_RANGE away — to pull
 * guards off their patrol. Costs one coin; with none left, nothing happens.
 * Returns the landing point, or null when no coin was thrown.
 */
export function throwCoin(player, tx, ty, world) {
  if (player.coins <= 0) return null;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  const range = Math.min(dist, COIN_THROW_RANGE);
  const nx = dist === 0 ? player.x : player.x + (dx / dist) * range;
  const ny = dist === 0 ? player.y : player.y + (dy / dist) * range;
  player.coins -= 1;
  const coin = { x: nx, y: ny, age: 0 };
  world.coins.push(coin);
  playCoinClink();
  return coin;
}
