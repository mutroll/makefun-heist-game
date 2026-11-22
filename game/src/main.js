// The Sunspire Job — bootstrap: canvas, input, the game loop, staged shots.
// One job: wire the world to the page and run it.

import { CANVAS_W, CANVAS_H } from './config.js';
import { makeWorld, updateWorld, resetWorld, SCREEN_TITLE, SCREEN_PLAY } from './world.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const world = makeWorld();
const keys = {};
let pendingClick = null;
let lastTime = performance.now();

// A ?shot=cover|patrol|alarm|getaway URL stages a screenshot scene instead of
// the title screen. The same drawWorld() paints it — a real render, not a mock.
const shotName = new URLSearchParams(window.location.search).get('shot');
const frozenShot = Boolean(shotName); // a staged shot holds its moment still:
// the world is a real game state and the same drawWorld() paints it, but the
// simulation does not run on, so the alarm and the guards stay as staged.
if (shotName) {
  world.screen = stageShot(shotName, world);
}

function startHeist() {
  unlockAudio();
  if (world.screen === SCREEN_TITLE) resetWorld(world);
  else if (world.screen !== SCREEN_PLAY) resetWorld(world);
}

canvas.addEventListener('click', (event) => {
  unlockAudio();
  if (world.screen !== SCREEN_PLAY) {
    startHeist();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  pendingClick = {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
  };
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }
  unlockAudio();
  keys[key] = true;
  if (key === 'enter' || key === ' ') startHeist();
  if (key === 'r') resetWorld(world);
  if (key === 'q' && world.screen === SCREEN_PLAY) {
    // Q throws a coin toward the thief's facing, for keyboard-only play.
    const px = world.player.x + Math.cos(world.player.angle) * 120;
    const py = world.player.y + Math.sin(world.player.angle) * 120;
    pendingClick = { x: px, y: py };
  }
  if (key === 'm') toggleMute();
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (world.screen === SCREEN_PLAY && !frozenShot) {
    updateWorld(world, keys, pendingClick, dt);
  } else if (world.screen === SCREEN_TITLE) {
    // The title screen's guards and cameras keep sweeping behind the panel.
    world.time += dt;
    for (const guard of world.guards) {
      guard.angle += dt * 0.25;
    }
  }
  pendingClick = null;
  drawWorld(ctx, world);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
