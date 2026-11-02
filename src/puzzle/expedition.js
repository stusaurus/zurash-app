// Rewards are derived from stable, validated clear records. No second currency ledger
// or save migration can double-pay a replay, Undo, or an older v1 save.
export const EXPEDITION_STOPS=Object.freeze([
 {at:5,stage:55,id:'trail',name:'雪道の道しるべ',story:'雪の向こうに、小さな灯りが戻った。トリケンは氷扉へ歩き出す。',symbol:'✦'},
 {at:10,stage:60,id:'gate',name:'氷扉の灯台',story:'大きな氷扉に灯りがともった。道具をつなぐ冒険は、まだ続く。',symbol:'◇'},
 {at:15,stage:65,id:'island',name:'離れ島の灯り',story:'島から戻る道にも灯りが並んだ。最後の氷標が、遠くで待っている。',symbol:'✧'},
 {at:20,stage:70,id:'aurora',name:'オーロラの氷標',story:'4つの灯りが氷海をつないだ。トリケンは冒険の思い出を持って、家へ帰る。',symbol:'❄'},
]);
export function expeditionProgress(entries,save,{practice=false}={}){
 let completed=0;
 if(!practice)for(const stage of entries){if(save.completed[stage.id]?.revision!==stage.revision)break;completed++;}
 completed=Math.min(20,completed);
 const stops=EXPEDITION_STOPS.map(stop=>({...stop,lit:completed>=stop.at,cost:5}));
 const lit=stops.filter(s=>s.lit),spent=lit.length*5;
 return {completed,earned:completed,spent,balance:completed-spent,lit:lit.length,stops,complete:completed===20,practice};
}
export function expeditionReward(entries,before,after,stage,options={}){
 const progress=expeditionProgress(entries,after,options);
 const first=!options.practice&&before.completed[stage.id]?.revision!==stage.revision&&after.completed[stage.id]?.revision===stage.revision;
 const old=expeditionProgress(entries,before,options);
 return {progress,crystals:first?1:0,newStops:progress.stops.filter(s=>s.lit&&!old.stops.find(x=>x.id===s.id)?.lit)};
}
