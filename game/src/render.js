// The Sunspire Job — the renderer: one canvas, everything the judge sees.
// One job: paint the hall, the cones, the thief, the HUD and the screens.

import { CANVAS_W, CANVAS_H, COLORS, ROOM, HUD_H, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE } from './config.js';
import { PEDESTALS, VAULT_CASE, EXIT_VENT, ROPES, rectCenter } from './level.js';
import { cameraAngle } from './cameras.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';
import { alarmHeat } from './alarm.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WON, SCREEN_CAUGHT, CAUGHT_BY_ALARM, heistScore, formatTime, objectiveText } from './world.js';

/** Draw a vision cone: a wedge from (x, y) facing `angle`. */
function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** Small caps label with a dark pill behind it, readable when shrunk. */
function drawLabel(ctx, text, x, y, fg = COLORS.text, bg = 'rgba(10,13,28,0.75)') {
  ctx.font = 'bold 12px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 10, w, 20, 10);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

/** The marble floor, carpet runner, ropes and gold trim. */
function drawRoom(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // Marble tiles.
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = ROOM.x + 78; x < ROOM.x + ROOM.w; x += 78) {
    ctx.beginPath();
    ctx.moveTo(x, ROOM.y);
    ctx.lineTo(x, ROOM.y + ROOM.h);
    ctx.stroke();
  }
  for (let y = ROOM.y + 78; y < ROOM.y + ROOM.h; y += 78) {
    ctx.beginPath();
    ctx.moveTo(ROOM.x, y);
    ctx.lineTo(ROOM.x + ROOM.w, y);
    ctx.stroke();
  }
  // Checker sheen on alternate tiles.
  ctx.fillStyle = COLORS.floorDark;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) continue;
      ctx.fillRect(ROOM.x + i * 78, ROOM.y + j * 78, 78, 78);
    }
  }
  // Crimson carpet runner down the middle aisle.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(580, ROOM.y, 120, ROOM.h);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(580, ROOM.y, 120, ROOM.h);
  // Velvet ropes between pedestals.
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 6]);
  for (const rope of ROPES) {
    ctx.beginPath();
    ctx.moveTo(rope.x1, rope.y1);
    ctx.lineTo(rope.x2, rope.y2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Outer walls with gold trim.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, ROOM.y - 16, CANVAS_W, 16);
  ctx.fillRect(0, ROOM.y + ROOM.h, CANVAS_W, 16);
  ctx.fillRect(0, ROOM.y - 16, 16, ROOM.h + 32);
  ctx.fillRect(CANVAS_W - 16, ROOM.y - 16, 16, ROOM.h + 32);
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x - 1, ROOM.y - 1, ROOM.w + 2, ROOM.h + 2);
}

/** Pedestals with their treasures, and the centre statue. */
function drawPedestals(ctx) {
  for (const p of PEDESTALS) {
    ctx.fillStyle = COLORS.pedestal;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = COLORS.pedestalTop;
    ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    // The treasure on top.
    ctx.fillStyle = COLORS.goldBright;
    ctx.beginPath();
    if (p.label === 'STATUE') {
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 16, 0, Math.PI * 2);
    } else {
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2 - 4, 9, 0, Math.PI * 2);
    }
    ctx.fill();
    drawLabel(ctx, p.label, p.x + p.w / 2, p.y + p.h - 2, COLORS.textDim);
  }
}

/** The glass case and the glowing Sunspire Diamond. */
function drawVaultCase(ctx, lootTaken, time) {
  const c = VAULT_CASE;
  ctx.fillStyle = '#101830';
  ctx.fillRect(c.x - 6, c.y - 6, c.w + 12, c.h + 12);
  ctx.fillStyle = COLORS.glass;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  if (!lootTaken) {
    const pulse = 0.75 + 0.25 * Math.sin(time * 3);
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46);
    glow.addColorStop(0, `rgba(57, 230, 176, ${0.55 * pulse})`);
    glow.addColorStop(1, 'rgba(57, 230, 176, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 46, cy - 46, 92, 92);
    // The diamond: a faceted gem.
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 13, cy - 2);
    ctx.lineTo(cx + 8, cy + 12);
    ctx.lineTo(cx - 8, cy + 12);
    ctx.lineTo(cx - 13, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawLabel(ctx, 'LOOT · SUNSPIRE DIAMOND', cx, c.y - 18, COLORS.diamondGlow);
  } else {
    drawLabel(ctx, 'CASE CRACKED — EMPTY', c.x + c.w / 2, c.y - 18, COLORS.textDim);
  }
}

