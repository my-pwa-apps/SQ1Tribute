const fs = require('fs');
const path = require('path');

function fail(message) {
    console.error(message);
    process.exitCode = 1;
}

function read(file) {
    return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

const game = read('js/game.js');
const html = read('index.html');
const sw = read('serviceworker.js');

const itemIds = new Set([...game.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]));
const roomIds = new Set([...game.matchAll(/engine\.registerRoom\(\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]));
const roomRefs = [...game.matchAll(/goToRoom\('([^']+)'/g)].map((m) => m[1]);
const itemRefs = [...game.matchAll(/(?:hasItem|addToInventory|removeFromInventory)\('([^']+)'\)|(?:itemId|id)\s*===\s*'([^']+)'/g)]
    .map((m) => m[1] || m[2]);

for (const roomId of roomRefs) {
    if (!roomIds.has(roomId)) fail(`Unknown room reference: ${roomId}`);
}

for (const itemId of itemRefs) {
    if (!itemIds.has(itemId)) fail(`Unknown item reference: ${itemId}`);
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .filter((m) => m[1].trim().length > 0);
if (inlineScripts.length) {
    fail('Inline script found; this violates the page CSP.');
}

const assetMatches = [...sw.matchAll(/'(\.\/[^']+)'/g)].map((m) => m[1].replace(/^\.\//, ''));
for (const asset of assetMatches) {
    if (asset === '') continue;
    if (!fs.existsSync(path.join(__dirname, '..', asset))) {
        fail(`Service worker asset does not exist: ${asset}`);
    }
}
