// The house album is derived entirely from validated chapter-two completion
// records. No new save keys, proof reveals, artificial rewards or practice clears.
import {EXPEDITION_STOPS,expeditionProgress} from './expedition.js';
import {canEnterTwo} from './chapter-two-progress.js';

export function expeditionAlbum(entries,save,{practice=false}={}){
 if(!Array.isArray(entries)||entries.length!==20||!save?.completed)throw Error('Invalid chapter-two album');
 const journey=expeditionProgress(entries,save,{practice});
 const milestones=EXPEDITION_STOPS.map((stop,i)=>{
  const first=i*5,group=entries.slice(first,first+5);
  const records=group.map((stage,j)=>practice||first+j>=journey.completed?null:(save.completed[stage.id]?.revision===stage.revision?save.completed[stage.id]:null));
  const cleared=records.filter(Boolean).length;
  const sRanks=records.filter((r,j)=>r&&r.bestTurns===group[j].challenge.minimumTurns).length;
  const pending=records.findIndex(r=>!r);
  const nonS=records.findIndex((r,j)=>r&&r.bestTurns>group[j].challenge.minimumTurns);
  const targetIndex=first+(pending>=0?pending:nonS>=0?nonS:0);
  const accessible=canEnterTwo(entries,save,targetIndex,{practice});
  return {
   id:stop.id,stage:stop.stage,name:stop.name,symbol:stop.symbol,
   story:journey.stops[i].lit?stop.story:null,
   lit:journey.stops[i].lit,cleared,sRanks,total:5,
   nextStage:accessible?entries[targetIndex].chapter.number:null,
   nextTitle:accessible?entries[targetIndex].chapter.title:null,
   nextAction:!accessible?null:pending>=0?'続きを遊ぶ':nonS>=0?'Sランクに再挑戦':'もう一度遊ぶ'
  };
 });
 const sRanks=milestones.reduce((total,m)=>total+m.sRanks,0);
 return {
  completed:journey.completed,earned:journey.earned,lit:journey.lit,
  sRanks,total:20,complete:journey.complete,
  milestones
 };
}
