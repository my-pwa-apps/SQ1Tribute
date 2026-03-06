const fs = require('fs');
let code = fs.readFileSync('js/game.js', 'utf8');

const corridorStart = code.indexOf("id: 'corridor',");
const drawStart = code.indexOf("draw: (ctx, w, h, eng) => {", corridorStart);
const drawEnd = code.indexOf("// Perspective helpers for corridor walls", drawStart);

const newDraw = "draw: (ctx, w, h, eng) => {\\n" +
"            // Perspective corridor\\n" +
"            // Ceiling\\n" +
"            ctx.fillStyle = '#222240';\\n" +
"            ctx.beginPath();\\n" +
"            ctx.moveTo(0, 0); ctx.lineTo(200, 55); ctx.lineTo(440, 55); ctx.lineTo(640, 0);\\n" +
"            ctx.closePath(); ctx.fill();\\n" +
"            \\n" +
"            // Back wall\\n" +
"            ditherRect(ctx, 200, 55, 240, 200, '#282848', '#1a1a2e', 2);\\n" +
"            \\n" +
"            // Left wall\\n" +
"            ditherPoly(ctx, [{x:0,y:0}, {x:200,y:55}, {x:200,y:255}, {x:0,y:275}], '#2e2e50', '#1a1a2e', 2);\\n" +
"            \\n" +
"            // Right wall\\n" +
"            ditherPoly(ctx, [{x:640,y:0}, {x:440,y:55}, {x:440,y:255}, {x:640,y:275}], '#2a2a4a', '#1a1a2e', 2);\\n" +
"            \\n" +
"            // Floor\\n" +
"            ditherPoly(ctx, [{x:0,y:275}, {x:200,y:255}, {x:440,y:255}, {x:640,y:275}, {x:640,y:400}, {x:0,y:400}], '#484860', '#2a2a4a', 2);\\n" +
"            \\n" +
"            // Floor lines\\n" +
"            ctx.strokeStyle = '#000000';\\n" +
"            for (let i = 0; i < 10; i++) {\\n" +
"                const y = 275 + i * 14;\\n" +
"                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();\\n" +
"            }\\n\\n            ";

code = code.substring(0, drawStart) + newDraw + code.substring(drawEnd);
fs.writeFileSync('js/game.js', code);
console.log('Corridor room updated.');
