# Star Sweeper: A Space Adventure

A modern Sierra-style adventure game — a loving tribute to *Space Quest 1*, not an attempt to masquerade as a lost Sierra release. You play a lowly janitor aboard the starship *Constellation* who must escape a Draknoid raid and recover the stolen Quantum Drive.

Built with **JavaScript and HTML5 Canvas**, with a vendored Three.js module for optional immersive VR. There is no build step or runtime install — all art is procedurally drawn and all sound is synthesized via the Web Audio API. The game keeps the parser, score, deaths, inventory puzzles, and dry narrator, while using modern conveniences such as optional point-and-click controls, generous save slots, touch support, and offline caching.

## Play

Serve the folder over any static HTTP server and open `index.html` in a modern browser.

```powershell
npm run serve
```

Then browse to http://127.0.0.1:8080 (the server binds the loopback address explicitly, so `localhost` may fail on IPv6-first hosts).

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
| `M` | Toggle sound |
| `R` | Restart (after death) |
| `F10` | Toggle Classic parser / Enhanced point-and-click UI |

Classic mode is the desktop default: try commands like `LOOK`, `GET MOP`, `DRINK PUDDLE`, `USE KEYCARD ON DOOR`, `TALK TO PILOT`, `INVENTORY`, `SAVE`, and `RESTORE`. Touch-first devices default to Enhanced mode. If Classic is selected on touch hardware, the on-screen parser, D-pad, and save controls remain available. In Enhanced mode, click an inventory item to select it, then click a hotspot to use them together.

On a WebXR headset, choose **Enter VR** to play as Wilkins in first person. The left stick walks relative to your view, the trigger performs the selected action (and selects dialog options or dismisses narration, exactly as a desktop click does), grip cycles Walk/Look/Get/Use/Talk, clicking a thumbstick asks for a hint, B performs a quick Look, A confirms or skips, and the right stick cycles inventory while Use is selected. The head-relative HUD mirrors the desktop status bar: current action, score, the latest message, the selected item and everything you are carrying. Physical room-scale movement and head tracking are handled by WebXR; thumbstick movement remains constrained by each room's existing barriers and exits. Saving and loading stay on the desktop interface — exit VR to reach the slot manager, then re-enter.

## Story

From your broom closet you'll sneak through a burning ship, launch the last escape pod, crash on a desert planet, hustle your way through a frontier outpost and cantina, and finally board the Draknoid warship to steal back the Quantum Drive. More than thirteen locations, one janitor, galactic stakes.

## Browser Requirements

- Modern evergreen browser (Chrome, Edge, Firefox, Safari)
- Canvas 2D, ES6 classes, `requestAnimationFrame`
- Web Audio API (optional — sound degrades gracefully if unsupported)
- WebXR and WebGL2 for optional first-person VR

## Features

- 13+ fully hand-crafted rooms with Sierra-style pseudo-3D perspective
- 5-slot save/load system using `localStorage`, with schema validation
- Installable as a PWA (service worker + manifest for offline play)
- Classic canvas-only parser interface, with optional enhanced point-and-click controls
- Parser snark for wrong verbs, odd commands, and the traditional bad ideas players insist on trying
- Object highlighting (`F2`, or the Objects button) so touch players can find hotspots without hover
- Recoverable late-game workaround for players who ignored one important shipboard errand
- Touch-friendly D-pad on small screens in Enhanced mode
- First-person WebXR mode with head tracking, controller ray interaction, locomotion, and a head-relative Sierra HUD

## Project Layout

```
index.html          UI shell, styles, bootstrap
manifest.json       PWA manifest
serviceworker.js    Offline cache — bump VERSION on every code change
eslint.config.js    Lint rules; art-module globals are derived from js/art.js
js/
    palette.js      Shared EGA and semantic colour vocabulary
    engine.js       GameEngine class: loop, input, rendering, save/load
    sound.js        Web Audio synthesis
    vr.js           First-person WebXR integration and controller mapping
    vendor/         Pinned Three.js browser runtime and license
    content.js      Structured game metadata and item definitions
    registry.js     Room-module registry (no bundler, so rooms queue themselves)
    art.js          Procedural drawing helpers shared by rooms and cutscenes
    game.js         Bootstrap: items, dialog trees, intro cutscene, start
    rooms/
        ship.js         Broom closet, corridor, science lab, pod bay
        engine-room.js  Engine room
        kerona.js       Desert, cave, outpost, cantina, shop
        endgame.js      Docking bay, Draknoid brig, Draknoid flagship
tools/              Dev-only helper scripts (not shipped)
```

