// The Sunspire Job — the world: one game state, its update, win and lose.
// One job: hold everything, step it each frame, and decide how the heist ends.

import { makePlayer, updatePlayer, throwCoin } from './player.js';
import { makeGuards, updateGuard, guardSeesThief, guardsHearCoin, GUARD_CHASE } from './guards.js';
import { makeCameras, cameraSeesThief } from './cameras.js';
import { makeAlarm, updateAlarm, alarmCoinClink } from './alarm.js';
import { EXIT_VENT, rectCenter } from './level.js';
import { playLootChime, playGetaway, playCaught, playAlarmPulse } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WON = 'won';
export const SCREEN_CAUGHT = 'caught';

export const CAUGHT_BY_ALARM = 'alarm';
export const CAUGHT_BY_GUARD = 'guard';

/** A fresh heist: the thief at the vent, the diamond in its case, the meter at 0. */
export function makeWorld() {
  return {
    screen: SCREEN_TITLE,
    player: makePlayer(),
    guards: makeGuards(),
    cameras: makeCameras(),
    alarm: makeAlarm(),
    lootTaken: false,
    coins: [], // thrown coins lying on the floor
    time: 0,
    elapsed: 0,
    caughtBy: null,
    message: '',
    messageLeft: 0,
    alarmPulseLeft: 0,
    seenFlash: 0, // red edge flash while a cone holds the thief
  };
}

/** Start (or restart) the heist from the title screen. */
export function resetWorld(world) {
  const fresh = makeWorld();
  Object.assign(world, fresh, { screen: SCREEN_PLAY });
}

/** Show a one-line hint above the HUD for a few seconds. */
function say(world, text, seconds = 3) {
  world.message = text;
  world.messageLeft = seconds;
}

/**
 * Step the world one frame. `keys` are the held keys (lowercased), `click` is a
 * mouse click {x, y} in canvas pixels this frame, or null.
 */
export function updateWorld(world, keys, click, dt) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;
  world.elapsed += dt;
  if (world.messageLeft > 0) world.messageLeft -= dt;
  if (world.seenFlash > 0) world.seenFlash -= dt;

  // A click throws a coin toward the cursor (costs one, pulls guards over).
  if (click) {
    const coin = throwCoin(world.player, click.x, click.y, world);
    if (coin) {
      alarmCoinClink(world.alarm);
      guardsHearCoin(world.guards, coin);
      say(world, 'CLINK! The guards turn toward the coin…', 2);
    } else if (world.player.coins <= 0) {
      say(world, 'No coins left — slip past them instead.', 2);
    }
  }

  const action = updatePlayer(world.player, keys, dt, world);
  if (action === 'cracked') {
    playLootChime();
    say(world, 'THE SUNSPIRE DIAMOND IS YOURS — reach the vent!', 4);
  }
  const cracking = action === 'cracking';

  // Coins fade off the floor after a while.
  for (const coin of world.coins) coin.age += dt;
  world.coins = world.coins.filter((c) => c.age < 6);

  // Guards: patrol, investigate, chase — and catch.
  let seenByGuard = false;
  for (const guard of world.guards) {
    if (guardSeesThief(guard, world.player)) seenByGuard = true;
    const result = updateGuard(guard, world.player, dt);
    if (result === 'caught') {
      endCaught(world, CAUGHT_BY_GUARD);
      return;
    }
    if (result === 'spotted') say(world, `${guard.name} SPOTTED YOU!`, 2.5);
  }

  // Cameras sweep and watch.
  let seenByCamera = false;
  for (const camera of world.cameras) {
    if (cameraSeesThief(camera, world.player, world.time)) seenByCamera = true;
  }

  if (seenByGuard || seenByCamera) world.seenFlash = 0.25;

  // The alarm meter: up while seen, down while hidden.
  if (updateAlarm(world.alarm, seenByGuard, seenByCamera, cracking, dt)) {
    endCaught(world, CAUGHT_BY_ALARM);
    return;
  }
  if (world.alarm.level >= 70) {
    world.alarmPulseLeft -= dt;
    if (world.alarmPulseLeft <= 0) {
      world.alarmPulseLeft = 0.5;
      playAlarmPulse();
    }
  }

  // Getaway: the vent, with the diamond in hand.
  const vent = rectCenter(EXIT_VENT);
  if (
    world.lootTaken &&
    Math.hypot(world.player.x - vent.x, world.player.y - vent.y) < 46
  ) {
    world.screen = SCREEN_WON;
    playGetaway();
  }
}

function endCaught(world, by) {
  world.screen = SCREEN_CAUGHT;
  world.caughtBy = by;
  playCaught();
}

/** The heist's score: the diamond, minus the time it took, plus coins unspent. */
export function heistScore(world) {
  if (!world.lootTaken) return 0;
  const timeBonus = Math.max(0, 600 - Math.floor(world.elapsed) * 2);
  return 1000 + timeBonus + world.player.coins * 50;
}

/** "M:SS" for the HUD and the getaway screen. */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** One-line objective for the HUD, so the goal is always obvious. */
export function objectiveText(world) {
  if (!world.lootTaken) return 'STEAL the Sunspire Diamond — hold E at the glass case';
  return 'GETAWAY! Reach the service vent with the diamond';
}
