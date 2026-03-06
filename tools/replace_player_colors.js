
const fs = require("fs");
let content = fs.readFileSync("js/engine.js", "utf8");

const startIdx = content.indexOf("drawPlayer(ctx) {");
const endIdx = content.indexOf("drawTitleScreen(ctx) {");

if (startIdx !== -1 && endIdx !== -1) {
    let playerCode = content.substring(startIdx, endIdx);
    
    // Replace suit colors (blue to white/light gray)
    playerCode = playerCode.replace(/#0000AA/g, "#FFFFFF"); // Legs
    playerCode = playerCode.replace(/#5555FF/g, "#AAAAAA"); // Body/Arms
    
    // Replace skin colors (peach to magenta)
    playerCode = playerCode.replace(/#FF5555/g, "#FF55FF"); // Skin
    
    // Replace hair colors (brown to brown)
    playerCode = playerCode.replace(/#AA5500/g, "#AA5500"); // Hair
    
    content = content.substring(0, startIdx) + playerCode + content.substring(endIdx);
    fs.writeFileSync("js/engine.js", content);
    console.log("Replaced player colors in engine.js");
} else {
    console.log("Could not find drawPlayer or drawTitleScreen");
}

