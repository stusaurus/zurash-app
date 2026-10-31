import {createHash} from 'node:crypto';
import {validateStage,RULES_VERSION} from '../src/puzzle/schema.js';
export const SHAPES=['square','wide','tall','L','T','ring','notched'];
export const hash=text=>createHash('sha256').update(text).digest('hex');
export function rng(seed) {
  let x=seed>>>0||1;
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
export function generateCandidate(index,{seed=731031,large=false}={}) {
  const random=rng((seed+Math.imul(index+1,2654435761))>>>0),int=n=>Math.floor(random()*n);
  const shape=SHAPES[index%SHAPES.length];
  let width=4+int(6),height=4+int(6);
  if(shape==='square') height=width;
  if(shape==='wide') {width=7+int(3);height=4+int(3);}
  if(shape==='tall') {width=4+int(3);height=7+int(3);}
  if(large) {width=12+int(5);height=12+int(5);}
  const playableCells=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    if(shape==='L'&&x>=Math.ceil(width/2)&&y<Math.floor(height/2))continue;
    if(shape==='T'&&y>=2&&(x<Math.floor(width/2)-1||x>Math.floor(width/2)))continue;
    if(shape==='ring'&&x>=Math.floor(width/2)-1&&x<=Math.floor(width/2)&&y>=Math.floor(height/2)-1&&y<=Math.floor(height/2))continue;
    if(shape==='notched'&&x>=width-2&&y===Math.floor(height/2))continue;
    playableCells.push(y*width+x);
  }
  const pool=[...playableCells];
  for(let i=pool.length-1;i>0;i--){const j=int(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  const take=n=>Array.from({length:n},()=>pool.pop());
  const inventory={iceBlock:0,powerGlove:0,warpCrystal:0};
  const profile=['base','base','base','base','ice','glove','warp','mixed'][index%8];
  if(profile==='ice'||profile==='mixed')inventory.iceBlock=1;
  if(profile==='glove'||profile==='mixed')inventory.powerGlove=1;
  if(profile==='warp'||profile==='mixed')inventory.warpCrystal=1;
  // Reserve feature cells before optional fixed obstacles. Small T boards can
  // otherwise exhaust the shuffled pool and emit undefined portal endpoints.
  const featureCells=(inventory.iceBlock?3:0)+(inventory.warpCrystal?2:0);
  const wallCount=Math.min(large?6:1+int(3),pool.length-1-featureCells-1);
  const starCount=Math.min(large?4:1+int(3),pool.length-1-featureCells-wallCount);
  const fixedCount=Math.min(int(3),pool.length-1-featureCells-wallCount-starCount);
  const stage={schemaVersion:1,rulesVersion:RULES_VERSION,id:`pz-${String(index+1).padStart(6,'0')}`,revision:1,status:'candidate',
    board:{width,height,...(playableCells.length===width*height?{}:{playableCells})},
    start:take(1)[0],walls:take(wallCount),stars:take(starCount),fixed:take(fixedCount),
    iceSockets:inventory.iceBlock?take(3):[],portals:inventory.warpCrystal?[take(2)]:[],
    inventory,goal:{type:'collect-all'},provenance:{generator:'random-v1',seed,index,shape,profile}};
  return validateStage(stage);
}
function transformed(stage,transform) {
  const {width:w,height:h}=stage.board;
  const rotations=transform%4,mirror=transform>=4;
  const width=rotations%2?h:w,height=rotations%2?w:h;
  const cell=c=>{
    let x=c%w,y=Math.floor(c/w);if(mirror)x=w-1-x;
    if(rotations===1)[x,y]=[h-1-y,x];
    if(rotations===2)[x,y]=[w-1-x,h-1-y];
    if(rotations===3)[x,y]=[y,w-1-x];
    return y*width+x;
  };
  const list=a=>a.map(cell).sort((a,b)=>a-b);
  return [width,height,stage.board.playableCells?list(stage.board.playableCells):null,cell(stage.start),list(stage.walls),list(stage.stars),list(stage.fixed),list(stage.iceSockets),stage.portals.map(list).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),stage.inventory,stage.goal];
}
export const exactFingerprint=stage=>hash(JSON.stringify(transformed(stage,0)));
export const symmetryFingerprint=stage=>hash(Array.from({length:8},(_,i)=>JSON.stringify(transformed(stage,i))).sort()[0]);
export function solutionSignature(actions,{coarse=false}={}) {
  // Ignore absolute orientation. This detects a repeated certificate, not all
  // possible strategies or equivalence of the entire state graph.
  const variants=[];
  for(let mirror=0;mirror<2;mirror++)for(let rot=0;rot<4;rot++) variants.push(actions.map(a=>`${a.prep.type}:${coarse?'':((mirror?(4-a.dir)%4:a.dir)+rot)%4}`).join('|'));
  return variants.sort()[0];
}
