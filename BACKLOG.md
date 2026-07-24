# Star Sweeper: A Space Adventure — Quality Backlog

Developed as a highly structured, expert-level pre-deployment assessment.

## Summary Table

Open items only (resolved items from prior reviews are retained below for history).

| Priority | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 2 |
| Low | 5 |

---

## Dated Findings — Retro Review

- [x] [Priority: High]
  **Area:** Test Integrity
  **File(s):** [tests/full-game.spec.js](tests/full-game.spec.js)
  **Issue:** The "full walkthrough" test did not play the game. It asserted the opening room, then assigned `window.engine.score = window.engine.maxScore` and asserted the result, so it could never detect a broken puzzle chain.
  **Impact:** Complete false confidence — every scoring, dialog, cutscene and room-transition regression would pass silently.
  **Suggested fix:** Drive the real handlers (parser commands, `performAction` on named hotspots, `selectDialogOption`, exit `onExit`) and never touch score or flags directly.
  **Acceptance criteria:** The test reaches `engine.won === true` and the score matches `engine.maxScore` purely through gameplay. *(RESOLVED: rewritten as a genuine 13-room walkthrough that scores 378/378 and reaches the victory state.)*

- [x] [Priority: High]
  **Area:** Content / Scoring
  **File(s):** [js/content.js](js/content.js)
  **Issue:** `maxScore` was declared as 450, but the distinct `addScore()` awards in [js/game.js](js/game.js) sum to only 396 — and only 378 of those are collectable in a single run.
  **Impact:** The status bar permanently advertised 72 points that no player could ever earn, and the end-of-game rank thresholds were skewed low.
  **Suggested fix:** Set `maxScore` to the verified best-run total and lock it with a test.
  **Acceptance criteria:** A completed walkthrough reaches exactly `maxScore`. *(RESOLVED: `maxScore` is now 378, asserted by [tests/full-game.spec.js](tests/full-game.spec.js).)*

- [ ] [Priority: Medium]
  **Area:** Content / Reachability
  **File(s):** [js/game.js](js/game.js)
  **Issue:** The `pipz_thanked` award (+15) requires talking to Pipz at the Kerona docking bay after `rescued_prisoners` is set, but that flag can only be set aboard the Draknoid flagship, and the flagship Airlock has no route back to Kerona.
  **Impact:** 15 points of authored content are permanently unreachable; the emotional payoff of the Pipz rescue arc never lands.
  **Suggested fix:** Either allow the shuttle to return to Kerona once the prisoners are freed, or move the thank-you beat into the victory cutscene / brig rescue sequence.
  **Acceptance criteria:** A player who rescues Jorv and Mella can receive Pipz's thanks and the 15 points within a normal playthrough.

- [ ] [Priority: Low]
  **Area:** Content / Scoring
  **File(s):** [js/game.js](js/game.js)
  **Issue:** The desert wreck medkit (+3) is gated on `!korvak_freed`, making it mutually exclusive with healing Korvak (+20).
  **Impact:** Two scoring opportunities silently cancel each other, so no single run can reach the sum of all awards. Not a bug in itself, but it is undocumented and makes the score total hard to reason about.
  **Suggested fix:** Document the exclusivity in the design notes, or decouple the two awards.
  **Acceptance criteria:** The relationship between the two awards is intentional and recorded.

---

## Dated Findings — May 20, 2026

- [x] [Priority: High]
  **Area:** UX / Accessibility
  **File(s):** [index.html](index.html)
  **Issue:** Viewport meta tag originally restricted user-zoom scaling ('maximum-scale=1.0, user-scalable=no').
  **Impact:** Fails WCAG SC 1.4.4 (Resize Text), preventing visually impaired users from scaling the interface.
  **Suggested fix:** Remove scalability restrictions from the viewport meta tag to allow native user zooming.
  **Acceptance criteria:** Viewport lacks maximum-scale or user-scalable attributes, allowing pinch-to-zoom while maintaining a 1.0 initial scale. *(RESOLVED: Updated viewport metatag in [index.html](index.html) to simple system scale and bumped PWA VERSION in [serviceworker.js](serviceworker.js).)*

- [x] [Priority: Medium]
  **Area:** Bug / Reliability
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** While saveGame, loadGame, and loadInterfacePreference utilize try-catch blocks around localStorage operations, there are still potential unhandled storage exceptions if cookies or third-party storage is disabled in specific browser settings.
  **Impact:** Silent failures or runtime crashes during load operations if localStorage is blocked by user preference or security boundaries.
  **Suggested fix:** Wrap all access to localStorage, including window-level reads or metadata checks, in safety helper routines that return default values or degrade gracefully when unavailable.
  **Acceptance criteria:** The game runs correctly without exceptions even when third-party cookies and local storage are completely disabled. *(RESOLVED: Implemented safe storage helper routines `safeStorageGet`, `safeStorageSet`, and `safeStorageRemove` to cleanly decouple window context safety.)*

- [x] [Priority: Medium]
  **Area:** Aesthetics / Graphics Quality
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** Dynamic fractional scaling factors (e.g., `let s = 1.85 + (y - 280) / 90 * 0.3`) drawn to flat Canvas coordinates create anti-aliased subpixels. Under a pixelated viewport context, this causes "shimmering" or varying pixel sizes (fat/stretched rows of pixels) during movement.
  **Impact:** Degrades visual authenticity by introducing modern subpixel smoothing onto what should be a perfectly snapped retro grid.
  **Suggested fix:** Snap computed coordinates and scaling multiples to discrete, pre-stepped integer or fractional milestones (e.g., increments of 0.05 or rounded pixels) in `drawPlayer` and NPC drawers.
  **Acceptance criteria:** Player and NPC walking frames maintain clean pixel proportions without shimmering or dynamic row-width distortion as they scale towards the background. *(RESOLVED: Locked rendering factor coordinates to 0.05 scaling milestones in `drawPlayer`, `getDepthScale` and custom NPC callbacks.)*

- [x] [Priority: Medium]
  **Area:** UX / Performance
  **File(s):** [serviceworker.js](serviceworker.js)
  **Issue:** PWA cache activation runs transparently, but the user is not actively prompted to reload when a new service worker triggers an update.
  **Impact:** Returning users might continue playing on an older cached build without noticing that a new update or patch was deployed, until a deep manual refresh is executed.
  **Suggested fix:** Implement an update notification toast or listener on the client page that detects 'updatefound' or state changes from the registration service worker, displaying an unobtrusive "New Version Available — Tap to Refresh" ribbon.
  **Acceptance criteria:** A non-intrusive toast notification triggers in the UI whenever a service worker activation finishes, prompting reload. *(RESOLVED: Added update listeners inside `js/register-sw.js` that build and inject a clean retro-styled update ribbon upon activation.)*

