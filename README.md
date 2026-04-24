# Star Sweeper: A Space Adventure

A Sierra-style point-and-click adventure game — a loving tribute to *Space Quest 1*. You play a lowly janitor aboard the starship *Constellation* who must escape a Draknoid raid and recover the stolen Quantum Drive.

Built with **pure JavaScript and HTML5 Canvas**. No frameworks, no build step, no external assets — all art is procedurally drawn, all sound is synthesized via the Web Audio API.

## Play

Serve the folder over any static HTTP server and open `index.html` in a modern browser.

```powershell
npm run serve
# or
python -m http.server 8080
```

Then browse to http://localhost:8080.

## Controls

| Input | Action |
|---|---|
| Type command + `Enter` | Classic Sierra parser command |
| Mouse click / tap | Walk, or perform the current action in Enhanced mode |
| Arrow keys / D-pad | Walk |
| `F3` | Repeat the last typed command |
| `W` | Walk action |
| `L` | Look action |
| `G` | Get action |
| `U` | Use action |
| `T` | Talk action |
| `1`–`9` | Select a dialog option |
| `Space` / `Enter` | Advance dialog, confirm, or skip a cutscene |
| `Esc` | Close modal / skip cutscene |
| `F5` | Save game |
| `F7` | Load game |
| `M` | Toggle sound |
| `R` | Restart (after death) |
| `F10` | Toggle Classic parser / Enhanced point-and-click UI |

Classic mode is the default: try commands like `LOOK`, `GET MOP`, `USE KEYCARD ON DOOR`, `TALK TO PILOT`, `INVENTORY`, `SAVE`, and `RESTORE`. In Enhanced mode, click an inventory item to select it, then click a hotspot to use them together.

## Story

From your broom closet you'll sneak through a burning ship, launch the last escape pod, crash on a desert planet, hustle your way through a frontier outpost and cantina, and finally board the Draknoid warship to steal back the Quantum Drive. Ten rooms, one janitor, galactic stakes.

## Browser Requirements

- Modern evergreen browser (Chrome, Edge, Firefox, Safari)
- Canvas 2D, ES6 classes, `requestAnimationFrame`
- Web Audio API (optional — sound degrades gracefully if unsupported)
- WebXR (optional — VR mode lights up on supported devices such as Quest)

## Features

- 10 fully hand-crafted rooms with Sierra-style pseudo-3D perspective
- 5-slot save/load system using `localStorage`, with schema validation
- Installable as a PWA (service worker + manifest for offline play)
- Classic canvas-only parser interface, with optional enhanced point-and-click controls
- Touch-friendly D-pad on small screens in Enhanced mode
- Optional WebXR immersive mode

## Project Layout

```
index.html          UI shell, styles, bootstrap
manifest.json       PWA manifest
serviceworker.js    Offline cache — bump VERSION on every code change
js/
    engine.js       GameEngine class: loop, input, rendering, save/load
    game.js         All game content: rooms, items, puzzles, cutscenes
    sound.js        Web Audio synthesis
    vr.js           Optional WebXR integration
tools/              Dev-only helper scripts (not shipped)
```

## Development

No dependencies. Syntax-check the JS before shipping:

```powershell
npm run check
```

After any code change, bump `CACHE_VERSION` in [serviceworker.js](serviceworker.js) so returning players pick up the update.

## License

MIT — see [LICENSE](LICENSE).
