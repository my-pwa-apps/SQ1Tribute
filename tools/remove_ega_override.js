
const fs = require("fs");
let content = fs.readFileSync("js/engine.js", "utf8");

// Remove the EGA Palette Override IIFE
const startStr = "EGA Palette Override";
const endStr = "})();\n";

const startIndex = content.indexOf(startStr);
if (startIndex !== -1) {
    const endIndex = content.indexOf(endStr, startIndex) + endStr.length;
    content = content.substring(0, startIndex) + content.substring(endIndex);
    content = content.replace(/^\s*[\r\n]/gm, ""); // remove empty lines at start
    fs.writeFileSync("js/engine.js", content);
    console.log("Removed EGA Palette Override from engine.js");
} else {
    console.log("EGA Palette Override not found in engine.js");
}

