const fs = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add steps modal before </body>
const modal = `
<div class="overlay" id="stepsModal">
<div class="modal-card" style="text-align:left;max-height:80vh;overflow-y:auto;padding:24px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
<h2 id="stepsTitle" style="font-size:20px;margin:0"></h2>
<button onclick="closeSteps()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999">&times;</button>
</div>
<div id="stepsContent" style="font-size:14px;line-height:2"></div>
</div>
</div>`;
html = html.replace('</body>', modal + '\n</body>');

// 2. Add CSS before </style>
const stepsCss = `
.steps-badge{display:inline-block;background:var(--pri-l);color:var(--pri);padding:2px 8px;border-radius:8px;font-size:10px;margin-top:4px;cursor:pointer}
.step-item{display:flex;gap:10px;margin-bottom:12px;align-items:flex-start}
.step-num{width:24px;height:24px;border-radius:50%;background:var(--pri);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:2px}
.step-text{flex:1;color:var(--txt)}`;
html = html.replace('</style>', stepsCss + '\n</style>');

// 3. Add functions before </script>
const stepsFunc = `
function showSteps(id){
var d=D.find(function(x){return x.id===id;});
if(!d||!d.steps)return;
document.getElementById('stepsTitle').textContent=d.e+' '+d.n;
document.getElementById('stepsContent').innerHTML=d.steps.map(function(s,i){
return '<div class="step-item"><div class="step-num">'+(i+1)+'</div><div class="step-text">'+s+'</div></div>';
}).join('');
document.getElementById('stepsModal').classList.add('show');
}
function closeSteps(){document.getElementById('stepsModal').classList.remove('show');}
`;
html = html.replace('function showToast', stepsFunc + 'function showToast');

// 4. Add steps button before add-btn in dishCard
// Use a function replacement to avoid d.id evaluation
html = html.replace(
  /<button class="add-btn/g,
  function(match) {
    return '<span class="steps-badge" onclick="showSteps(\'+d.id+\')">\u{1F4CB} 做法</span>' + match;
  }
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Steps UI added');
