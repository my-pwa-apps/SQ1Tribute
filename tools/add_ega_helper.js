
const fs = require("fs");

const helper = `
function egaColor(r, g, b, a) {
    if (a !== undefined && a < 0.1) return "transparent";
    const egaPalette = [
        [0, 0, 0, "#000000"], [0, 0, 170, "#0000AA"], [0, 170, 0, "#00AA00"], [0, 170, 170, "#00AAAA"],
        [170, 0, 0, "#AA0000"], [170, 0, 170, "#AA00AA"], [170, 85, 0, "#AA5500"], [170, 170, 170, "#AAAAAA"],
        [85, 85, 85, "#555555"], [85, 85, 255, "#5555FF"], [85, 255, 85, "#55FF55"], [85, 255, 255, "#55FFFF"],
        [255, 85, 85, "#FF5555"], [255, 85, 255, "#FF55FF"], [255, 255, 85, "#FFFF55"], [255, 255, 255, "#FFFFFF"]
    ];
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
`;

function processFile(filename) {
    let content = fs.readFileSync(filename, "utf8");
    
    // Add helper if not exists
    if (!content.includes("function egaColor")) {
        content = helper + content;
    }

    // Replace `rgba(r, g, b, a)` with egaColor(r, g, b, a)
    // This is tricky because of string concatenation.
    // Let us just replace the string "rgba(" with "egaColor(" ? No, egaColor returns a string, so we need to remove the quotes.
    
    fs.writeFileSync(filename, content);
    console.log("Processed " + filename);
}

processFile("js/game.js");
processFile("js/engine.js");