/** The service vent in the bottom wall — the getaway. */
function drawVent(ctx, lootTaken, time) {
  const v = EXIT_VENT;
  const pulse = lootTaken ? 0.7 + 0.3 * Math.sin(time * 4) : 0.35;
  ctx.fillStyle = COLORS.vent;
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = lootTaken ? COLORS.exitGlow : COLORS.gold;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = `rgba(242, 234, 216, ${pulse})`;
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(v.x + 6, v.y + i * 7);
    ctx.lineTo(v.x + v.w - 6, v.y + i * 7);
    ctx.stroke();
  }
  drawLabel(ctx, lootTaken ? 'EXIT — GO!' : 'EXIT VENT', v.x + v.w / 2, v.y - 16, lootTaken ? COLORS.exitGlow : COLORS.textDim);
}

/** A guard: cone first (under everything), then the uniformed figure. */
function drawGuard(ctx, guard) {
  const fill = guard.state === GUARD_CHASE ? 'rgba(255, 64, 64, 0.32)' : guard.state === GUARD_SUSPICIOUS ? COLORS.coneSuspicious : COLORS.coneGuard;
  const edge = guard.state === GUARD_CHASE ? 'rgba(255, 90, 90, 0.8)' : COLORS.coneGuardEdge;
  drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, fill, edge);
  // Body.
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim points where he looks.
  ctx.fillStyle = COLORS.guardTrim;
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 15, guard.y + Math.sin(guard.angle) * 15, 5, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion "!" over a guard who has seen something.
  if (guard.suspicion > 0.3) {
    ctx.fillStyle = guard.suspicion >= 0.85 ? '#ff4d4d' : '#ffb13d';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', guard.x, guard.y - 26);
  }
  drawLabel(ctx, `GUARD ${guard.name}`, guard.x, guard.y + 30);
}

/** A wall camera and its sweeping cone. */
function drawCamera(ctx, camera, time) {
  const angle = cameraAngle(camera, time);
  drawCone(ctx, camera.x, camera.y, angle, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE, COLORS.coneCamera, COLORS.coneCameraEdge);
  ctx.fillStyle = '#3a4152';
  ctx.fillRect(camera.x - 11, camera.y - 8, 22, 16);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(camera.x - 11, camera.y - 8, 22, 16);
  ctx.fillStyle = '#ff5b5b';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(angle) * 12, camera.y + Math.sin(angle) * 12, 4, 0, Math.PI * 2);
  ctx.fill();
  drawLabel(ctx, camera.name, camera.x, camera.y + 26, '#ffd27d');
}

/** The thief: a hooded figure, cloak darker while sneaking. */
function drawPlayer(ctx, player, lootTaken) {
  // Crack progress ring while working the case.
  if (player.crackProgress > 0) {
    ctx.strokeStyle = COLORS.goldBright;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 24, -Math.PI / 2, -Math.PI / 2 + player.crackProgress * Math.PI * 2);
    ctx.stroke();
    drawLabel(ctx, 'CRACKING THE CASE…', player.x, player.y - 34, COLORS.goldBright);
  }
  ctx.fillStyle = player.sneaking ? '#1a2033' : COLORS.thiefCloak;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.goldBright;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood point and mask.
  ctx.fillStyle = COLORS.thiefHood;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 6, player.y + Math.sin(player.angle) * 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thiefMask;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 10, player.y + Math.sin(player.angle) * 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (lootTaken) {
    // The diamond glints in the thief's hand.
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  drawLabel(ctx, player.sneaking ? 'WREN · SNEAKING' : 'WREN · THE THIEF', player.x, player.y + 28, COLORS.text);
}

