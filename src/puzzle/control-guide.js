/**
 * A spoiler-free control coach. Derives only currently LEGAL UI actions from
 * engine successors; never reads a proof or picks a preferred solution.
 */
const labels=Object.freeze({none:'そのまま滑る',wall:'壁をずらす',ice:'氷を置く',glove:'グローブ',warp:'ワープ'});
const arrows=Object.freeze(['↑','→','↓','←']);
const samePrep=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function controlGuide({mode,selectedWall=null,selectedPrep=null,options=[],cleared=false}){
 if(!Object.hasOwn(labels,mode)||!Array.isArray(options))throw Error('Invalid control guide');
 if(cleared)return Object.freeze({title:'クリア！',instruction:'星をぜんぶ集めたよ。次の冒険へ進もう。',directions:'',phase:'clear'});
 const available=options.filter(o=>o?.action?.prep?.type===mode);
 const active=selectedPrep?available.filter(o=>samePrep(o.action.prep,selectedPrep)):[];
 const directions=arrows.filter((_,dir)=>active.some(o=>o.action.dir===dir)).join(' ');
 const title='選んだ操作：'+labels[mode];
 let instruction,phase;
 if(mode==='none'){
  phase='direction';
  instruction='光る停止マスか、下の矢印を押そう。';
 }else if((mode==='wall'||mode==='glove')&&selectedWall===null){
  phase='wall';
  instruction='光っている動かせる壁をタップしよう。';
 }else if((mode==='wall'||mode==='glove')&&!selectedPrep){
  phase='target';
  instruction='壁の移動先として光るマスをタップしよう。';
 }else if(!selectedPrep){
  phase='target';
  instruction=mode==='ice'?'氷を置ける光るマスをタップしよう。':'ワープ先の光るポータルをタップしよう。';
 }else{
  phase='direction';
  instruction='準備OK！ 光る停止マスか、下の矢印を押そう。';
 }
 if(phase==='direction'&&!directions)instruction='この準備では滑れないよ。別の操作を選んでみよう。';
 return Object.freeze({title,instruction,directions,phase});
}