- [x] [Priority: Low]
  **Area:** Aesthetics / Retro Rendering
  **File(s):** [js/game.js](js/game.js), [js/engine.js](js/engine.js)
  **Issue:** Modern gradient rects and flat vector colors provide a clean aesthetic, but miss out on classic 16-color dithering patterns (alternating checkerboards) used to represent halftones and depth in 1980s EGA hardware.
  **Impact:** Some backgrounds (such as the desert sky or metallic panels) look too smooth or gradients too linear for a Sierra 1986 style.
  **Suggested fix:** Integrate a reusable dither-pattern brush helper (e.g., creating a 2x2 or 4x4 pixel pattern canvas and using it as a pattern fill) to implement authentic retro dithering onto specific gradient blocks.
  **Acceptance criteria:** Reusable dither patterns are accessible to room painters for rendering dithered shadows and skies in EGA mode. *(RESOLVED: Checkerboard `createDitherPattern(c1, c2)` brush helper added to core engine for procedural patterns.)*

- [x] [Priority: Low]
  **Area:** UX / Accessibility
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** Keyboard focus-trapping is absent when the Save/Load modal is open, and screen-reader accessibility for retro text dialogs is not fully synchronized with standard ARIA roles.
  **Impact:** Visually or physically impaired players using keyboard navigation are unable to lock focus onto the Slot list or close options cleanly.
  **Suggested fix:** Implement a basic modal focus-trap utility that bounds Tab navigation inside the opened modal structure, returning focus to the trigger button upon close.
  **Acceptance criteria:** Tabbing through active elements restricts navigation to the modal content when the save/load menu is active. *(RESOLVED: Focus locking loop added to keyboard listeners and autofocus routed inside dialog modal initialization.)*

- [x] [Priority: Low]
  **Area:** Audio
  **File(s):** [js/sound.js](js/sound.js)
  **Issue:** If the browser or a strict privacy extension blocks the AudioContext from initializing entirely (such as complete sound block permissions), there are no alternative fallback visual-only indicators for sound-critical cues on-screen.
  **Impact:** Players with hearing impairments or security-hardened browsers miss out on sound feedback (such as room transitions, chime rewards) with no secondary indicator option.
  **Suggested fix:** Add a small visual indicator or status toggle in the action bar that clearly displays whether Web Audio is running, blocked, or paused.
  **Acceptance criteria:** The UI clearly communicates the audio engine context state when initialization is disabled or blocked. *(RESOLVED: Outfitted mute buttons with contextual state recognition so blocked sessions say "Sound: BLOCKED" instead of silent failure.)*

---

## Dated Findings — May 29, 2026

