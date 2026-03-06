
const fs = require("fs");

const egaPalette = [
    [0, 0, 0, "#000000"],
    [0, 0, 170, "#0000AA"],
    [0, 170, 0, "#00AA00"],
    [0, 170, 170, "#00AAAA"],
    [170, 0, 0, "#AA0000"],
    [170, 0, 170, "#AA00AA"],
    [170, 85, 0, "#AA5500"],
    [170, 170, 170, "#AAAAAA"],
    [85, 85, 85, "#555555"],
    [85, 85, 255, "#5555FF"],
    [85, 255, 85, "#55FF55"],
    [85, 255, 255, "#55FFFF"],
    [255, 85, 85, "#FF5555"],
    [255, 85, 255, "#FF55FF"],
    [255, 255, 85, "#FFFF55"],
    [255, 255, 255, "#FFFFFF"]
];

function getClosestEGA(r, g, b) {
    let minDist = Infinity;
    let closest = "#000000";
    for (const [er, eg, eb, hex] of egaPalette) {
        const dist = Math.pow(r - er, 2) + Math.pow(g - eg, 2) + Math.pow(b - eb, 2);
        if (dist < minDist) {
            minDist = dist;
            closest = hex;
        }
    }
    return closest;
}

function hexToRgb(hex) {
    if (hex.length === 4) {
        return [
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
            parseInt(hex[3] + hex[3], 16)
        ];
    }
    return [
        parseInt(hex.substring(1, 3), 16),
        parseInt(hex.substring(3, 5), 16),
        parseInt(hex.substring(5, 7), 16)
    ];
}

function processFile(filename) {
    let content = fs.readFileSync(filename, "utf8");

    // Replace hex colors
    content = content.replace(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g, (match) => {
        const [r, g, b] = hexToRgb(match);
        return getClosestEGA(r, g, b);
    });

    // Replace rgb(r,g,b)
    content = content.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
        return getClosestEGA(parseInt(r), parseInt(g), parseInt(b));
    });

    fs.writeFileSync(filename, content);
    console.log("Processed " + filename);
}

processFile("js/engine.js");

