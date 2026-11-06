import {ITEM_KEYS,validateStage} from './schema.js';
import {validateProgress,completePuzzle,buildTown} from './progress.js';
export function validateCampaign(campaign) {
  if(campaign?.version!==1||!Array.isArray(campaign.unlocks)||!Array.isArray(campaign.chapters))throw Error('Invalid campaign');
  const items=new Set(),projects=new Set();let previous=0;
  for(const event of campaign.unlocks) {
    if(!Number.isInteger(event.stageNumber)||event.stageNumber<=previous||!ITEM_KEYS.includes(event.item)||items.has(event.item)||projects.has(event.projectId)||!/^[a-z0-9-]+$/.test(event.projectId)||!Number.isInteger(event.cost)||event.cost<1)throw Error('Invalid unlock schedule');
    previous=event.stageNumber;items.add(event.item);projects.add(event.projectId);
  }
  let last=0;const ids=new Set();
  for(const c of campaign.chapters) {
    if(!Number.isInteger(c.firstStage)||c.firstStage!==last+1||!Number.isInteger(c.count)||c.count<1||ids.has(c.id))throw Error('Invalid chapter index');
    ids.add(c.id);last=c.firstStage+c.count-1;
  }
  return campaign;
}
export const itemsAvailableAt=(campaign,number)=>campaign.unlocks.filter(e=>e.stageNumber<=number).map(e=>e.item);
export const unlockedItems=(campaign,progress)=>campaign.unlocks.filter(e=>Object.hasOwn(progress.town,e.projectId)).map(e=>e.item);
export function validateChapterStage(campaign,chapter,stage) {
  validateStage(stage);
  const number=stage.chapter?.number,ordinal=number-chapter.firstStage+1;
  if(stage.chapter?.id!==chapter.id||!Number.isInteger(number)||ordinal<1||ordinal>chapter.count||chapter.stageIds[ordinal-1]!==stage.id)throw Error('Invalid chapter stage');
  const available=itemsAvailableAt(campaign,number);
  if(ITEM_KEYS.some(item=>stage.inventory[item]>0&&!available.includes(item)))throw Error('Item used before unlock');
  if(!available.includes('iceBlock')&&stage.iceSockets.length)throw Error('Ice socket before introduction');
  if(!available.includes('warpCrystal')&&stage.portals.length)throw Error('Portal before introduction');
  const intro=campaign.unlocks.find(e=>e.stageNumber===number);
  if(intro?.item!==stage.chapter.tutorialItem)throw Error('Tutorial schedule mismatch');
  if(intro&&!stage.inventory[intro.item])throw Error('Tutorial item unavailable');
  return stage;
}
export function canEnterChapterStage(chapter,progress,number) {
  if(!Number.isInteger(number)||number<chapter.firstStage||number>=chapter.firstStage+chapter.count)return false;
  const ordinal=number-chapter.firstStage;
  return [...(chapter.requires??[]),...chapter.stageIds.slice(0,ordinal)].every(id=>Object.hasOwn(progress.completed,id));
}
export function enterChapterStage(campaign,chapter,stage,progress,{preview=false,houseMode=false}={}) {
  validateCampaign(campaign);validateProgress(progress);validateChapterStage(campaign,chapter,stage);
  if(chapter.release==='draft'&&!preview)throw Error('Draft chapter requires preview mode');
  if(stage.status!=='approved'&&!preview)throw Error('Candidate stage requires preview mode');
  if(!canEnterChapterStage(chapter,progress,stage.chapter.number))throw Error('Stage locked');
  if(houseMode)return {progress:structuredClone(progress),events:[]};
  let next=structuredClone(progress);const events=[];
  // Entering the introductory stage rebuilds its town facility, before the
  // player uses the item. A replay or reload never spends stars twice.
  for(const event of campaign.unlocks.filter(e=>e.stageNumber<=stage.chapter.number)) {
    if(Object.hasOwn(next.town,event.projectId)&&next.town[event.projectId]!==event.cost)throw Error('Town event cost mismatch');
    if(!Object.hasOwn(next.town,event.projectId)) {
      next=buildTown(next,event.projectId,event.cost);events.push(event);
    }
  }
  if(ITEM_KEYS.some(item=>stage.inventory[item]>0&&!unlockedItems(campaign,next).includes(item)))throw Error('Item still locked');
  return {progress:next,events};
}
export function clearChapterStage(campaign,chapter,stage,progress,actions,options={}) {
  const entered=enterChapterStage(campaign,chapter,stage,progress,options);
  return {progress:completePuzzle(entered.progress,stage,actions,{allowCandidates:options.preview===true}),events:entered.events};
}
export const chapterSaveKey=(chapter,preview)=>`zurash-app:${preview?'chapter-preview':'adventure'}:${chapter.campaignId??chapter.id}:v1`;
