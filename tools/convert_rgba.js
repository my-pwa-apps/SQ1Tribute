
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

function processFile(filename) {
    let content = fs.readFileSync(filename, "utf8");
    
    // Replace rgba(r,g,b,a) with closest EGA color
    content = content.replace(/[\x27\x60]rgba\((\d+),\s*(\d+),\s*(\d+),[^)]+\)[\x27\x60]/g, (match, r, g, b) => {
        return "\x27" + getClosestEGA(parseInt(r), parseInt(g), parseInt(b)) + "\x27";
    });

    fs.writeFileSync(filename, content);
    console.log("Processed " + filename);
}

processFile("js/game.js");
processFile("js/engine.js");

