// The Sunspire Job — the guards: patrols, vision cones, suspicion, chase.
// One job: how the three guards move, what they see, and when they give chase.

import {
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
  GUARD_TOUCH_CATCH,
  COIN_NOISE_RADIUS,
} from './config.js';
import { lineOfSight, moveCircle } from './level.js';
import { playSpotted } from './audio.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';

/** A guard's suspicion: 0 calm, 0.45+ investigates, 0.85+ chases. */
export function makeGuards() {
  return [
    {
      name: 'BRAM',
      x: 260,
      y: 300,
      angle: 0,
      state: GUARD_PATROL,
      suspicion: 0,
      waypoints: [
        { x: 260, y: 300 },
        { x: 1020, y: 300 },
      ],
      waypoint: 1,
      pauseLeft: 0,
      investigate: null,
      investigateLeft: 0,
      spotted: false,
    },
    {
      name: 'ODETTE',
      x: 1090,
      y: 130,
      angle: Math.PI / 2,
      state: GUARD_PATROL,
      suspicion: 0,
      waypoints: [
        { x: 1090, y: 130 },
        { x: 1090, y: 580 },
      ],
      waypoint: 1,
      pauseLeft: 0,
      investigate: null,
      investigateLeft: 0,
      spotted: false,
    },
    {
      name: 'SILAS',
      x: 480,
      y: 120,
      angle: 0,
      state: GUARD_PATROL,
      suspicion: 0,
      waypoints: [
        { x: 480, y: 120 },
        { x: 800, y: 120 },
        { x: 800, y: 230 },
        { x: 480, y: 230 },
      ],
      waypoint: 1,
      pauseLeft: 0,
      investigate: null,
      investigateLeft: 0,
      spotted: false,
    },
  ];
}

/** Smallest signed angle from a to b, in (-PI, PI]. */
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Can this guard see the thief right now? Inside the cone, inside range, with a
 * clear line of sight. A sneaking thief is harder to hold: the cone reads shorter.
 */
export function guardSeesThief(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneaking ? GUARD_CONE_RANGE * 0.62 : GUARD_CONE_RANGE;
  if (dist > range) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.angle)) > GUARD_CONE_HALF_ANGLE) return false;
  return lineOfSight(guard.x, guard.y, player.x, player.y);
}

/** True when the guard is close enough to grab the thief. */
export function guardTouchesThief(guard, player) {
  return Math.hypot(guard.x - player.x, guard.y - player.y) < GUARD_TOUCH_CATCH;
}

function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  moveCircle(guard, (dx / dist) * step, (dy / dist) * step, 15);
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

/** A thrown coin pulls every guard in earshot toward where it landed. */
export function guardsHearCoin(guards, coin) {
  for (const guard of guards) {
    if (Math.hypot(guard.x - coin.x, guard.y - coin.y) < COIN_NOISE_RADIUS) {
      guard.investigate = { x: coin.x, y: coin.y };
      guard.investigateLeft = 3;
      if (guard.state === GUARD_PATROL) guard.state = GUARD_SUSPICIOUS;
    }
  }
}

/**
 * Step one guard. Returns 'caught' when the guard grabs the thief, 'spotted'
 * the moment a chase begins, otherwise null.
 */
export function updateGuard(guard, player, dt) {
  const sees = guardSeesThief(guard, player);
  if (sees) {
    guard.suspicion = Math.min(1, guard.suspicion + dt * (player.sneaking ? 0.7 : 1.4));
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.45);
  }
  if (guard.suspicion >= 0.85 && guard.state !== GUARD_CHASE) {
    guard.state = GUARD_CHASE;
    if (!guard.spotted) {
      guard.spotted = true;
      playSpotted();
      return 'spotted';
    }
  } else if (guard.suspicion < 0.45 && guard.state === GUARD_CHASE) {
    guard.state = GUARD_SUSPICIOUS;
    guard.investigate = { x: player.x, y: player.y };
    guard.investigateLeft = 2.5;
  }
  if (guard.state === GUARD_SUSPICIOUS && guard.suspicion < 0.3 && !guard.investigate) {
    guard.state = GUARD_PATROL;
  }

  if (guard.state === GUARD_CHASE) {
    walkToward(guard, player.x, player.y, GUARD_CHASE_SPEED, dt);
    if (guardTouchesThief(guard, player)) return 'caught';
    return null;
  }

  if (guard.state === GUARD_SUSPICIOUS && guard.investigate) {
    guard.investigateLeft -= dt;
    const arrived = walkToward(guard, guard.investigate.x, guard.investigate.y, GUARD_PATROL_SPEED * 1.4, dt);
    if (arrived || guard.investigateLeft <= 0) {
      // Look around, then give up and go back to the patrol.
      guard.pauseLeft = 1.2;
      guard.investigate = null;
      guard.state = GUARD_PATROL;
    }
    return null;
  }

  // Patrol: walk the waypoints, pausing at each end to sweep the room.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.angle += dt * 0.9; // sweep the cone while standing still
    return null;
  }
  const target = guard.waypoints[guard.waypoint];
  const arrived = walkToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt);
  if (arrived) {
    guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
    guard.pauseLeft = 1.4;
  }
  return null;
}
