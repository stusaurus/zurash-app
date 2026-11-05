// Build a self-contained, static chapter-two preview without touching main or live sites.
// Run: node scripts/build-chapter-two-preview.js
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const source=process.cwd();
const output=path.join(source,'preview-dist');
const allowedFolders=['assets','src','data'];
const pages=fs.readdirSync(source).filter(file=>/^[a-z0-9][a-z0-9-]*\.(?:html|css)$/i.test(file));
function requiredFile(file){if(!fs.existsSync(path.join(source,file)))throw Error('Missing preview source: '+file);}
for(const item of [...allowedFolders,'adventure.html','chapter-two.html','expedition.css','adventure.css']){
 requiredFile(item);
}
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const folder of allowedFolders){
 fs.cpSync(path.join(source,folder),path.join(output,folder),{recursive:true});
}
for(const file of pages){
 fs.copyFileSync(path.join(source,file),path.join(output,file));
}
// Preserve the board research landing without making it the first screen.
fs.renameSync(path.join(output,'index.html'),path.join(output,'legacy-duel.html'));
const cover=String.raw`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#184e8a">
<title>ズラッシュ！｜先行試遊</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,'Noto Sans JP',sans-serif;color:#e9f8ff;background:radial-gradient(ellipse at 50% 0%,#408fbd,#0b2c59 70%);min-height:100svh}
main{width:min(95%,540px);margin:auto;padding:clamp(20px,5vw,42px) 8px 64px;text-align:center}
.logo{display:block;width:min(80%,270px);max-height:160px;object-fit:contain;margin:10px auto 4px;filter:drop-shadow(0 6px 12px #062e56)}
h1{font-size:clamp(22px,6vw,31px);line-height:1.5;margin:10px 0}
p{font-size:14px;line-height:1.8;opacity:.97}
.subtitle{font-weight:800;color:#ffdf8a}
.links{display:grid;gap:10px;margin-top:26px}
a{display:block;text-decoration:none;padding:14px;border-radius:15px;border:2px solid #b9ebff;background:linear-gradient(#f8fdff,#c5ecff);color:#145486;font-size:16px;font-weight:900;min-height:55px}
a.main{background:linear-gradient(#ffda81,#ec8c2c);border-color:#fff3c0;color:#743e0a}
a:focus-visible{outline:4px solid #ffca43;outline-offset:3px}
.small{background:#145083a8;border:1px solid #66a4d1;border-radius:14px;margin:22px auto;padding:14px;font-size:12px;line-height:1.7}
small{display:block;opacity:.92;margin-top:25px;line-height:1.8}
</style>
</head>
<body><main>
<img class="logo" src="./assets/zurash-approved-logo.webp" alt="ズラッシュ！">
<h1>氷の向こうへの冒険</h1>
<p class="subtitle">第2章・51〜70面｜先行試遊</p>
<p>星を集めて氷海の謎を解こう。初クリアで結晶を集め、4つの道しるべに灯りを戻して、トリケンの家に帰ろう。</p>
<nav class="links" aria-label="遊ぶモードを選ぶ">
<a class="main" href="./chapter-two.html?trial=1">❄ 第51面から冒険する</a>
<a href="./chapter-two.html?trial=1&practice=1&stage=60">✦ 第60面から自由試遊</a>
<a href="./chapter-two-review.html">❖ 54・57・59・70面を比較する</a>
<a href="./chapter-two.html?trial=1&practice=1&stage=54">第54面を評価する</a>
<a href="./stage54-remix-lab.html">🧊 第54面改良版・16手と17手を試す</a>
<a href="./chapter-two.html?trial=1&practice=1&stage=57">第57面を評価する</a>
<a href="./stage57-remix-lab.html">▦ 第57面・ゲート切替改良A/Bを試す</a>
<a href="./chapter-two.html?trial=1&practice=1&stage=59">第59面を評価する</a>
<a href="./stage59-return-lab.html">✧ 第59面・往復ワープ改良A/Bを試す</a>
<a href="./chapter-two.html?trial=1&practice=1&stage=51&tap=1">✦ 第51面から盤面タップで遊ぶ（実験版）</a>
<a href="./duel-boss.html?cpu=normal">⚔ CPUと対戦（強さ3段階・独立練習）</a>
<a href="./chapter-two.html?trial=1&practice=1&stage=70">第70面の現行フィナーレ</a>
<a href="./stage70-finale-lab.html">✦ 第70面・光のフィナーレA/Bを試す</a>
<a href="./adventure.html">トリケンの家・第1章</a>
</nav>
<div class="small">先行版です。通常冒険の結晶と、自由試遊の記録は別々に保存されます。感想は端末内のみに記録し、任意でJSON書き出しできます。</div>
<small>一般公開前の研究版です。iPhone実機での最終動作保証はありません。</small>
</main></body></html>
`;
fs.writeFileSync(path.join(output,'index.html'),cover);
fs.writeFileSync(path.join(output,'_redirects'),'/chapter-two /chapter-two.html 200\n/adventure /adventure.html 200\n');
fs.writeFileSync(path.join(output,'_headers'),'/*\n  X-Robots-Tag: noindex, nofollow\n');
// Fail before publishing any artifact if essential runtime files are incomplete.
const required=[
'index.html','chapter-two.html','chapter-two-review.html','chapter-two-review.css','stage54-remix-lab.html','stage59-return-lab.html','stage57-remix-lab.html','stage70-finale-lab.html','adventure.html','duel-boss.html','src/boss-duel.js','src/boss-cpu-settings.js','src/boss-cpu-worker.js','src/puzzle/cpu-encounter.js','legacy-duel.html',
'expedition.css','src/chapter-fun-lab.js','src/puzzle/expedition.js',
'src/puzzle/chapter-two-progress.js','src/puzzle/chapter-two-playtest.js',
'src/expedition-view.js','assets/zurash-approved-logo.webp','data/chapters/chapter-02/adventure-v1.json'
];
for(const item of required){
 const full=path.join(output,item);
 if(!fs.statSync(full).isFile()||fs.statSync(full).size===0)throw Error('Missing output: '+item);
}
const stageData=JSON.parse(fs.readFileSync(path.join(output,'data/chapters/chapter-02/adventure-v1.json'),'utf8'));
if(stageData.stages?.length!==20||
 stageData.stages[0].chapter.number!==51||
 stageData.stages.at(-1).chapter.number!==70)throw Error('Chapter two must contain stages 51-70');
const stack=[output],files=[];
while(stack.length){
 const dir=stack.pop();
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory())stack.push(file);
  else if(item.isFile()){
   const rel=path.relative(output,file).replaceAll(path.sep,'/');
   files.push({path:rel,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
  }
 }
}
files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={format:'zurash-static-preview-v1',sourceSha:process.env.GITHUB_SHA??'unavailable',stages:'51-70',fileCount:files.length,files};
fs.writeFileSync(path.join(output,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Preview bundle ready: '+files.length+' files / 20 stages / source '+manifest.sourceSha);
