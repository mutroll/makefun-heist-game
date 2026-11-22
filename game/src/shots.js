// The Sunspire Job — staged screenshot scenes behind ?shot=cover|patrol|alarm|getaway.
// Each scene sets the real world to a real moment — positions, facing, alarm,
// loot — and the renderer paints exactly what a player would see there.
// No pixels are faked: the same drawWorld() paints the game and the screenshots.

import { GUARD_SUSPICIOUS, GUARD_CHASE } from './guards.js';
import { SCREEN_PLAY, SCREEN_WON, resetWorld } from './world.js';

/** Put an entity at pixel (x, y), facing `angle`. */
function place(entity, x, y, angle) {
  entity.x = x;
  entity.y = y;
  entity.angle = angle;
}

function guardAt(world, index, x, y, angle, state, suspicion) {
  const guard = world.guards[index];
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.pauseLeft = 0;
  guard.investigate = null;
  return guard;
}

/**
 * Stage the named scene and return the screen to draw over it.
 * cover — the whole heist at a glance: thief mid-room, cones sweeping, cameras,
 *   the diamond glowing in its case, alarm meter at a third.
 * patrol — a guard's cone closing on Wren behind a pedestal, meter half full.
 * alarm — a camera has Wren in its cone and a guard is chasing, meter near full.
 * getaway — the diamond secured, Wren at the vent, the GETAWAY! screen.
 */
export function stageShot(name, world) {
  resetWorld(world);
  const player = world.player;

  if (name === 'patrol') {
    place(player, 430, 470, -Math.PI / 2);
    player.sneaking = true;
    guardAt(world, 0, 560, 300, Math.PI / 2, GUARD_SUSPICIOUS, 0.55);
    guardAt(world, 1, 1090, 420, -Math.PI / 2, 'patrol', 0.1);
    guardAt(world, 2, 770, 130, Math.PI, 'patrol', 0);
    world.alarm.level = 52;
    world.time = 41;
    world.elapsed = 41;
    world.message = 'BRAM is suspicious — stay behind the pedestal…';
    world.messageLeft = 99;
    return SCREEN_PLAY;
  }

  if (name === 'alarm') {
    // Wren is caught in CAM 2's sweep at t=96 (its cone points at 2.38 rad,
    // straight at this spot) while Bram closes in — the meter nearly full.
    place(player, 1000, 300, Math.PI);
    player.sneaking = false;
    guardAt(world, 0, 860, 240, 0.4, GUARD_CHASE, 0.95);
    guardAt(world, 1, 1090, 500, -Math.PI / 2, GUARD_SUSPICIOUS, 0.6);
    guardAt(world, 2, 770, 130, Math.PI, 'patrol', 0.2);
    world.alarm.level = 84;
    world.seenFlash = 0.25;
    world.time = 96;
    world.elapsed = 96;
    world.message = 'ODETTE SPOTTED YOU! Break line of sight!';
    world.messageLeft = 99;
    return SCREEN_PLAY;
  }

  if (name === 'getaway') {
    place(player, 640, 640, -Math.PI / 2);
    player.sneaking = false;
    world.lootTaken = true;
    world.alarm.level = 22;
    world.time = 148;
    world.elapsed = 148;
    world.screen = SCREEN_WON;
    return SCREEN_WON;
  }

  // cover (default): the whole room in one frame.
  place(player, 640, 430, -Math.PI / 2);
  player.sneaking = true;
  guardAt(world, 0, 430, 300, 0.5, 'patrol', 0.25);
  guardAt(world, 1, 1090, 350, Math.PI / 2, 'patrol', 0.05);
  guardAt(world, 2, 770, 130, Math.PI, 'patrol', 0.15);
  world.alarm.level = 34;
  world.time = 23;
  world.elapsed = 23;
  world.message = 'Three guards, two cameras — read the cones before you move.';
  world.messageLeft = 99;
  return SCREEN_PLAY;
}
