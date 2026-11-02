import {expeditionProgress} from './puzzle/expedition.js';
export function renderExpedition(element,entries,save,options={}){
 const progress=expeditionProgress(entries,save,options);
 element.replaceChildren();
 const title=document.createElement('p');title.className='expedition-caption';
 title.textContent=options.practice?'自由試遊の旅：冒険の結晶は通常モードで集めよう。':`道しるべの結晶 ${progress.earned}/20個 ／ 灯り ${progress.lit}/4か所`;
 element.append(title);
 const route=document.createElement('ol');route.className='expedition-route';route.setAttribute('aria-label','氷海の道しるべ');
 for(const stop of progress.stops){
  const item=document.createElement('li');item.dataset.lit=String(stop.lit);
  const light=document.createElement('span');light.className='expedition-light';light.textContent=stop.lit?stop.symbol:'◇';light.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.textContent=stop.name;
  const status=document.createElement('small');status.textContent=stop.lit?'灯りがともった':`${stop.stage}面で点灯`;
  item.append(light,name,status);route.append(item);
 }
 element.append(route);
 const note=document.createElement('p');note.className='expedition-note';
 note.textContent=progress.complete?'第2章クリア！ 4つの灯りが、帰り道を照らしている。':options.practice?'練習してから冒険へ出発しよう。':'初クリアで結晶を1個。5個集まるごとに道しるべが灯る。';
 element.append(note);return progress;
}
