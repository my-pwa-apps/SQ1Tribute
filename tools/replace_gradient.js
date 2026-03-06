
const fs = require("fs");

let content = fs.readFileSync("js/game.js", "utf8");

const newGradientRect = `    function gradientRect(ctx, x, y, w, h, c1, c2, vertical) {
        // EGA style dithered gradient
        const steps = 4;
        const stepSize = (vertical !== false ? h : w) / steps;
        
        for (let i = 0; i < steps; i++) {
            const pos = i * stepSize;
            const size = stepSize;
            
            let rx = x, ry = y, rw = w, rh = h;
            if (vertical !== false) {
                ry = y + pos;
                rh = size;
            } else {
                rx = x + pos;
                rw = size;
            }
            
            if (i === 0) {
                ctx.fillStyle = c1;
                ctx.fillRect(rx, ry, rw, rh);
            } else if (i === steps - 1) {
                ctx.fillStyle = c2;
                ctx.fillRect(rx, ry, rw, rh);
            } else {
                // Dither mix
                const mix = i / (steps - 1);
                const ps = 2;
                ctx.fillStyle = mix < 0.5 ? c1 : c2;
                ctx.fillRect(rx, ry, rw, rh);
                
                ctx.fillStyle = mix < 0.5 ? c2 : c1;
                const density = mix < 0.5 ? mix * 2 : (1 - mix) * 2;
                
                for (let py = ry; py < ry + rh; py += ps) {
                    const offset = ((py - ry) / ps) % 2 === 0 ? 0 : ps;
                    for (let px = rx + offset; px < rx + rw; px += ps * 2) {
                        if (Math.random() < density) {
                            ctx.fillRect(px, py, ps, ps);
                        }
                    }
                }
            }
        }
    }`;

content = content.replace(/    function gradientRect\([\s\S]*?ctx\.fillRect\(x, y, w, h\);\n    \}/, newGradientRect);

fs.writeFileSync("js/game.js", content);
console.log("Replaced gradientRect with dithered version");