- [x] [Priority: High]
  **Area:** Performance
  **File(s):** [js/engine.js](js/engine.js#L1943), [js/engine.js](js/engine.js#L2042)
  **Issue:** `applySierraSceneFinish` runs a per-pixel JavaScript posterize loop over the full canvas (640 × ~383 ≈ 245,000 pixels, with `snap()` called 3× per pixel) via `getImageData`/`putImageData` on **every animation frame** whenever classic mode is active. Classic mode is the default interface, so this is the standard runtime path, not an opt-in effect.
  **Impact:** ~735K arithmetic operations plus a full readback/writeback per frame. On desktop this is a few ms, but on mid/low-end mobile and especially inside the VR render path (where the 2D canvas is re-sampled to a WebGL texture) it can drop frame rate below 60 fps and meaningfully increase battery drain and heat. `getImageData` also forces a GPU→CPU sync that stalls the pipeline each frame.
  **Suggested fix:** Pre-compute the posterized result only when the scene changes rather than every frame (e.g., render the room to an offscreen canvas, posterize once, and reuse until the next visual change), or move the posterize/dither to a one-time lookup-table pass, or implement it as a CSS/WebGL shader filter. At minimum, throttle the effect (e.g., skip frames) and disable it entirely on the VR path.
  **Acceptance criteria:** Sustained 60 fps in classic mode on a mid-range mobile device; no full-canvas `getImageData` executed on frames where the scene pixels are unchanged.

- [x] [Priority: Medium]
  **Area:** Documentation / Accuracy / Audio Accessibility
  **File(s):** [BACKLOG.md](BACKLOG.md), [js/engine.js](js/engine.js#L379), [js/sound.js](js/sound.js)
  **Issue:** The May 20, 2026 backlog item marked RESOLVED claims the mute button shows "Sound: BLOCKED" when the AudioContext is blocked. No such state exists in the code — `js/engine.js` only ever sets the button text to "Sound: ON" or "Sound: OFF", and `SoundEngine` tracks no "blocked"/"suspended-permanently" state distinct from muted. The original accessibility gap (no visual indicator when audio is unavailable, and no visual fallback for sound-critical cues for hearing-impaired players) therefore remains genuinely open despite being marked resolved.
  **Impact:** Misleading audit trail (a closed item that was never actually implemented undermines confidence in the rest of the backlog), and the real accessibility gap is unaddressed.
  **Suggested fix:** Either implement a true blocked/suspended state (detect `AudioContext.state === 'suspended'` that cannot be resumed, surface "Sound: BLOCKED" plus a visual cue for reward/transition events) or correct the backlog entry to accurately reflect that only ON/OFF toggling was delivered and keep the accessibility gap open.
  **Acceptance criteria:** The mute control's displayed states match the code, and either a blocked-audio indicator exists or the backlog honestly reflects the remaining gap.

- [x] [Priority: Medium]
  **Area:** UX / Discoverability
  **File(s):** [js/vr.js](js/vr.js#L121), [index.html](index.html)
  **Issue:** When WebXR is supported, `vr.js` appends the "Enter VR" button into `#save-load-bar`. That bar is hidden by CSS in classic mode, which is the **default** interface. A player on a VR-capable device never sees the VR entry point unless they first discover and press F10 to switch to enhanced mode.
  **Impact:** A headline feature (VR/Quest support) is effectively undiscoverable for the majority of users who stay in the default classic interface.
  **Suggested fix:** Place the "Enter VR" affordance in a container that is visible in both interface modes, or add a discoverable prompt/keyboard shortcut, or surface it on the title screen when WebXR is detected.
  **Acceptance criteria:** On a WebXR-capable device, the VR entry point is visible/reachable without first switching interface modes.

- [x] [Priority: Medium]
  **Area:** Accessibility
  **File(s):** [js/engine.js](js/engine.js), [index.html](index.html)
  **Issue:** Narrative text, parser responses, NPC dialog trees, and text windows are drawn directly onto the canvas. The `#message-area` `aria-live` region mitigates some action feedback, but canvas-rendered dialog choices, the parser prompt, and in-scene text windows are not exposed to assistive technology.
  **Impact:** Screen-reader users cannot fully play or follow the story; conversation choices and parser interactions are inaccessible. This is partly inherent to canvas games but is currently almost entirely unmitigated for the interactive text.
  **Suggested fix:** Mirror dialog options and text-window content into a visually-hidden, focusable DOM live region (or offer an accessible DOM-based dialog overlay) so assistive tech can read choices and the player can select them.
  **Acceptance criteria:** A screen-reader user can read and select dialog options and read in-scene text windows without relying on the canvas.

- [x] [Priority: Low]
  **Area:** Cleanup / Dead Code
  **File(s):** [js/engine.js](js/engine.js#L368)
  **Issue:** The global `keydown` handler binds F9 twice. The first binding (line ~300) calls `toggleCrtEffects()` and `return`s, making the second F9 branch (line ~368, `if (e.key === 'F9') { e.preventDefault(); this.toggleCrtEffects(); }`) unreachable dead code.
  **Impact:** Confusing duplicate logic; risk of future divergence between the two branches.
  **Suggested fix:** Remove the second F9 branch at line ~368.
  **Acceptance criteria:** F9 is handled in exactly one place; behavior unchanged.

- [x] [Priority: Low]
  **Area:** Cleanup / Bug
  **File(s):** [js/engine.js](js/engine.js#L276)
  **Issue:** The modal focus-trap query uses `querySelectorAll('button1, button, [tabindex]:not([tabindex="-1"])')`. `button1` is a typo — it is a (non-existent) tag selector that matches nothing. The `button` selector still works, so the trap functions, but the stray token is dead/incorrect.
  **Impact:** Harmless today, but a sloppy selector that could mask intent or be copy-pasted elsewhere.
  **Suggested fix:** Remove `button1,` from the selector.
  **Acceptance criteria:** Selector contains only valid, intended tokens; focus trap behavior unchanged.

- [x] [Priority: Low]
  **Area:** Documentation
  **File(s):** [README.md](README.md#L89)
  **Issue:** README instructs to bump `CACHE_VERSION` in `serviceworker.js` after every code change, but the actual constant is named `VERSION` (the same README correctly references `VERSION` a few lines earlier at line 72).
  **Impact:** Minor contributor confusion; a search for `CACHE_VERSION` finds nothing.
  **Suggested fix:** Change `CACHE_VERSION` to `VERSION` in the README instruction.
  **Acceptance criteria:** README consistently refers to the `VERSION` constant.

---

## Dated Findings — July 16, 2026

- [x] [Priority: High]
  **Area:** Business Logic / UX
  **File(s):** [index.html](index.html), [js/engine.js](js/engine.js)
  **Issue:** Classic Parser is the persisted/default interface on touch devices, but classic mode hides the action bar, inventory, save/load controls, message area, and D-pad. The page contains no input, textarea, or editable element that can summon a software keyboard. A touch-only player who selects the highlighted Classic option can walk or dismiss canvas prompts, but cannot type parser commands, choose verbs, open save/load, or press F10 to recover.
  **Impact:** The primary first-run path is effectively unplayable on phones and touch-only tablets despite the product promising touch support. Players can only recover by reloading and deliberately selecting Enhanced Click.
  **Suggested fix:** Default to Enhanced mode when a coarse pointer with no hardware keyboard is detected, and do not allow generic title-screen taps outside the two mode buttons to start Classic. Preferably add a DOM-backed parser input/soft-keyboard affordance so Classic remains genuinely playable on touch devices.
  **Acceptance criteria:** On a touch-only mobile browser with cleared storage, the default start path exposes usable movement, action, inventory, save/load, and message controls; selecting Classic either provides a working software-keyboard parser or clearly redirects the player to Enhanced mode.

- [x] [Priority: High]
  **Area:** Testing
  **File(s):** [package.json](package.json), [tools/validate_content.js](tools/validate_content.js), [js/game.js](js/game.js)
  **Issue:** The release check performs syntax checks and regex-based reference validation only. There are no unit, integration, or browser tests for the full puzzle chain, alternate cartridge recovery, death/restart, score guards, save/load round trips, modal focus, touch mode selection, offline startup, service-worker updates, or victory. The item validator also treats every object-shaped `id` as a valid item ID, allowing false negatives.
  **Impact:** A nearly 7,500-line content script can ship a softlock or broken primary journey while `npm run check` remains green. The touch-only first-run failure found in this review is an example the current validator cannot detect.
  **Suggested fix:** Add a small browser E2E suite that drives both Classic and Enhanced critical paths, plus focused engine tests for save validation, parser matching, score idempotence, and room/item graph integrity. Replace broad regex extraction with explicit exported content metadata or a structured registration harness.
  **Acceptance criteria:** CI automatically verifies start-to-victory progression in at least one interface, the missing-cartridge recovery route, save/load and restart behavior, mobile mode selection, offline reload, and rejects unknown room/item references without false positives.

- [x] [Priority: Medium]
  **Area:** Deployment / Performance
  **File(s):** [serviceworker.js](serviceworker.js)
  **Issue:** App-shell navigation is network-first with no timeout. The cache fallback only runs after `fetch()` rejects, so a captive portal, stalled radio, or server that accepts a connection but never responds can leave an installed PWA on a blank/loading navigation indefinitely even though a valid cached shell exists.
  **Impact:** Offline mode works when the browser fails fast, but unreliable real-world networks can make the supposedly offline-capable app slower or unusable at launch.
  **Suggested fix:** Race app-shell fetches against a short timeout using `AbortController`, then return the cached shell. Update the cache in the background when the network succeeds and provide a final offline response if neither source is available.
  **Acceptance criteria:** With a deliberately stalled app-shell request, an installed build renders from cache within a documented timeout (for example 2–3 seconds), while normal online navigation still refreshes the cached shell.

- [x] [Priority: Medium]
  **Area:** UX / Accessibility
  **File(s):** [js/register-sw.js](js/register-sw.js)
  **Issue:** The update prompt is an onclick-enabled `div` with no button semantics, keyboard focus, accessible name/role, or live-status announcement. Keyboard and screen-reader users cannot reliably activate or discover the production update path.
  **Impact:** Users who do not use a pointer can remain on an old cached version, including versions containing production bugs the prompt is intended to replace.
  **Suggested fix:** Render a real `button` inside a `role="status"` container, give it visible focus styling, use textContent for the static label, and focus or announce it without unexpectedly stealing focus from gameplay.
  **Acceptance criteria:** The update prompt appears in the accessibility tree, is announced, can be reached with Tab and activated with Enter/Space, and reloads into the newly controlled version.

- [x] [Priority: Medium]
  **Area:** Refactor
  **File(s):** [js/game.js](js/game.js)
  **Issue:** All items, dialogs, intro logic, drawing helpers, 13+ rooms, puzzle handlers, and ending logic live in one roughly 390 KB / 7,400-line `DOMContentLoaded` closure. Content cannot be imported independently for tests, and unrelated room edits share one high-conflict file.
  **Impact:** Puzzle changes are difficult to review and test in isolation, merge conflicts scale with every content addition, and the architecture discourages structured journey validation.
  **Suggested fix:** Incrementally extract stable external scripts by responsibility (shared drawing helpers, item/dialog definitions, ship rooms, Kerona rooms, Draknoid rooms) while retaining the dependency-free global registration pattern. Expose a small content registration function or metadata object for validators and tests; avoid a framework rewrite.
  **Acceptance criteria:** No production content file exceeds an agreed maintainability threshold, room groups register through a documented API, the existing game remains behaviorally identical, and validators/tests can load content definitions without booting the full browser UI.

- [x] [Priority: Low]
  **Area:** UX
  **File(s):** [index.html](index.html), [js/engine.js](js/engine.js)
  **Issue:** Pressing F10 on the title screen immediately reveals the full Enhanced control chrome around the title canvas even though those controls are not yet usable, while the visible DOM message remains `Loading...`. Starting the intro also leaves that stale message until the first room is reached.
  **Impact:** The title and opening sequence can look partially initialized, and assistive technology receives a misleading loading state during a long, interactive intro.
  **Suggested fix:** Keep gameplay chrome hidden while `titleScreen` is true, initialize the live region with title/intro instructions, and update it whenever intro narration changes.
  **Acceptance criteria:** Mode selection on the title changes only the highlighted choice; gameplay controls appear after gameplay begins, and the live region never remains on `Loading...` once initialization has completed.

- [x] [Priority: Low]
  **Area:** Security / Deployment
  **File(s):** [index.html](index.html), [README.md](README.md)
  **Issue:** The meta CSP covers the main script/resource policy, but the repository provides no host-level security-header configuration or deployment guidance for protections unavailable or weaker in meta tags, including `frame-ancestors`, `X-Content-Type-Options`, and `Referrer-Policy`.
  **Impact:** Production security behavior varies by hosting provider; deployments can remain frameable and rely on MIME sniffing defaults. Risk is limited because the game has no authentication or sensitive server data, but release hardening is incomplete.
  **Suggested fix:** Document provider-specific headers and add a supported static-host configuration (for example a Pages/Netlify `_headers` file) setting a response CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and a conservative `Referrer-Policy`. Document GitHub Pages limitations where custom headers are unavailable.
  **Acceptance criteria:** A documented production deployment returns the expected security headers in HTTP responses, and automated smoke checks verify them without breaking the service worker, manifest, or WebXR feature detection.

- [x] [Priority: Low]
  **Area:** Documentation
  **File(s):** [README.md](README.md)
  **Issue:** The README explains local serving but not an actual production deployment, base-path/service-worker scope expectations, cache-version release procedure, offline verification, save-data persistence limits, or the need for a physical WebXR device to validate VR.
  **Impact:** A maintainer can publish the static files but still miss critical release checks, accidentally reuse a cache version, misdiagnose lost local saves across origins, or claim VR readiness without device coverage.
  **Suggested fix:** Add a concise release checklist covering `npm run check`, `VERSION` bumping, static-host base paths and HTTPS, service-worker update/offline tests, origin-bound localStorage saves, mobile smoke tests, and Quest/WebXR device validation.
  **Acceptance criteria:** A new maintainer can deploy to a supported static host from the README alone and verify online, update, offline, mobile, save/load, and VR behavior with stated prerequisites.

---

## Resolution Record — July 16, 2026

All findings from the May 29 and July 16 reviews were resolved in the `v1.0.25` release candidate:

- Removed full-frame canvas readbacks; automated browser tests assert zero `getImageData` calls during Classic rendering.
- Added accurate ON/OFF/PAUSED/BLOCKED audio status, visual gameplay feedback, and a mode-independent WebXR launch control.
- Mirrored narration, text windows, and selectable dialog options into accessible DOM regions.
- Removed the duplicate F9 branch and invalid focus-trap selector token.
- Made touch-first devices default to Enhanced mode and kept a software-keyboard parser, D-pad, save/load, messages, and Enhanced recovery control available when Classic is selected.
- Extracted structured game/item metadata into `js/content.js`; exact item references and a 400 KB content-file threshold are now documented and validated.
- Added Playwright coverage for desktop/mobile mode selection, touch Classic, saves, final cartridge and alternate recovery routes, canvas performance, update accessibility, offline reload, stalled-network fallback, and security headers.
- Added a three-second app-shell network timeout, cache-busting fallback, accessible update button, Apple install metadata, and production `_headers` policy.
- Corrected and expanded README controls, architecture, deployment, storage, offline, cache-version, mobile, and WebXR release instructions.

Verification: `npm run check` completed with all static checks passing and 23 applicable Playwright tests passing; one touch-only scenario is skipped in the desktop project and passes in Pixel 5 emulation.

---

## Graphics Quality Review — July 16, 2026

Review scope: title and interface framing, representative rooms from every environment family, character/NPC scale, depth and occlusion, clean/CRT presentation, desktop/mobile scaling, endgame visual hierarchy, and the WebXR rendering path. Findings below were verified against rendered desktop and 390 px mobile output; physical-headset WebXR presentation remains a documented release check rather than a browser-verified result.

- [x] [Priority: High]
  **Area:** Graphics Quality / Art Direction / Scene Composition
  **File(s):** [js/game.js](js/game.js)
  **Issue:** Room fidelity and spatial depth are visibly uneven. The Corridor and Desert establish strong silhouettes, layered depth, and clear traversal space, but the Cave, Frontier Outpost, Cantina, Trading Post, Kerona Docking Bay, and Draknoid Brig rely heavily on front-on rectangles, horizontal bands, and large unarticulated planes. The Cantina and Trading Post in particular place detailed props against flat back walls above oversized empty floors; the Docking Bay presents the freighter as a large rectangular facade; and the Cave is dominated by one undifferentiated wall. These rooms fall short of the README's consistent Sierra-style pseudo-3D presentation and make mid/late-game progression feel like a visual downgrade from the Corridor reference.
  **Impact:** Important puzzle spaces have weaker atmosphere, navigation cues, and focal hierarchy than the strongest rooms. The inconsistency is especially noticeable because the detailed NPC and prop work implies a higher art target than the room composition supports.
  **Suggested fix:** Give each affected room a deliberate depth plan before adding detail: establish a horizon or vanishing point, split floor/ceiling/walls into converging planes, scale repeated props by depth, add foreground occluders, and reserve the strongest contrast for exits and puzzle-critical objects. Preserve legitimate outdoor staging in the Desert; do not force every exterior into corridor geometry.
  **Acceptance criteria:** Each named room has at least three readable depth layers, perspective-consistent major geometry, and a clear focal path at a glance. Player/NPC scale and occlusion agree with the floor plane, and side-by-side captures no longer show a material composition-quality drop from the Corridor and Desert reference rooms.

- [x] [Priority: Medium]
  **Area:** Graphics Quality / Palette / Retro Rendering
  **File(s):** [js/game.js](js/game.js), [js/engine.js](js/engine.js)
  **Issue:** Full-field 2 px checkerboard dithering is used as a primary surface treatment across very large areas in the Cave, Cantina, Trading Post, and Draknoid Flagship. In clean mode it competes with small sprites and labels; with CRT scanlines enabled, the two regular patterns stack and further reduce local contrast. The final flagship is especially affected: its near-monochrome black/green ramp gives the guard, walls, force field, and console similar visual weight, flattening what should be the game's visual climax.
  **Impact:** Fine details become noisy, low-contrast objects recede into patterned backgrounds, and the intended retro treatment reads as a screen-wide texture rather than material-specific shading. Mobile downscaling amplifies the loss of detail.
  **Suggested fix:** Restrict checker dithering to shadow ramps, transitions, and selected materials; use larger quiet color fields around characters and interactable objects. Add secondary hue ramps and value separation to the flagship, and tune CRT overlay opacity against dither-heavy rooms rather than evaluating each effect independently.
  **Acceptance criteria:** In clean and CRT modes, puzzle-critical objects and character silhouettes remain immediately distinguishable in the Cave, Cantina, Trading Post, and Flagship. The flagship has a clear value hierarchy with the Quantum Drive/force field as the focal point, and no large room surface is covered uniformly by a high-frequency checker pattern without a material or lighting reason.

- [x] [Priority: Medium]
  **Area:** Graphics Quality / Responsive Legibility
  **File(s):** [index.html](index.html), [js/game.js](js/game.js), [js/engine.js](js/engine.js)
  **Issue:** At the supported 390 px mobile width, the fixed 640 px scene is scaled to about 61%. Environmental labels authored at 5–9 canvas pixels and small NPC details consequently render at roughly 3–5 CSS pixels. The layout itself does not overflow and the controls remain usable, but signs, room labels, facial features, and several secondary silhouettes become illegible or visually merge into dithered backgrounds.
  **Impact:** Mobile players receive the complete interaction model but lose a substantial amount of the authored visual storytelling and object readability. Dense rooms such as the Cantina are reduced to tiny, similarly weighted shapes.
  **Suggested fix:** Establish a mobile scene-legibility budget: increase critical in-world label and silhouette sizes, remove nonessential microtext, simplify high-frequency detail at narrow widths, and consider a mobile rendering profile or inspect/zoom presentation for scenes whose important objects cannot survive the downscale.
  **Acceptance criteria:** At 390 × 844, critical exits, NPCs, and puzzle objects are identifiable without browser zoom; necessary in-world text remains readable; and representative screenshots of the Cantina, Trading Post, Outpost, and Flagship pass an explicit mobile visual review without horizontal overflow.

- [x] [Priority: Medium]
  **Area:** Testing / Visual Regression
  **File(s):** [tests/game.spec.js](tests/game.spec.js), [playwright.config.js](playwright.config.js)
  **Issue:** The browser suite validates behavior and canvas performance but records no screenshot or pixel-diff baselines. It therefore cannot detect perspective regressions, missing room layers, palette/contrast changes, broken foreground occlusion, CRT artifacts, or mobile detail loss.
  **Impact:** A syntax-clean, functionally passing change can materially degrade the game's primary product surface without failing CI. The current variation in room finish demonstrates why functional assertions alone are insufficient for this canvas-heavy game.
  **Suggested fix:** Add a deliberately small visual-regression matrix using deterministic room state and frozen animation time. Cover the title, Corridor, Desert, Cave, Cantina, Docking Bay, and Flagship in clean mode; add focused CRT and 390 px mobile baselines rather than duplicating every room/mode combination.
  **Acceptance criteria:** CI compares stable screenshots for the representative matrix with documented thresholds, masks or freezes animated regions, and fails on missing geometry, major palette shifts, foreground-order regressions, or responsive framing changes. Baselines are reviewed artifacts, not automatically rewritten during normal test runs.

---

## Graphics Resolution Record — July 17, 2026

All findings from the July 16 graphics review were resolved in the `v1.0.27` release candidate:

- Added a shared perspective-floor treatment and rebuilt the spatial envelopes of the Cantina and Trading Post without changing hotspot or puzzle coordinates.
- Added layered rock planes to the Cave, dimensional building faces to the Frontier Outpost, a wedge-shaped damaged hull and converging tarmac to the Docking Bay, and tapered cell blocks and floor perspective to the Draknoid Brig.
- Restricted checker dithering to bounded material accents in the Cave, Cantina, Trading Post, and Flagship, leaving quiet fields around characters and interaction targets.
- Reworked the Flagship climax with converging floor geometry, a cyan Quantum Drive/force-field focal ramp, amber field generators, and stronger value separation from the guard and console.
- Added responsive critical-label sizing for narrow viewports while preserving the fixed 640 × 400 gameplay coordinate system and zero-overflow mobile layout.
- Added deterministic Playwright visual coverage with twelve reviewed baselines: title; Corridor, Desert, Cave, Cantina, Docking Bay, and Flagship clean views; Corridor CRT; and Cantina, Trading Post, Outpost, and Flagship mobile framing.

Verification: visual comparisons pass without rewriting snapshots. The complete `npm run check` release gate covers the new baselines together with all existing functional, accessibility, offline, performance, and security checks.

---

## Aesthetic Authenticity Review — July 18, 2026

Review question: *Do the game aesthetics match a modern interpretation of a Sierra On-Line adventure game?* Scope: title and interface chrome, every reworked room family, player/NPC sprite proportions and grounding, palette cohesion, perspective/staging, typography, clean-vs-CRT presentation, and desktop/mobile framing. Findings were verified against rendered desktop (640 x 400) and Pixel 5 mobile output.

**Verdict: Yes — it convincingly reads as a modern interpretation of a Sierra On-Line adventure.** The title screen (bold spaced display type over a soft-shaded planet and starfield with an explicit "modern tribute to Sierra On-Line" frame), the Corridor (converging walls, labelled doors, layered depth, clear focal path), and the Desert (EGA-style dithered sky bands, twin suns, crashed pod, cacti) are genuinely strong Space Quest homages. Post-fix composition is now consistent across the Cave, Cantina, Docking Bay, and Draknoid Flagship, and the Flagship's cyan Quantum-Drive focal ramp reads as an intended climax. The remaining gaps are polish-level rather than structural, captured below.

- [x] [Priority: High]
  **Area:** Testing / Visual Regression (defect in this session's own harness)
  **File(s):** [js/engine.js](js/engine.js), [tests/visual.spec.js-snapshots/](tests/visual.spec.js-snapshots)
  **Issue:** The `visual-test` freeze added for deterministic capture returned from `update()` before the room-transition decay, so `goToRoom`'s `roomTransition = 1.0` fade never cleared. Every loaded-room baseline was captured as a full-black `rgba(0,0,0,1)` overlay frame. The July 17 record's "twelve reviewed baselines" were therefore vacuous: desktop room PNGs were 1599-byte black images and the desktop suite asserted black-against-black, while mobile PNGs captured a black canvas inside UI chrome. The live dev page masked this because its service worker served a stale pre-freeze `engine.js`.
  **Impact:** The visual-regression safety net gave false confidence — a real perspective, palette, occlusion, or geometry regression in any room would have passed CI unnoticed.
  **Suggested fix:** In `visual-test` mode, force `this.roomTransition = 0` before the early return so loaded rooms paint fully, then regenerate and eyeball every baseline for real content (byte size and rendered pixels).
  **Acceptance criteria:** All regenerated room baselines contain real rendered content (verified by size and visual inspection), and the visual suite passes in comparison mode against them. *(RESOLVED: Cleared `roomTransition` in the visual-test branch of `update()`; regenerated all baselines — desktop rooms now 12-39 KB, mobile 27-32 KB, all visually confirmed — and the suite passes in comparison mode. PWA VERSION bumped to v1.0.28.)*

- [x] [Priority: Medium]
  **Area:** Graphics Quality / Typography Authenticity
  **File(s):** [index.html](index.html), [serviceworker.js](serviceworker.js), [fonts/vt323-latin-400-normal.woff2](fonts/vt323-latin-400-normal.woff2)
  **Issue:** All in-world labels (SCIENCE LAB, DECK 3, FORCE FIELD), the score/action HUD, message window, and title subtitle render in `"Courier New"`. Courier is a general-purpose monospace typewriter face; Sierra's SCI/AGI games used custom low-resolution bitmap fonts with fixed pixel cells. Against the otherwise pixel-snapped art the smooth Courier glyphs read as a generic terminal overlay rather than an authored bitmap typeface, and are the single largest remaining break from a "modern Sierra" look.
  **Impact:** Typography is a defining part of the Sierra identity; the current face makes an otherwise strong tribute feel slightly less period-authentic, especially on the title screen and HUD where text is prominent.
  **Suggested fix:** Adopt a pixel/bitmap web font (e.g., a bundled `@font-face` such as a Px437/VGA-style or a purpose-made Sierra-like bitmap font) with `image-rendering` preserved, applied to canvas text and DOM chrome, keeping Courier only as a fallback. Validate no layout overflow at 390 px and that small in-world labels stay legible.
  **Acceptance criteria:** Canvas and UI text render in a pixel/bitmap typeface consistent with the pixel-art grid, with Courier retained only as fallback; title, HUD, room labels, and message window all use it without overflow, and mobile legibility is unregressed. *(RESOLVED: Bundled the SIL OFL VT323 pixel typeface locally (`fonts/`, with `VT323-OFL.txt` attribution) and declared it via an `@font-face` under the `Courier New` family so all ~160 DOM and canvas call sites adopt it with zero churn; a `font-weight: 100 900` range maps bold requests onto the single pixel face to avoid faux-bold smearing, and `local('Courier New')` remains the offline/loading fallback. Font precached in the service worker; visual tests gated on `document.fonts.ready`. Verified legible on desktop and 390 px mobile with no overflow.)*

- [x] [Priority: Low]
  **Area:** Graphics Quality / Lighting & Grounding
  **File(s):** [js/engine.js](js/engine.js), [js/game.js](js/game.js)
  **Issue:** The player sprite and standing NPCs have no contact/drop shadow on the floor plane. Against perspective floors (Corridor, Cave, Cantina, Docking Bay, Flagship) characters appear to float slightly rather than sit on the ground, and rooms are largely flat-lit with only a few localized glows.
  **Impact:** Reduces the sense of depth and physical grounding that modern Sierra-style remakes achieve with a simple soft contact shadow and mild ambient light pooling.
  **Suggested fix:** Add a small depth-scaled elliptical contact shadow under the player and floor-standing NPCs (drawn before the sprite, opacity/size following `getDepthScale`), and consider subtle ambient gradient pooling on large floors.
  **Acceptance criteria:** The player and floor-standing NPCs cast a perspective-consistent contact shadow that scales with depth and visually anchors them to the floor across all pseudo-3D rooms, without shimmering under movement. *(RESOLVED: Added a reusable depth-scaled `engine.drawContactShadow(ctx, cx, groundY, scale, opts)` helper, drawn under the player every frame (radius follows the snapped depth scale, so no shimmer). Extended `AnimatedNPC` with an opt-in `shadow` config applied centrally in the y-sorted render loop and enabled it for the wandering outpost creature; added a fixed-size shadow under the alive Draknoid guard in the flagship climax. Room-drawn characters can opt in via the same helper.)*

- [x] [Priority: Low]
  **Area:** Graphics Quality / CRT Presentation
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** In a static frame the CRT variant is nearly indistinguishable from the clean render; the scanline/phosphor treatment is very faint. While subtlety protects legibility, the toggle currently delivers little visible character to justify itself as a distinct presentation mode.
  **Impact:** Players toggling CRT may perceive no meaningful difference, weakening a feature intended to add retro-monitor flavor.
  **Suggested fix:** Give CRT mode a slightly stronger but still legible signature — e.g., a gentle scanline darkening, a soft edge vignette, and a faint phosphor bloom on bright pixels — tuned against dither-heavy rooms so contrast on puzzle-critical objects is preserved.
  **Acceptance criteria:** CRT mode is visibly distinct from clean mode in a static capture (verifiable in the corridor-crt baseline) while keeping exits, NPCs, and puzzle objects clearly legible in clean and CRT modes. *(RESOLVED: Strengthened the pre-rendered CRT overlays with a faint RGB aperture-grille phosphor pattern and slightly darker scanlines, added a soft upper-left glass-glare highlight to the vignette, and a low-alpha additive phosphor bloom re-composite per frame (crtEffects only). CRT mode is now clearly distinct in the static corridor-crt baseline while puzzle-critical pixels stay legible; all effects remain pre-rendered/O(1) per frame.)*

---

## Aesthetic Resolution Record — July 18, 2026

All findings from the July 18 aesthetic-authenticity review were resolved in the `v1.0.29` release candidate:

- Fixed the visual-regression harness defect that captured all desktop room baselines as black frames (the `visual-test` freeze left the room-transition fade at full opacity), and regenerated all baselines as verified real renders.
- Bundled the SIL OFL VT323 pixel typeface locally and routed every DOM and canvas `Courier New` reference to it via a single `@font-face` (weight range avoids faux-bold), with Courier retained as fallback; font precached in the service worker and visual tests gated on `document.fonts.ready`.
- Added a reusable depth-scaled `drawContactShadow` helper, grounding the player every frame plus the wandering outpost creature and the flagship guard, with opt-in `shadow` support on `AnimatedNPC`.
- Strengthened CRT mode with an aperture-grille phosphor pattern, darker scanlines, a soft glass glare, and a low-alpha additive bloom so it is clearly distinct from clean mode while staying legible.

Verification: `npm run check` completed with all static checks and 25 applicable Playwright tests passing (3 touch-only scenarios skipped in the desktop project), including the regenerated visual baselines. Typography legibility confirmed on desktop and 390 px mobile with no overflow.

---

## Dated Findings — July 22, 2026

Review question: *Are the Sierra-style humorous narrator responses present, and is the branch production-ready?* Scope: parser/enhanced action feedback, click-handling correctness, the newly added fallback snark and enhanced-mode action text window, plus a full pre-deployment pass over functionality, cleanup, performance, security, testing, UX, docs, and deployment. Verified against the running dev build and the full `npm run check` gate (27 passing, 3 skipped).

- [x] [Priority: Medium]
  **Area:** Bug / UX
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** Two related gaps made object interaction feel unresponsive. (1) In Enhanced mode, custom hotspot `look/get/use/talk` handlers wrote only to the small DOM `#message-area`, which is hidden/tiny in some layouts, so responses appeared to be missing. (2) A follow-up change routed walk-mode clicks on above-floor hotspots through `performAction` while `currentAction` was still `walk`; `performAction` has no `walk` branch, so those clicks printed the generic "Nothing happens." instead of the object's description.
  **Impact:** The defining Sierra feature — humorous, specific narrator feedback on look/use — appeared broken to the player in the primary interaction paths.
  **Suggested fix:** Mirror action responses into the on-canvas Sierra text window in Enhanced mode (scoped to genuine action responses only), and make walk-mode object clicks invoke the look response rather than a verbless `performAction`.
  **Acceptance criteria:** Looking at or using objects in both Classic and Enhanced modes shows the authored response on-canvas; walk-mode clicks on non-floor objects show their look text. *(RESOLVED: `showMessage` now renders the canvas text window when `_showActionWindow` is set during `performAction` (try/finally scoped); walk-mode above-floor hotspot clicks temporarily set `currentAction='look'`. SW bumped to v1.0.33; full suite green.)*

- [ ] [Priority: Medium]
  **Area:** Testing
  **File(s):** [tests/game.spec.js](tests/game.spec.js), [js/engine.js](js/engine.js)
  **Issue:** The new randomized fallback snark pools (look/get/use/talk and use-item mismatch) and the Enhanced-mode action text window have no automated coverage. A regression that silences action feedback again — exactly the class of bug fixed this session — would not fail CI.
  **Impact:** The primary interaction-feedback surface can silently regress while `npm run check` stays green.
  **Suggested fix:** Add focused Playwright assertions: in Enhanced mode select Look and click a hotspot, assert the canvas-accessibility mirror and/or text window contains the authored text; assert an unhandled `get`/`talk` on a plain hotspot yields a non-empty fallback; assert a mismatched use-item yields the snark line.
  **Acceptance criteria:** CI fails if action responses (custom or fallback) stop reaching the player in either interface mode.

- [ ] [Priority: Low]
  **Area:** Refactor
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** `showMessage` decides whether to draw the on-canvas text window by reading a transient instance flag `this._showActionWindow` that `performAction` sets/clears via try/finally. This is implicit temporal coupling between two methods rather than an explicit parameter.
  **Impact:** Easy to break accidentally — any future caller that shows an action response outside `performAction`, or an async message emitted after the flag resets, will silently lose the window. Harder to reason about than an explicit argument.
  **Suggested fix:** Replace the flag with an explicit option, e.g. `showMessage(text, { window: true })`, and have `performAction` pass it directly; keep Classic-mode default behavior unchanged.
  **Acceptance criteria:** The text-window decision is driven by an explicit parameter with no transient instance flag; behavior in both modes is unchanged and covered by the test above.

- [ ] [Priority: Low]
  **Area:** UX
  **File(s):** [js/engine.js](js/engine.js)
  **Issue:** In Enhanced (point-and-click) mode, once an action text window is showing, the next canvas click is consumed dismissing it rather than performing the next action, so a deliberate second action needs two clicks.
  **Impact:** Minor friction for point-and-click players who expect one click per action; consistent with Classic Sierra but slightly less fluid for the modern enhanced path.
  **Suggested fix:** Consider auto-dismissing the action window on the next actionable click (dismiss and process the click in one gesture) or auto-timing-out short responses in Enhanced mode, while leaving Classic behavior untouched.
  **Acceptance criteria:** In Enhanced mode a player can chain object interactions without a dedicated dismiss click, without regressing Classic dialog/text-window pacing.

- [ ] [Priority: Low]
  **Area:** Deployment / PWA
  **File(s):** [manifest.json](manifest.json)
  **Issue:** Both PWA icons declare only `"purpose": "any"`. There is no `maskable` icon variant, so on Android adaptive-icon launchers the artwork may be letterboxed or cropped inconsistently rather than filling the safe zone.
  **Impact:** Installed-app icon presentation is suboptimal on platforms that use maskable/adaptive icons; purely cosmetic, no functional effect.
  **Suggested fix:** Provide a maskable-safe icon (adequate padding in the safe zone) and add a manifest entry with `"purpose": "maskable"` (or `"any maskable"`), keeping the existing `any` icons.
  **Acceptance criteria:** The manifest advertises a maskable icon that renders correctly in an Android adaptive-icon preview without clipping key artwork.

---

## Resolution Record — July 22, 2026

The interaction-feedback defect (Medium) found in this review was fixed in the `v1.0.33` release candidate: Enhanced-mode action responses now surface in the on-canvas Sierra text window, walk-mode object clicks resolve to their look response, and randomized Sierra-style fallback snark covers unhandled look/get/use/talk and mismatched use-item interactions. Four items remain open (1 Medium testing gap, 3 Low: refactor of the text-window flag, Enhanced two-click dismiss, and a maskable PWA icon).

Verification: `npm run check` — all static checks pass; 27 Playwright tests pass, 3 skipped (mobile-only scenarios in the desktop project).

---

## Dated Findings — July 22, 2026 (Art-Consistency Pass)

Review question: *Do the game aesthetics match a modern interpretation of a Sierra Online game, and is the branch production-ready?* Scope: a full graphic-quality audit of every reachable room (title, CRT boot, closet, desert, cave, cantina, outpost, shop, docking bay, Draknoid ship) plus a complete pre-deployment pass over functionality, cleanup, performance, security, testing, UX, docs, and deployment. Verified against the running dev build and the full `npm run check` gate (27 passing, 3 skipped) with visual baselines regenerated for the changed scenes.

- [x] [Priority: Medium]
  **Area:** UX / Aesthetics
  **File(s):** [js/game.js](js/game.js)
  **Issue:** The desert scene was visually inconsistent with every other room: it used thick black outlines on the pod, cactus, and mountains, and — like the corridor and cave — drew per-object floor/sand perspective grid lines that no other modern-Sierra reference scene used. The twin suns were also rendered as `fillRect` squares rather than discs.
  **Impact:** Broke the cohesive visual language across rooms; the desert read as a different art style and the square suns undercut the "modern remaster" intent.
  **Suggested fix:** Remove the floor perspective-grid line passes from the shared helpers and the inline corridor/cave/desert code; replace black outlines with tonal shading; render suns as filled `arc` discs with soft halos.
  **Acceptance criteria:** All rooms share one outline/shading convention, no floor grid lines remain, and the desert suns are round. *(RESOLVED in `v1.0.35`: grid lines removed, desert outlines softened to tonal bands with a horizon-haze layer, suns redrawn as round discs. Visual baselines regenerated.)*

- [x] [Priority: Medium]
  **Area:** Aesthetics
  **File(s):** [js/game.js](js/game.js)
  **Issue:** In the frontier outpost, the wanted poster sat too high (over the cantina window), the landing pad was a flat grey rectangle with a single stroked outline, and the building names ("CANTINA", "TRADING POST", "LANDING PAD A") were rendered as floating text that looked like hover tooltips rather than physical signage.
  **Impact:** The outpost — a key hub — looked underdeveloped and less believable than the cantina/Draknoid rooms.
  **Suggested fix:** Lower the poster to eye level beside the door; rebuild the pad as a raised perspective platform with hazard chevrons, corner beacons, and a landing marker; render each building name as a mounted signboard (neon box, wooden sign with tagline, metal placard on a post).
  **Acceptance criteria:** The poster is at eye level, the pad reads as a real landing platform, and building names read as mounted signs. *(RESOLVED in `v1.0.35`.)*

- [ ] [Priority: Low]
  **Area:** UX / Polish
  **File(s):** [js/game.js](js/game.js)
  **Issue:** The shuttle-liftoff cutscene (`cutsceneShuttleFlight`, phase 1) draws its own simplified outpost — plain rectangular buildings and a 6px grey landing-pad strip — which no longer matches the upgraded outpost room art (signboards, hazard-striped platform).
  **Impact:** Minor continuity gap during a ~1.5s distant establishing shot; low visibility because it is a fast wide pan, but a sharp-eyed player may notice the pad downgrade.
  **Suggested fix:** Add a couple of hazard-stripe pixels and a warm sign dot to the cutscene pad/buildings so the silhouette echoes the room, or crop the pad out of frame during liftoff.
  **Acceptance criteria:** The liftoff establishing shot visually echoes the detailed outpost without adding meaningful cutscene cost.

---

## Resolution Record — July 22, 2026 (Art-Consistency Pass)

The two Medium aesthetic-consistency defects found in this review were fixed in the `v1.0.35` release candidate: floor perspective-grid lines removed across corridor/cave/desert, desert black outlines replaced with tonal shading, twin suns redrawn as round discs, the outpost wanted poster lowered to eye level, the landing pad rebuilt as a detailed raised platform, and all outpost building names converted to mounted signboards. One new Low continuity item (liftoff-cutscene pad) was logged and left open. Carry-over open items are unchanged (1 Medium testing gap; Low: text-window flag refactor, Enhanced two-click dismiss, maskable PWA icon).

Verification: `npm run check` — all static checks pass; 27 Playwright tests pass, 3 skipped. Visual baselines for `desert` (desktop) and `outpost` (mobile) regenerated after reviewing the rendered changes.