/** Thrown coins lying on the floor. */
function drawCoins(ctx, coins) {
  for (const coin of coins) {
    ctx.fillStyle = COLORS.goldBright;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a1d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** The HUD strip: title, alarm meter, objective, coins, loot, time. */
function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(CANVAS_W, HUD_H);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('THE SUNSPIRE JOB', 16, HUD_H / 2 - 8);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('a heist in the Halcyon Vault', 16, HUD_H / 2 + 12);

  // Alarm meter.
  const meterX = 300;
  const meterW = 300;
  const meterY = 14;
  const meterH = 20;
  const heat = alarmHeat(world.alarm);
  const fillColor = heat === 'hot' ? COLORS.alarmHigh : heat === 'warm' ? COLORS.alarmMid : COLORS.alarmLow;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', meterX, meterY + meterH / 2);
  ctx.fillStyle = '#10142a';
  ctx.fillRect(meterX + 58, meterY, meterW, meterH);
  ctx.fillStyle = fillColor;
  ctx.fillRect(meterX + 58, meterY, (meterW * world.alarm.level) / 100, meterH);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX + 58, meterY, meterW, meterH);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(world.alarm.level)}%`, meterX + 58 + meterW + 42, meterY + meterH / 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(world.alarm.level >= 70 ? 'HOT — break line of sight!' : world.alarm.level >= 35 ? 'WARM — stay out of the cones' : 'CALM', meterX + 58, meterY + meterH + 12);

  // Coins, loot, time on the right.
  const rightX = CANVAS_W - 16;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`COINS ${'●'.repeat(world.player.coins)}${'○'.repeat(3 - world.player.coins)}`, rightX, 18);
  ctx.fillStyle = world.lootTaken ? COLORS.diamondGlow : COLORS.textDim;
  ctx.fillText(world.lootTaken ? '◆ DIAMOND SECURED' : '◇ DIAMOND IN THE CASE', rightX, 38);
  ctx.fillStyle = COLORS.text;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`TIME ${formatTime(world.elapsed)}`, rightX - 260, 18);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(objectiveText(world), rightX - 260, 38);
  ctx.textAlign = 'left';

  // A hint line under the HUD, left-aligned so it never collides with the
  // vault-case label at the top centre of the room.
  if (world.messageLeft > 0 && world.message) {
    ctx.fillStyle = COLORS.goldBright;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(world.message, 20, HUD_H + 18);
  }
}

/** Red edge flash while a cone holds the thief. */
function drawSeenFlash(ctx, world) {
  if (world.seenFlash <= 0) return;
  ctx.strokeStyle = `rgba(255, 60, 60, ${Math.min(0.8, world.seenFlash * 2)})`;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, CANVAS_W - 10, CANVAS_H - 10);
}

function drawPlay(ctx, world) {
  drawRoom(ctx);
  drawVaultCase(ctx, world.lootTaken, world.time);
  drawVent(ctx, world.lootTaken, world.time);
  drawPedestals(ctx);
  for (const camera of world.cameras) drawCamera(ctx, camera, world.time);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawCoins(ctx, world.coins);
  drawPlayer(ctx, world.player, world.lootTaken);
  drawHud(ctx, world);
  drawSeenFlash(ctx, world);
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 24, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const pw = 640;
  const ph = 150 + lines.length * 30;
  const px = (CANVAS_W - pw) / 2;
  const py = (CANVAS_H - ph) / 2;
  ctx.fillStyle = '#141a33';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(px, py, pw, ph);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(title, CANVAS_W / 2, py + 52);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, py + 100 + i * 30));
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Click or press ENTER to play again  ·  R restarts', CANVAS_W / 2, py + ph - 28);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, world) {
  drawRoom(ctx);
  drawVaultCase(ctx, false, world.time);
  drawVent(ctx, false, world.time);
  drawPedestals(ctx);
  for (const camera of world.cameras) drawCamera(ctx, camera, world.time);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, world.player, false);
  ctx.fillStyle = 'rgba(8, 10, 24, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('THE SUNSPIRE JOB', CANVAS_W / 2, 150);
  ctx.fillStyle = COLORS.text;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Wren slips into the Halcyon Vault to steal the Sunspire Diamond.', CANVAS_W / 2, 192);
  ctx.fillText('Three guards, two cameras, one alarm meter. Get in, get out.', CANVAS_W / 2, 220);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  const tips = [
    'WASD / arrows — move      SHIFT — sneak (slower, harder to spot)',
    'CLICK or Q — throw a coin (3 only) to pull guards away',
    'Hold E at the glass case — crack it, grab the diamond, reach the vent',
    'Red cones see you. The alarm rises while seen — and falls while hidden.',
  ];
  tips.forEach((tip, i) => ctx.fillText(tip, CANVAS_W / 2, 300 + i * 30));
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Click or press ENTER to start the heist', CANVAS_W / 2, 480);
  ctx.textAlign = 'left';
}

/** Paint the whole game for the world's current screen. */
export function drawWorld(ctx, world) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
    return;
  }
  if (world.screen === SCREEN_WON) {
    drawPlay(ctx, world);
    drawPanel(ctx, 'GETAWAY!', [
      `The Sunspire Diamond is yours — score ${heistScore(world)}.`,
      `Time ${formatTime(world.elapsed)} · coins left ${world.player.coins} · alarm peaked and fell.`,
      'Wren vanishes into the night. The vault never knew.',
    ], COLORS.exitGlow);
    return;
  }
  if (world.screen === SCREEN_CAUGHT) {
    drawPlay(ctx, world);
    const byAlarm = world.caughtBy === CAUGHT_BY_ALARM;
    drawPanel(ctx, 'CAUGHT!', [
      byAlarm ? 'The alarm hit 100% — the vault doors slammed shut.' : 'A guard grabbed Wren in the open.',
      byAlarm ? 'Watch the cones sweep, then move. Sneak to be harder to spot.' : 'Break line of sight behind a pedestal before the chase starts.',
      'The diamond stays in its case… this time.',
    ], COLORS.alarmHigh);
    return;
  }
  drawPlay(ctx, world);
}
