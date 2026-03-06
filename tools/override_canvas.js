
const fs = require("fs");

const overrideCode = `
// EGA Palette Override
(function() {
    const egaPalette = [
        [0, 0, 0, "#000000"], [0, 0, 170, "#0000AA"], [0, 170, 0, "#00AA00"], [0, 170, 170, "#00AAAA"],
        [170, 0, 0, "#AA0000"], [170, 0, 170, "#AA00AA"], [170, 85, 0, "#AA5500"], [170, 170, 170, "#AAAAAA"],
        [85, 85, 85, "#555555"], [85, 85, 255, "#5555FF"], [85, 255, 85, "#55FF55"], [85, 255, 255, "#55FFFF"],
        [255, 85, 85, "#FF5555"], [255, 85, 255, "#FF55FF"], [255, 255, 85, "#FFFF55"], [255, 255, 255, "#FFFFFF"]
    ];

    function getClosestEGA(r, g, b, a) {
        if (a !== undefined && a < 0.3) return "transparent";
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

    function parseColor(color) {
        if (typeof color !== "string") {
            if (color && color.__isEgaGradient) {
                return color.colors[0] || "#000000";
            }
            return color;
        }
        if (color === "transparent") return color;
        
        let r, g, b, a = 1;
        if (color.startsWith("#")) {
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
            } else if (color.length === 7) {
                r = parseInt(color.substring(1, 3), 16);
                g = parseInt(color.substring(3, 5), 16);
                b = parseInt(color.substring(5, 7), 16);
            } else {
                return color;
            }
        } else if (color.startsWith("rgb")) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
                if (match[4] !== undefined) a = parseFloat(match[4]);
            } else {
                return color;
            }
        } else {
            return color;
        }
        return getClosestEGA(r, g, b, a);
    }

    const originalFillStyle = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "fillStyle");
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillStyle", {
        get: function() { return originalFillStyle.get.call(this); },
        set: function(val) { originalFillStyle.set.call(this, parseColor(val)); }
    });

    const originalStrokeStyle = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "strokeStyle");
    Object.defineProperty(CanvasRenderingContext2D.prototype, "strokeStyle", {
        get: function() { return originalStrokeStyle.get.call(this); },
        set: function(val) { originalStrokeStyle.set.call(this, parseColor(val)); }
    });

    CanvasRenderingContext2D.prototype.createLinearGradient = function() {
        return {
            __isEgaGradient: true,
            colors: [],
            addColorStop: function(offset, color) {
                this.colors.push(parseColor(color));
            }
        };
    };

    CanvasRenderingContext2D.prototype.createRadialGradient = function() {
        return {
            __isEgaGradient: true,
            colors: [],
            addColorStop: function(offset, color) {
                this.colors.push(parseColor(color));
            }
        };
    };
})();
`;

let content = fs.readFileSync("js/engine.js", "utf8");
// Remove all old overrides
while (content.includes("// EGA Palette Override")) {
    const start = content.indexOf("// EGA Palette Override");
    const end = content.indexOf("})();", start) + 5;
    content = content.substring(0, start) + content.substring(end);
}
content = content.replace(/^\s*[\r\n]/gm, ""); // remove empty lines at start
content = overrideCode + "\n" + content;
fs.writeFileSync("js/engine.js", content);
console.log("Updated EGA override in engine.js");

