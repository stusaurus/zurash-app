// Reproducible editorial selection from the certified research corpus, plus
// hand-authored introductory puzzles. No unresolved research candidate ships.
import fs from 'node:fs/promises';
import {readEvidence} from './puzzle-evidence.js';
import {hash,symmetryFingerprint,solutionSignature} from './puzzle-generation.js';
import {solve} from '../src/puzzle/solver.js';
import {replay} from '../src/puzzle/engine.js';
import {validateCampaign,validateChapterStage} from '../src/puzzle/campaign.js';

const out='data/chapters/chapter-01',report='reports/chapter-01';
const campaign=validateCampaign(JSON.parse(await fs.readFile('data/campaign.json','utf8')));
const sourceManifest=JSON.parse(await fs.readFile('reports/puzzle-scale/manifest.json','utf8'));
const sourceStages=(await Promise.all(sourceManifest.chunks.map(c=>fs.readFile('reports/puzzle-scale/'+c.path,'utf8').then(JSON.parse)))).flat();
const ledger=(await readEvidence('reports/puzzle-scale','verification.jsonl')).trim().split('\n').map(JSON.parse);
const sourceById=new Map(sourceStages.map(s=>[s.id,s]));
const noItems={iceBlock:0,powerGlove:0,warpCrystal:0};
const itemAction={iceBlock:'ice',powerGlove:'glove',warpCrystal:'warp'};
const definitions=[
  ['はじめての滑走','止まったマスの星を取ろう','base',1,1],
  ['壁をずらしてみよう','壁を1マス動かして停止位置を変えよう','base',2,3,'wide'],
  ['曲がり角の向こう','L字の曲がり角から道を探そう','base',2,3,'L'],
  ['たてながの小道','縦長の盤面を上下に滑ろう','base',2,4,'tall'],
  ['かけた氷の岸','切欠きの手前でも止まれるよ','base',3,4,'notched'],
  ['ふたつの星','星を取る順番を考えよう','base',3,5,'square'],
  ['T字の分かれ道','分かれ道で壁を役立てよう','base',3,5,'T'],
  ['氷の中庭','穴の周りを回って進もう','base',3,5,'ring'],
  ['工房への道','基本の滑走と壁ずらしのまとめ','base',3,5,'wide'],
  ['氷を置いてストップ！','氷を置くと星のマスで止まれる！','ice',1,1],
  ['もうひとつの停留所','氷を置く場所を選ぼう','ice',2,4],
  ['短い氷の橋','少ない手で星まで進もう','ice',2,4],
  ['工房の裏道','形の違う道でも氷を使おう','ice',3,5],
  ['氷と動く壁','氷を置く手と壁を動かす手を分けよう','ice',3,5],
  ['ひと休みの散歩','基本の壁ずらしをもう一度','base',3,4],
  ['折り返しの氷道','氷を置いてから折り返そう','ice',3,5],
  ['中庭の停留所','穴と氷で停止位置を作ろう','ice',3,5,'ring'],
  ['星をめぐる小道','先に取る星を見つけよう','ice',4,6],
  ['荷揚げ場を目指して','氷と壁ずらしのまとめ','ice',4,6],
  ['ぐいっと2マス！','グローブなら壁を一度に2マス動かせる！','glove',1,1],
  ['荷物を動かす力','グローブで新しい経路を作ろう','glove',2,4],
  ['遠くの壁を動かそう','2マス動かした先を考えよう','glove',3,5],
  ['力持ちの回り道','滑る前に壁の位置を整えよう','glove',3,5],
  ['ふたつの力加減','普通の壁ずらしとグローブを使い分けよう','glove',3,5],
  ['氷細工のおさらい','氷を置くタイミングを思い出そう','ice',3,5],
  ['街角の散歩道','道具を使わない壁ずらし問題','base',4,5],
  ['氷とグローブ','氷とグローブを別の手で使ってみよう','ice-glove',3,6],
  ['ちからを使う順番','グローブを使う手を見極めよう','glove',4,6],
  ['転送門の工事現場','氷とグローブを組み合わせよう','ice-glove',4,6],
  ['門の向こうへ！','ポータルから別の列へ移動できる！','warp',2,2],
  ['クリスタルの小道','ポータルへ滑ってからワープしよう','warp',2,4],
  ['向こう岸の星','転送先から滑る方向を考えよう','warp',3,5],
  ['回廊の転送門','盤面の形とポータルを見比べよう','warp',3,5],
  ['街を横切る近道','ワープするタイミングを選ぼう','warp',3,5],
  ['広場でひと休み','基本ルールだけの星集め','base',4,5],
  ['氷の停留所と門','氷とワープを組み合わせよう','ice-warp',3,6],
  ['クリスタルの回遊路','ワープ前後の動きをつなげよう','warp',4,6],
  ['工房から転送門へ','解放した道具を組み合わせよう','multi',4,6],
  ['星あつめの配達便','壁を準備してからワープしよう','warp',4,6],
  ['三つの道具の広場','複数の道具を使い分けよう','multi',3,6],
  ['氷の街の回り道','道具を使う順番を考えよう','multi',3,6],
  ['荷揚げ場の配達','壁と道具で停止位置を整えよう','multi',3,6],
  ['転送門の星めぐり','複数の道具で星をつなごう','multi',3,6],
  ['工房の知恵','必要な手で必要な道具を使おう','multi',3,6],
  ['街をつなぐ氷道','別々の道具の働きを組み合わせよう','multi',3,6],
  ['星あかりの運搬路','壁を動かす手と道具の手を選ぼう','multi',3,7],
  ['クリスタルの往復便','ワープと停止位置をつなごう','multi',3,7],
  ['氷の街の仕上げ','使える回数を確かめて進もう','multi',3,7],
  ['お祭りの準備','道具を役立てて最後の道をひらこう','multi',3,7],
  ['氷の街に星あかりを','三つの道具を全部使って第1章を完成させよう','all',3,7],
];
const stages=[],certificates=[],usedSources=new Set(),usedBoards=new Set(),patterns=new Map();
const chapter={version:1,id:'ice-town-01',campaignId:'ice-town',number:1,title:'氷の街に星あかりを',release:'draft',firstStage:1,count:50,
  campaign:'../../campaign.json',catalog:'manifest.json',requires:[],stageIds:Array.from({length:50},(_,i)=>`pz-${100001+i}`)};
