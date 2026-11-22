// The Sunspire Job — the alarm meter: what raises it, what calms it.
// One job: the single number the whole heist hangs on, 0 to 100.

import {
  ALARM_GUARD_RATE,
  ALARM_CAMERA_RATE,
  ALARM_DECAY_RATE,
  ALARM_CRACK_RATE,
  ALARM_COIN_CLINK,
  ALARM_MAX,
} from './config.js';

/** The alarm's state: a level 0..100 and whether it has tripped. */
export function makeAlarm() {
  return { level: 0, tripped: false };
}

/**
 * Step the meter. Guard cones push it up fastest, cameras slower, cracking the
 * case adds noise; hidden and quiet, it bleeds away. Returns true the moment
 * it trips (level 100) — the heist is over.
 */
export function updateAlarm(alarm, seenByGuard, seenByCamera, cracking, dt) {
  if (alarm.tripped) return true;
  if (seenByGuard) alarm.level += ALARM_GUARD_RATE * dt;
  if (seenByCamera) alarm.level += ALARM_CAMERA_RATE * dt;
  if (cracking) alarm.level += ALARM_CRACK_RATE * dt;
  if (!seenByGuard && !seenByCamera && !cracking) {
    alarm.level -= ALARM_DECAY_RATE * dt;
  }
  alarm.level = Math.max(0, Math.min(ALARM_MAX, alarm.level));
  if (alarm.level >= ALARM_MAX) {
    alarm.tripped = true;
    return true;
  }
  return false;
}

/** A thrown coin's clink nudges the meter up a little. */
export function alarmCoinClink(alarm) {
  alarm.level = Math.min(ALARM_MAX, alarm.level + ALARM_COIN_CLINK);
}

/** How hot the meter reads: 'calm', 'warm' or 'hot' — for the HUD colour. */
export function alarmHeat(alarm) {
  if (alarm.level >= 70) return 'hot';
  if (alarm.level >= 35) return 'warm';
  return 'calm';
}
