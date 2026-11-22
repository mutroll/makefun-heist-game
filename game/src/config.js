// The Sunspire Job — shared constants: canvas, colours, speeds, alarm tuning.
// One job: every number the rest of the game agrees on lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// The play room sits under the HUD strip (y 0..52) and inside the outer walls.
export const ROOM = { x: 16, y: 56, w: 1248, h: 648 };
export const HUD_H = 52;

// Player movement (pixels per second).
export const PLAYER_WALK_SPEED = 132;
export const PLAYER_SNEAK_SPEED = 66;
export const PLAYER_RADIUS = 13;

// Guards.
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 152;
export const GUARD_RADIUS = 15;
export const GUARD_CONE_RANGE = 195;
export const GUARD_CONE_HALF_ANGLE = 0.62; // ~35 degrees
export const GUARD_TOUCH_CATCH = 27;

// Cameras.
export const CAMERA_CONE_RANGE = 245;
export const CAMERA_CONE_HALF_ANGLE = 0.5;

// Alarm meter 0..100. Seen by a guard cone it climbs fast, by a camera slower,
// and it falls again whenever nobody can see the thief.
export const ALARM_GUARD_RATE = 30;
export const ALARM_CAMERA_RATE = 20;
export const ALARM_DECAY_RATE = 11;
export const ALARM_CRACK_RATE = 6; // noise while cracking the diamond case
export const ALARM_COIN_CLINK = 4;
export const ALARM_MAX = 100;

// The diamond case: hold E this long beside it to crack it open.
export const CRACK_SECONDS = 2.5;
export const CRACK_REACH = 78;

// Tools: the thief carries this many brass coins. A thrown coin costs one.
export const START_COINS = 3;
export const COIN_NOISE_RADIUS = 300;
export const COIN_THROW_RANGE = 190;

// Colours — deep indigo marble, gold trim, crimson danger, emerald loot.
export const COLORS = {
  floor: '#1c2340',
  floorDark: '#161c33',
  floorLine: '#2a3358',
  gold: '#d9a441',
  goldBright: '#f2c14e',
  carpet: '#7a2436',
  carpetEdge: '#a83247',
  wall: '#0e1226',
  wallTrim: '#d9a441',
  pedestal: '#3a2c1e',
  pedestalTop: '#5a4630',
  statue: '#8f97ad',
  glass: 'rgba(150, 210, 235, 0.28)',
  diamond: '#7dfcd9',
  diamondGlow: '#39e6b0',
  coneGuard: 'rgba(255, 64, 64, 0.20)',
  coneGuardEdge: 'rgba(255, 90, 90, 0.55)',
  coneCamera: 'rgba(255, 190, 60, 0.18)',
  coneCameraEdge: 'rgba(255, 200, 90, 0.5)',
  coneSuspicious: 'rgba(255, 140, 40, 0.30)',
  guardBody: '#2e3448',
  guardTrim: '#c8ccd8',
  thiefCloak: '#232a3d',
  thiefHood: '#39415e',
  thiefMask: '#e8e4d8',
  hudBg: 'rgba(10, 13, 28, 0.88)',
  text: '#f2ead8',
  textDim: '#b9b3a0',
  alarmLow: '#39d98a',
  alarmMid: '#f2c14e',
  alarmHigh: '#ff4d4d',
  vent: '#4a5568',
  exitGlow: '#39d98a',
};