const blank=()=>({schemaVersion:1,rulesVersion:'solo-v1',revision:1,status:'candidate',board:{width:4,height:4},start:0,walls:[],stars:[3],fixed:[],iceSockets:[],portals:[],inventory:{...noItems},goal:{type:'collect-all'}});
const itemTypes=r=>[...new Set(r.actions.map(a=>a.prep.type).filter(t=>['ice','glove','warp'].includes(t)))];
function configure(source,profile) {
  const s=structuredClone(source);s.inventory={...noItems};
  if(profile==='ice'||profile==='ice-glove'||profile==='ice-warp')s.inventory.iceBlock=1;
  if(profile==='glove'||profile==='ice-glove')s.inventory.powerGlove=1;
  if(profile==='warp'||profile==='ice-warp')s.inventory.warpCrystal=1;
  if(profile==='multi'||profile==='all')s.inventory={...source.inventory};
  if(!s.inventory.iceBlock)s.iceSockets=[];
  if(!s.inventory.warpCrystal)s.portals=[];
  // Fixed research obstacles become holes in the chapter geometry, keeping
  // their movement effect without introducing an unexplained fourth gimmick.
  if(s.fixed.length) {
    s.board.playableCells=(s.board.playableCells??Array.from({length:s.board.width*s.board.height},(_,i)=>i)).filter(c=>!s.fixed.includes(c));s.fixed=[];
  }
  return s;
}
function matches(profile,result) {
  const types=itemTypes(result);
  if(profile==='base')return !types.length;
  if(profile==='multi')return types.length>=2;
  if(profile==='all')return types.length===3;
  const required={'ice':['ice'],'glove':['glove'],'warp':['warp'],'ice-glove':['ice','glove'],'ice-warp':['ice','warp']}[profile];
  return required.every(t=>types.includes(t));
}
for(let i=0;i<50;i++) {
  const number=i+1,[title,focus,profile,min,max,wantedShape]=definitions[i];
  const intro=campaign.unlocks.find(e=>e.stageNumber===number);
  const metadata={id:chapter.id,number,title,focus,...(intro?{tutorialItem:intro.item}:{})};
  const decorate=s=>({...s,id:chapter.stageIds[i],chapter:metadata});
  let chosen,result,sourceId=null,withoutItems=null;
  if([1,10,20,30].includes(number)) {
    chosen=blank();
    if(number===10){chosen.stars=[2];chosen.iceSockets=[3];chosen.inventory.iceBlock=1;}
    if(number===20){chosen.walls=[11];chosen.stars=[2];chosen.inventory.powerGlove=1;}
    if(number===30){chosen.portals=[[3,5]];chosen.stars=[13];chosen.inventory.warpCrystal=1;}
    chosen=decorate(chosen);result=solve(chosen,{maxNodes:30000,maxMs:3000});
    if(number!==1)withoutItems=solve({...chosen,inventory:{...noItems}},{maxNodes:30000,maxMs:3000});
  }else {
    const candidates=ledger.filter(r=>r.status==='solved'&&!usedSources.has(r.id)&&r.optimalTurns>=min&&r.optimalTurns<=max).map(r=>({r,s:sourceById.get(r.id)})).filter(({s,r})=>{
      if(wantedShape&&s.provenance.shape!==wantedShape)return false;
      if(number<10&&(Math.max(s.board.width,s.board.height)>7||s.stars.length>2||s.walls.length>2||s.fixed.length))return false;
      if(number===6&&s.stars.length!==2)return false;
      if(profile==='base')return s.provenance.profile==='base';
      if(['ice','glove','warp'].includes(profile))return s.provenance.profile===profile&&matches(profile,r);
      return s.provenance.profile==='mixed'&&matches(profile,r);
    });
    // Spread source shapes and dimensions instead of filling a chapter with the
    // first examples of the same geometry. Fixed source id breaks ties.
    const geometryUse=s=>stages.filter(x=>x.provenance?.shape===s.provenance.shape).length;
    candidates.sort((a,b)=>geometryUse(a.s)-geometryUse(b.s)||a.r.id.localeCompare(b.r.id));
    for(const {s}of candidates) {
      const trial=decorate(configure(s,profile));
      if(usedBoards.has(symmetryFingerprint(trial)))continue;
      const solved=solve(trial,{maxNodes:30000,maxMs:3000});
      if(solved.status!=='solved'||solved.optimalTurns<min||solved.optimalTurns>max||!matches(profile,solved))continue;
      if(number===2&&!solved.actions.some(a=>a.prep.type==='wall'))continue;
      const pattern=solutionSignature(solved.actions);if((patterns.get(pattern)??0)>=2)continue;
      let ablation=null;
      if(profile!=='base') {
        ablation=solve({...trial,inventory:{...noItems}},{maxNodes:30000,maxMs:3000});
        if(ablation.status==='budget'||(ablation.status==='solved'&&ablation.optimalTurns===solved.optimalTurns))continue;
      }
      chosen=trial;result=solved;sourceId=s.id;withoutItems=ablation;break;
    }
  }
  if(!chosen||result.status!=='solved'||!replay(chosen,result.actions).cleared)throw Error(`Could not author chapter stage ${number} (${profile})`);
  validateChapterStage(campaign,chapter,chosen);
  if(intro&&(!matches(profile,result)||withoutItems.status==='budget'||(withoutItems.status==='solved'&&withoutItems.optimalTurns<=result.optimalTurns)))throw Error('Intro item has no proved benefit');
  chosen.chapter.hint=number===10?'光るソケットに氷を置いて、右へ滑ろう。':number===20?'壁をグローブで上へ2マス動かして、右へ滑ろう。':number===30?'まず右のポータルへ。ワープした先から下へ滑ろう。':`${focus}。壁を動かさずに滑る手も使えるよ。`;
  const pattern=solutionSignature(result.actions);patterns.set(pattern,(patterns.get(pattern)??0)+1);
  usedBoards.add(symmetryFingerprint(chosen));if(sourceId)usedSources.add(sourceId);
  stages.push(chosen);certificates.push({number,id:chosen.id,sourceId,stageHash:hash(JSON.stringify(chosen)),symmetryHash:symmetryFingerprint(chosen),optimalTurns:result.optimalTurns,actions:result.actions,
    itemTypes:itemTypes(result),withoutItems:withoutItems?{status:withoutItems.status,optimalTurns:withoutItems.optimalTurns??null}:null,expanded:result.expanded});
  console.log(`${number}: ${title} (${result.optimalTurns} turns; ${itemTypes(result).join('+')||'base'})`);
}
await fs.mkdir(out+'/chunks',{recursive:true});await fs.mkdir(report,{recursive:true});
const chunks=[];
for(let i=0;i<50;i+=10) {
  const group=stages.slice(i,i+10),text=JSON.stringify(group,null,2)+'\n',name=`chunks/chapter-01-${i/10+1}.json`;
  await fs.writeFile(out+'/'+name,text);chunks.push({first:i+1,last:i+10,count:10,path:name,ids:group.map(s=>s.id),sha256:hash(text),bytes:Buffer.byteLength(text)});
}
const manifest={version:1,rulesVersion:'solo-v1',count:50,chunks};
await fs.writeFile(out+'/chapter.json',JSON.stringify(chapter,null,2)+'\n');
await fs.writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(report+'/solutions.json',JSON.stringify({version:1,rulesVersion:'solo-v1',stages:certificates},null,2)+'\n');
console.log('Authored and replayed all 50 chapter stages.');
