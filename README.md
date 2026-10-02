# Space Attack

A small retro arcade shooter built with plain HTML, CSS, JavaScript, and Canvas. No build step, external assets, runtime dependencies, or network connection required.

## Play locally

Double-click **index.html** to open it in a modern browser.

Alternatively, with Node.js installed, run `npm start` and open **http://localhost:3000**. Installing packages is not necessary to play.

## Controls

| Action | Key |
| --- | --- |
| Move left / right | Arrow keys or A / D |
| Fire continuously | Hold Space |
| Start / restart / resume | Enter |
| Pause / resume | P or Escape |
| Toggle sound | M |

The buttons also support mouse and keyboard interaction. Touch devices show movement and fire buttons. Switching tabs or leaving the window automatically pauses gameplay.

## Gameplay

Protect Earth through endless waves. Scouts earn 100 points, strikers 200, and commanders 400. Clearing a wave awards 500 bonus points. Enemy projectiles and ship collisions each cost one of three shields, with a brief invulnerability window after a hit. Enemies peel away from the formation to dive at the player. Waves increase projectile speed, dive speed, attack frequency, and eventually simultaneous shots. High scores and sound preferences are saved locally when browser storage is available.

The supplied 43-second gameplay reference inspired the black field, cyan player, horizontal movement, upward shots, tight red/green/yellow formations, diving enemies, and numeric arcade HUD. Sprites and synthesized sound effects are original code-generated assets.

Enemy fire now ramps more gradually: the first two-shot volleys arrive at Wave 6, with the projectile speed and firing interval previously used at Wave 3. Movement and diving behavior retain their existing progression. The cabinet uses the available window height, with a compact header and supporting controls beside the game (below it on narrow screens).

## Checks

`npm test` runs deterministic simulation checks using Node's built-in test runner.

Optional browser checks: `npm install`, then `npm run test:browser`. The browser test uses a locally installed Chrome or Edge on Windows, or Playwright's Chromium on other systems (`npx playwright install chromium`).

Manual play test:

- Start using Enter or the button; move in both directions and hold Space.
- Check that hits increase the score and enemy shots/dives remove shields.
- Clear a formation and confirm the next wave appears with stronger attacks.
- Pause/resume using P and by switching tabs; toggle sound with M.
- Lose all three shields, then restart. Score, shields, and wave should reset, while the high score remains.
- Try fullscreen and narrow-window layouts.
