// The Sunspire Job — the wall cameras: sweeping cones that feed the alarm.
// One job: where the cameras sit, how they sweep, and when they spot the thief.

import { CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE } from './config.js';
import { lineOfSight } from './level.js';

export function makeCameras() {
  return [
    {
      name: 'CAM 1',
      x: 52,
      y: 84,
      baseAngle: 1.15, // sweeps down-right across the west aisle
      sweep: 0.55,
      phase: 0,
      speed: 0.55,
    },
    {
      name: 'CAM 2',
      x: 1228,
      y: 84,
      baseAngle: Math.PI - 1.15, // sweeps down-left across the east aisle
      sweep: 0.55,
      phase: Math.PI,
      speed: 0.45,
    },
  ];
}

/** A camera's current facing angle, sweeping back and forth. */
export function cameraAngle(camera, time) {
  return camera.baseAngle + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
}

/** True when the thief stands in this camera's sweeping cone with a clear view. */
export function cameraSeesThief(camera, player, time) {
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_CONE_RANGE) return false;
  let d = Math.atan2(dy, dx) - cameraAngle(camera, time);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) > CAMERA_CONE_HALF_ANGLE) return false;
  return lineOfSight(camera.x, camera.y, player.x, player.y);
}
