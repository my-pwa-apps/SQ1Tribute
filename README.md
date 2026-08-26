# Star Sweeper: A Space Adventure

A modern Sierra-style adventure game — a loving tribute to *Space Quest 1*, not an attempt to masquerade as a lost Sierra release. You play a lowly janitor aboard the starship *Constellation* who must escape a Draknoid raid and recover the stolen Quantum Drive.

Built with **pure JavaScript and HTML5 Canvas**. There is no framework, production dependency, or build step — all art is procedurally drawn and all sound is synthesized via the Web Audio API. Playwright is used only for development tests. The game keeps the parser, score, deaths, inventory puzzles, and dry narrator, while using modern conveniences such as optional point-and-click controls, generous save slots, touch support, and offline caching.

## Play

Serve the folder over any static HTTP server and open `index.html` in a modern browser.

```powershell
npm run serve
```

Then browse to http://localhost:8080.

## Controls

| Input | Action |
|---|---|
| Type command + `Enter` | Classic Sierra parser command |
| Mouse click / tap | Walk, or perform the current action in Enhanced mode |
| Arrow keys / D-pad | Walk |
| `F3` | Repeat the last typed command |
| `F2` | Highlight every interactive object in the room |
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
| `F9` | Toggle CRT / clean pixel display |
| `M` | Toggle sound |
| `R` | Restart (after death) |
| `F10` | Toggle Classic parser / Enhanced point-and-click UI |

Classic mode is the desktop default: try commands like `LOOK`, `GET MOP`, `DRINK PUDDLE`, `USE KEYCARD ON DOOR`, `TALK TO PILOT`, `INVENTORY`, `SAVE`, and `RESTORE`. Touch-first devices default to Enhanced mode. If Classic is selected on touch hardware, the on-screen parser, D-pad, and save controls remain available. In Enhanced mode, click an inventory item to select it, then click a hotspot to use them together.

## Story

From your broom closet you'll sneak through a burning ship, launch the last escape pod, crash on a desert planet, hustle your way through a frontier outpost and cantina, and finally board the Draknoid warship to steal back the Quantum Drive. More than thirteen locations, one janitor, galactic stakes.

## Browser Requirements

- Modern evergreen browser (Chrome, Edge, Firefox, Safari)
- Canvas 2D, ES6 classes, `requestAnimationFrame`
- Web Audio API (optional — sound degrades gracefully if unsupported)
- WebXR (optional — VR mode lights up on supported devices such as Quest)

## Features

- 13+ fully hand-crafted rooms with Sierra-style pseudo-3D perspective
- 5-slot save/load system using `localStorage`, with schema validation
- Installable as a PWA (service worker + manifest for offline play)
- Classic canvas-only parser interface, with optional enhanced point-and-click controls
- Parser snark for wrong verbs, odd commands, and the traditional bad ideas players insist on trying
- Object highlighting (`F2`, or the Objects button) so touch players can find hotspots without hover
- Recoverable late-game workaround for players who ignored one important shipboard errand
- Optional CRT display effects, for players who want either nostalgia or clean pixels
- Touch-friendly D-pad on small screens in Enhanced mode
- Optional WebXR immersive mode

## Project Layout

```
index.html          UI shell, styles, bootstrap
manifest.json       PWA manifest
serviceworker.js    Offline cache — bump VERSION on every code change
js/
    engine.js       GameEngine class: loop, input, rendering, save/load
    content.js      Structured game metadata and item definitions
    game.js         All game content: rooms, items, puzzles, cutscenes
    sound.js        Web Audio synthesis
    vr.js           Optional WebXR integration
tools/              Dev-only helper scripts (not shipped)
```

## Development

Install the development dependencies and run the complete release gate:

```powershell
npm install
npm run check
```

`npm run check` performs JavaScript syntax checks, structured room/item/asset validation, and Playwright tests in desktop Chrome and Pixel 5 emulation. The browser suite covers mode selection, the touch parser, save/load, accessibility mirrors, both final-console puzzle routes, offline reload, update UI, and the absence of full-canvas pixel readbacks. It also compares reviewed visual baselines for the title, representative rooms, CRT output, and mobile framing. Update those baselines deliberately with `npx playwright test tests/visual.spec.js --update-snapshots` only after reviewing the rendered changes.

Content metadata and items live in [js/content.js](js/content.js) so the validator can consume exact IDs without booting the UI. Room groups remain in [js/game.js](js/game.js); keep production content files below 400 KB and extract the next stable room group before crossing that threshold.

## Production Deployment

The repository root is the deploy directory. Publish it unchanged to a static HTTPS host. Relative asset and service-worker paths support both root domains and project subpaths such as GitHub Pages.

- Cloudflare Pages and Netlify consume the included [_headers](_headers) file for CSP, framing, MIME, referrer, and permissions policies.
- GitHub Pages ignores `_headers`; apply equivalent headers through a proxy/CDN if those protections are required.
- Saves and interface preferences use `localStorage`. They are bound to the exact production origin and do not transfer between preview URLs, domains, or browsers.
- WebXR requires HTTPS, a compatible browser/device, and physical Quest-class hardware. Desktop emulation does not replace a device smoke test.

### Release Checklist

1. Run `npm ci` and `npm run check`.
2. Increment `VERSION` in [serviceworker.js](serviceworker.js) after every code change.
3. Deploy the repository root over HTTPS and verify response headers where the host supports them.
4. Start a game, save and restore a slot, and complete a parser command in both interface modes.
5. On a touch device, verify Enhanced is the first-run default and Classic exposes its parser and D-pad.
6. Reload once online, switch the browser offline, and confirm the installed app still starts.
7. Deploy a second version and confirm the keyboard-accessible update prompt reloads the new worker.
8. On WebXR hardware, enter and exit VR and verify controller interaction, frame stability, and room textures.

## License

MIT — see [LICENSE](LICENSE).

The bundled pixel typeface **VT323** (by Peter Hull) is licensed under the SIL Open Font License 1.1 — see [fonts/VT323-OFL.txt](fonts/VT323-OFL.txt).
