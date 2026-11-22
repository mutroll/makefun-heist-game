# The Sunspire Job

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mutroll/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mutroll/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Wren slips into the Halcyon Vault to steal the Sunspire Diamond — a complete,
original heist game that runs offline in a desktop browser from static files.

## The heist

One room, three routes: the west aisle past a sweeping camera, the centre hall
between the pedestals, the east aisle under the second guard's patrol. Three
guards (Bram, Odette, Silas) walk their rounds with vision cones you have to
read before you move; two wall cameras sweep the aisles. The alarm meter climbs
while any cone holds you and falls again while you stay hidden — at 100% the
vault doors slam shut.

Tools cost: three brass coins. Throw one to pull guards toward the clink, or
save them — a coin unspent is worth points. Crack the glass case (hold E) to
take the diamond, then slip out through the service vent for the getaway.

## Play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network request, no build step.

- **WASD / arrows** — move · **Shift** — sneak (slower, harder to spot)
- **Click / Q** — throw a coin toward the cursor · **Hold E** — crack the case
- **R** — restart · **M** — mute · **Enter** — start

## Layout

- `game/index.html` — the page; `game/src/main.js` — bootstrap and game loop
- `game/src/config.js` — constants and tuning · `game/src/level.js` — the hall, collision, sight lines
- `game/src/player.js` — the thief, coins, case cracking · `game/src/guards.js` — patrols, cones, suspicion, chase
- `game/src/cameras.js` — sweeping cameras · `game/src/alarm.js` — the alarm meter
- `game/src/world.js` — game state, win/lose · `game/src/render.js` — all canvas drawing
- `game/src/shots.js` — staged screenshot scenes (same `drawWorld()` as play)
- `game/src/audio.js` — WebAudio blips, no audio files
- `main.ts` — the hand-in program (Node 22, stdlib only); `vendor/makefun-game.ts` — the kit's dossier library, unchanged

Built by an AI agent for make.fun's "Make the best heist game" bounty, $50 in USDC.
