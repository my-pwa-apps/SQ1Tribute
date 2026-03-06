# Star Sweeper: A Space Adventure — AI Coding Instructions

## Architecture Overview

A Sierra-style point-and-click adventure game (Space Quest 1 tribute) built with **pure JavaScript and HTML5 Canvas** (640×400, `image-rendering: pixelated`). No frameworks, no build system, no dependencies.

- [index.html](../index.html) — UI shell: canvas, action buttons (Walk/Look/Get/Use/Talk), inventory bar, save/load modal, message area
- [js/engine.js](../js/engine.js) — `GameEngine` class: rendering loop, input handling, player sprite, click-to-walk + arrow key movement, cutscene system, save/load (localStorage, 5 slots), room transitions
- [js/game.js](../js/game.js) — All game content: 10 rooms with procedural pixel art, 8 items, puzzles, hotspots, cutscene animations, drawing helpers. Wrapped in a single `DOMContentLoaded` listener using `engine` as a closure variable.

## Key Patterns

### Room Registration
Rooms are registered via `engine.registerRoom({ id, name, description, draw, hotspots, onEnter?, onUpdate? })`. The `draw` function receives `(ctx, w, h, eng)` and renders everything procedurally — no sprite sheets or image assets exist.

### Hotspot Structure
```js
{ name, x, y, w, h, description, look?, get?, use?, talk?, useItem?, walk?, isExit?, onExit?, walkToX?, hidden? }
```
- Actions without handlers fall through to generic defaults in `engine.performAction()`
- Use `hidden` (can be a getter) to conditionally hide hotspots: `get hidden() { return engine.getFlag('some_flag'); }`
- Hotspots are checked **last-to-first** (later entries have priority)
- `useItem` receives `(engine, itemId)` for inventory-on-hotspot interactions

### State Management
- **Flags** (`engine.setFlag(name)` / `engine.getFlag(name)`) control puzzle progression and conditional drawing
- **Critical bug pattern**: Never gate drawing of persistent objects (NPCs, bodies) on a flag set by `look`. The `examined_crew` bug (looking at Dr. Chen made her disappear) was caused by `if (!flag)` wrapping both body drawing AND the flag being set by the look handler. Gate visuals on action-specific flags (e.g., `got_keycard_corridor` for pickup).
- **Score**: `engine.addScore(pts)`, max 215 (capped automatically). Guard against double-scoring with flags.

### Cutscene System
```js
engine.playCutscene({ duration, draw(ctx, w, h, progress, elapsed), onEnd(), skippable })
```
Sets `playerVisible = false` during playback. Skippable via click/Space/Escape/Enter. The `onEnd` callback typically calls `engine.goToRoom()`.

### Sierra Pseudo-3D Scene Design (REQUIRED for all rooms)
Every room **must** use Sierra-style pseudo-3D perspective. This is non-negotiable and defines the visual identity of the game:

- **Vanishing point** at roughly centre-screen (x≈320, y≈55–80). All side walls converge toward it.
- **Left wall**: a filled trapezoid from the top-left corner to the vanishing point — top edge `lTop(x) = x * k`, bottom edge `lBot(x) = floorY - x * k2`. Draw panel seams as perspective-correct lines along this surface.
- **Right wall**: mirror of the left — `rTop(x) = (w - x) * k`, `rBot(x) = floorY - (w - x) * k2`.
- **Back wall**: a centred rectangular band between the two vanishing edges (e.g., x: 155–485, y: 55–255).
- **Floor**: fills from the bottom of the back wall to the bottom of the canvas. Use a perspective grid — lines radiating from the vanishing point plus horizontal parallels.
- **Ceiling**: triangle/trapezoid from canvas top corners to the vanishing edge of the back wall.
- **Doors and objects on side walls** are drawn as perspective trapezoids — their top/bottom y-coordinates are computed from the wall's `lTop`/`lBot` (or `rTop`/`rBot`) functions at the relevant x positions. Never draw wall-mounted objects as flat rectangles.
- **Depth scaling**: objects and the player sprite scale smaller toward the vanishing point. Use `engine.setDepthScaling()` in `onEnter`.
- **Reference implementation**: the Corridor room (Room 2) and Engine Room (Room 11) are the canonical examples — study them before drawing any new room.

### Drawing Conventions
- Shared helpers: `stars()`, `metalWall()`, `metalFloor()`, `alarmGlow()`, `alarmLight()`, `gradientRect()`
- Animations use `eng.animTimer` (ms elapsed) with modular cycles, e.g., `(eng.animTimer % 2400) / 2400`
- Flashing effects use `Math.floor(Date.now() / 500) % 2`
- Text uses `"Courier New"` font exclusively, sizes 3px–44px
- Player sprite is ~40px tall at scale factor `s = 2`, drawn at `playerY = 310` (walkable floor zone is roughly y > 240)

### Item Flow
Items registered via `engine.registerItem({ id, name, description })`. Acquired with `engine.addToInventory(id)`, checked with `engine.hasItem(id)`, removed with `engine.removeFromInventory(id)`.

## Room Progression (Puzzle Chain)
1. **Broom Closet** → 2. **Corridor** (get keycard from Dr. Chen) → 3. **Science Lab** (get data cartridge) → 4. **Pod Bay** (get survival kit, launch pod → cutscene) → 5. **Desert** (crashed on planet) → 6. **Cave** (get xenon crystal) → 7. **Outpost** (sell crystal for credits) → 8. **Cantina** (buy ale, trade for nav chip) → 9. **Shop** (buy pulsar ray) → 10. **Draknoid Ship** (use pulsar ray on guard → cutscene, use cartridge on console, grab quantum drive → victory cutscene)

## Development Workflow
- **Run**: Serve with any HTTP server (e.g., `python -m http.server 8080`) and open in browser
- **Validate**: `node -c js/engine.js ; node -c js/game.js` for syntax checking (no build step)
- **Shortcuts**: F5 save, F7 load, L/G/U/T/W for actions, arrow keys to walk, R to restart on death

## Common Pitfalls
- **Smart quotes**: Never use Unicode curly quotes (`'` `'` `"` `"`) in string literals — use ASCII `'` and `"` only
- **Hotspot overlap**: When hotspots overlap, later entries in the array take click priority. Use `get hidden()` for dynamic visibility instead of reordering.
- **Canvas text**: Always reset `ctx.textAlign` to `'left'` after using `'center'` or `'right'`
- **Walking bounds**: Player X is clamped to 30–610. Floor clicks only register for y > 240.
