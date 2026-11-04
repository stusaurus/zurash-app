import {expeditionAlbum} from './puzzle/expedition-album.js';

// Small four-part memory album. DOM is built with textContent to keep all stage
// titles and progress text inert; no navigation occurs without a user click.
export function renderExpeditionAlbum(element,entries,save){
 const album=expeditionAlbum(entries,save);
 element.replaceChildren();
 element.className='expedition-album';
 const heading=document.createElement('h3');
 heading.textContent='4つの道しるべ・冒険アルバム';
 const summary=document.createElement('p');
 summary.id='expedition-album-progress';
 summary.className='expedition-album-progress';
 summary.textContent='冒険 '+album.completed+'/20面クリア ／ Sランク '+album.sRanks+'/20面';
 const note=document.createElement('p');
 note.className='expedition-album-hint';
 note.textContent=album.complete?'冒険は完結！ 今度は自分の記録を越えてみよう。':'灯りをともした区間は、思い出を開いて振り返れるよ。';
 const grid=document.createElement('div');
 grid.className='expedition-album-grid';
 for(const stop of album.milestones){
  const card=document.createElement('details');
  card.className='expedition-album-card';
  card.dataset.albumStop=stop.id;
  card.dataset.lit=String(stop.lit);
  const title=document.createElement('summary');
  title.textContent=(stop.lit?'✦ ':'◇ ')+stop.name+'（'+stop.cleared+'/5面）';
  const rank=document.createElement('p');
  rank.className='expedition-album-rank';
  rank.textContent='Sランク '+stop.sRanks+'/5面';
  const story=document.createElement('p');
  story.className='expedition-album-story';
  story.textContent=stop.story??'まだ灯りはともっていない。5つのステージを進めよう。';
  card.append(title,rank,story);
  if(stop.nextStage!==null){
   const link=document.createElement('a');
   link.href='./chapter-two.html?trial=1&stage='+encodeURIComponent(stop.nextStage);
   link.className='expedition-album-replay';
   link.textContent=stop.nextAction+'：'+stop.nextStage+'面「'+stop.nextTitle+'」';
   card.append(link);
  }
  grid.append(card);
 }
 element.append(heading,summary,note,grid);
 return album;
}