### Adding a room

Rooms never import the engine — they are parsed before it exists. Each room file
queues a factory that the bootstrap drains once the engine is constructed:

```js
StarSweeper.defineRooms((engine) => {
    engine.registerRoom({ id: 'my_room', /* ... */ });
});
```

Add the new file to `index.html` (before `js/game.js`), to the `ASSETS` list in
`serviceworker.js`, and to `CONTENT_FILES` in `tools/validate_content.js`.
`npm run check:static` fails if any of the three is missed.

## Development

Install the development dependencies and run the complete release gate:

```powershell
npm install
npm run check
```

| Script | Purpose |
|---|---|
| `npm run lint` | ESLint over every source and test file |
| `npm run check:static` | Lint, parse every module, and validate content cross-references |
| `npm run test:functional` | Playwright gameplay, architecture, and accessibility tests (platform-independent) |
| `npm run test:visual` | Visual regression against committed baselines |
| `npm run test:visual:update` | Re-record visual baselines after an intentional art change |
| `npm run check` | Full local gate: static checks, the cache-version guard, and every Playwright test |
| `npm run check:ci` | What CI runs: static checks plus the functional suite |
| `npm run check:sw` | Fails if a cached asset changed without a service worker version bump |

Visual baselines are platform-specific and are currently recorded on Windows, so
CI runs `check:ci` and the visual suite is a local pre-release step.

`tools/validate_content.js` enforces the content contract: unknown room and item
references, flags that are read but never set (or set but never read), a
`maxScore` larger than the sum of the awards, missing service-worker assets, and
any content module that is not loaded by the page or cached offline.
`npm run check` performs JavaScript syntax checks, structured room/item/asset validation, and Playwright tests in desktop Chrome and Pixel 5 emulation. The browser suite covers mode selection, the touch parser, save/load, accessibility mirrors, both final-console puzzle routes, offline reload, update UI, and the absence of full-canvas pixel readbacks. It also compares reviewed visual baselines for the title, representative rooms, and mobile framing. Update those baselines deliberately with `npx playwright test tests/visual.spec.js --update-snapshots` only after reviewing the rendered changes.

The WebXR test mocks capability discovery and verifies first-person state, room/floor projection, locomotion mapping, desktop restoration, and a nonblank Three.js render. Browser automation cannot validate stereo comfort or physical controller ergonomics; complete the headset check below before release.

Content metadata and items live in [js/content.js](js/content.js) so the validator can consume exact IDs without booting the UI. Room groups remain in [js/game.js](js/game.js); keep production content files below 400 KB and extract the next stable room group before crossing that threshold.

## Production Deployment

The repository root is the deploy directory. Publish it unchanged to a static HTTPS host. Relative asset and service-worker paths support both root domains and project subpaths such as GitHub Pages.

- Cloudflare Pages and Netlify consume the included [_headers](_headers) file for CSP, framing, MIME, referrer, and permissions policies.
- GitHub Pages ignores `_headers`; apply equivalent headers through a proxy/CDN if those protections are required.
- Saves and interface preferences use `localStorage`. They are bound to the exact production origin and do not transfer between preview URLs, domains, or browsers.
- Immersive VR requires HTTPS, WebXR, WebGL2, `local-floor` reference-space support, and a compatible headset such as Meta Quest.

### Release Checklist

1. Run `npm ci` and `npm run check`.
2. Increment `VERSION` in [serviceworker.js](serviceworker.js) after every code change.
3. Deploy the repository root over HTTPS and verify response headers where the host supports them.
4. Start a game, save and restore a slot, and complete a parser command in both interface modes.
5. On a touch device, verify Enhanced is the first-run default and Classic exposes its parser and D-pad.
6. Reload once online, switch the browser offline, and confirm the installed app still starts.
7. Deploy a second version and confirm the keyboard-accessible update prompt reloads the new worker.
8. On a physical headset, enter and exit VR; verify stereo comfort, head-relative locomotion, both controllers, every action mode, inventory selection, room exits, death/restart, and cutscene skipping.

## License

MIT — see [LICENSE](LICENSE).

The bundled pixel typeface **VT323** (by Peter Hull) is licensed under the SIL Open Font License 1.1 — see [fonts/VT323-OFL.txt](fonts/VT323-OFL.txt).

The vendored **Three.js 0.185.1** browser modules are licensed under the MIT License — see [js/vendor/THREE-LICENSE.txt](js/vendor/THREE-LICENSE.txt).
