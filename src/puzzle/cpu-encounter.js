// Optional Chapter Two rival encounters. No new unlocks, rewards or save keys.
// The first battle after a milestone is an invitation, never a progression gate.
// All navigation destinations are fixed here; URL parameters cannot redirect
// players to arbitrary sites or bypass the usual chapter-two save validator.
const ENCOUNTERS=Object.freeze({
 60:Object.freeze({level:'practice',name:'氷海のライバルと腕試し'}),
 70:Object.freeze({level:'normal',name:'冒険のあとにライバルへ挑戦'})
});
const flag=value=>value===true;

export function cpuEncounterForClear(number,{practice=false,tapFirst=false}={}){
 if(!Number.isInteger(number)||!Object.hasOwn(ENCOUNTERS,number))return null;
 const milestone=ENCOUNTERS[number];
 const query=new URLSearchParams({cpu:milestone.level,from:String(number)});
 if(flag(practice))query.set('practice','1');
 if(flag(tapFirst))query.set('tap','1');
 return Object.freeze({
  stage:number,level:milestone.level,
  label:'⚔ おまけ：'+milestone.name+'（勝たなくても先へ進める）',
  href:'./duel-boss.html?'+query.toString()
 });
}

export function returnFromCpuEncounter(search){
 const params=search instanceof URLSearchParams?search:new URLSearchParams(search);
 const value=params.get('from');
 if(value!=='60'&&value!=='70')return null;
 const stage=Number(value),practice=params.get('practice')==='1',tapFirst=params.get('tap')==='1';
 if(stage===70&&!practice){
  return Object.freeze({
   stage,practice,tapFirst,
   href:'./adventure.html?view=expedition',
   label:'トリケンの家で冒険をふり返る'
  });
 }
 const next=stage===60?61:70;
 const query=new URLSearchParams({trial:'1'});
 if(practice)query.set('practice','1');
 query.set('stage',String(next));
 if(tapFirst)query.set('tap','1');
 return Object.freeze({
  stage,practice,tapFirst,
  href:'./chapter-two.html?'+query.toString(),
  label:stage===60?'第61面へ進む':'第70面の自由試遊に戻る'
 });
}
