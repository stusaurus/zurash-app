import fs from 'node:fs';
import crypto from 'node:crypto';
import {TASKS,newHome,budget} from '../src/puzzle/house.js';
import {HOUSE_PLAN,SCENES} from '../src/house-scenes.js';
import {ART_PLACEMENTS,assetPath,layeredDesignOptions,renderLayeredScene} from '../src/house-layered-art.js';
const records=JSON.parse(fs.readFileSync('assets/house/v7/asset-records.json'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const assets=TASKS.flatMap(t=>['before','a','b','c'].map((state,i)=>{
 const s=newHome();if(i){s.home.done[t.id]=true;s.home.styles[t.id]=i-1;}
 const path=assetPath(s,t.id).replace(/^\.\//,''),r=records.find(r=>r.path===path),old=JSON.parse(fs.readFileSync('assets/house/exterior/door/manifest.json')).variants.find(v=>v.path===path);
 if(!r&&!old)throw Error(`Unregistered artwork ${path}`);
 const viewScenes=t.area==='entry'?['exterior','entry','garden']:[t.area];
 return {assetId:`${t.id}-${state}-v1`,taskId:t.id,scene:viewScenes,state,designName:i?layeredDesignOptions(t)[i-1].name:'修復前',path,width:r?.width??320,height:r?.height??400,alpha:r?.alpha??true,sha256:hash(path),bytes:fs.statSync(path).size,version:1,placements:Object.fromEntries(viewScenes.filter(v=>v!=='garden'||t.area==='garden').map(v=>[v,ART_PLACEMENTS[v][t.slot]])),gardenBuildingTransform:t.area==='entry'?{translate:[-32,-44],scale:.57}:null,status:'draft-integrated-awaiting-visual-approval',productionApproved:false,presentInGit:false};
}));
const manifest={version:1,artVersion:'v7.1',basePR:6,baseCommit:'98779b0e55afe05bba4b468da827381abf2a415d',logicalCanvas:[480,540],housePlan:HOUSE_PLAN,repairBudget:budget,tasks:TASKS,assets,alternateViewAssets:records.filter(r=>r.assetId.startsWith('entry-wall-')).map(r=>({...r,taskId:'home-entry-1',scene:'entry',selection:'same task style as exterior; interior surface has no snow'})),fixedAssets:records.filter(r=>!r.taskId&&!r.assetId.startsWith('entry-wall-')),unusedCandidates:records.filter(r=>r.path==='assets/house/v7/bedroom/home-bedroom-1-b-v1.webp').map(r=>({...r,status:'not-adopted-checkerboard-padding'})),construction:{layer:'code-native animated scaffold and light; no new saved state',durationMs:1000,reducedMotionMs:0},formalApproval:'pending-user-visual-review',iPhoneHardware:'unverified'};
fs.writeFileSync('assets/house/v7/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const csv=['asset_id,scene,repair_id,state,width,height,placement_version,asset_version,status,production_approved,present_in_git,bytes,sha256,path',...assets.map(r=>[r.assetId,r.scene.join('|'),r.taskId,r.state,r.width,r.height,'480x540-v1',r.version,r.status,false,false,r.bytes,r.sha256,r.path].join(','))].join('\n')+'\n';
fs.writeFileSync('docs/design/house-art-registry-v7.csv',csv);
// Verify all rendered references, all styles, all scenes; no missing assets may ship.
let references=0;const sceneBudgets={};
for(const [scene]of SCENES){const styles=[];for(let i=-1;i<3;i++){
 const s=newHome();if(i>=0)for(const t of TASKS){s.home.done[t.id]=true;s.home.styles[t.id]=i;}
 const paths=[...new Set([...renderLayeredScene(s,scene).matchAll(/href="([^"]+)"/g)].map(m=>m[1].replace(/^\.\//,'')))];
 for(const p of paths){if(!fs.existsSync(p))throw Error(`Missing ${p}`);references++;}
 styles.push({style:i,files:paths.length,bytes:paths.reduce((n,p)=>n+fs.statSync(p).size,0)});
 }sceneBudgets[scene]=styles;
}
if(assets.length!==60||new Set(assets.map(a=>a.assetId)).size!==60)throw Error('Expected 60 distinct state registrations');
for(const t of TASKS)if(new Set(assets.filter(a=>a.taskId===t.id).map(a=>a.sha256)).size!==4)throw Error(`Duplicate states ${t.id}`);
const report={status:'files-and-render-references-verified; browser QA separate',registeredRepairStates:60,repairTasks:TASKS.length,repairBudget:budget,renderedReferencesChecked:references,sceneBudgets,uniqueRuntimePaths:new Set(assets.map(r=>r.path)).size,productionImageBytes:records.reduce((n,r)=>n+r.bytes,0)+assets.filter(r=>r.taskId==='home-entry-0').reduce((n,r)=>n+r.bytes,0),formalApproval:false,iPhoneHardwareVerified:false};
fs.writeFileSync('reports/house-v7/asset-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
