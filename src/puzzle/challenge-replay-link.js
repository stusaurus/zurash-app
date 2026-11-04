// A replay link for the stage being viewed. No move history, saved identity or
// individual player's unlock is ever encoded in the URL.
// Chapter-two invites always go to separate practice storage, not campaign.
const RESEARCH_PAGES=new Set([
 'fun-lab.html','long-lab.html','item-lab.html','item-long-lab.html',
 'dual-item-lab.html','gate-lab.html','gate-long-lab.html',
 'gate-cycle-lab.html','gate-closure-lab.html','gate-warp-lab.html',
 'gate-glove-lab.html','stage54-remix-lab.html','stage57-remix-lab.html',
 'stage59-return-lab.html','stage70-finale-lab.html'
]);

export function challengeReplayPath({page,stageNumber,index,adventureMode=false}={}){
 if(adventureMode){
  if(page!=='chapter-two.html'||!Number.isSafeInteger(stageNumber)||
    stageNumber<51||stageNumber>70)throw Error('Invalid adventure challenge');
  return './chapter-two.html?trial=1&practice=1&replay=1&stage='+stageNumber;
 }
 if(!RESEARCH_PAGES.has(page)||!Number.isSafeInteger(index)||index<1||index>10)
  throw Error('Invalid research challenge');
 return './'+page+'?stage='+index;
}

export function shareableChallengeUrl(currentUrl,relativePath){
 if(typeof currentUrl!=='string'||typeof relativePath!=='string'||
    !/^\.\/[a-z0-9-]+\.html\?(?:stage=\d+|trial=1&practice=1&replay=1&stage=\d+)$/.test(relativePath))
  return null;
 let location;
 try{location=new URL(currentUrl);}catch{return null;}
 // A ZIP preview uses loopback HTTP. Never put that unopenable address in a
 // public shared message. A published HTTPS site can use its own live origin.
 // Never copy ephemeral HTTPS preview links. Only the designated
 // GitHub Pages origin and repo path can issue public invitation URLs.
 // Pages is not enabled yet; this becomes usable only after a real deploy.
 if(location.origin!=='https://stusaurus.github.io'||
    !location.pathname.startsWith('/zurash-app/')||
    location.username||location.password)
  return null;
 const url=new URL(relativePath,location);
 if(url.origin!==location.origin)return null;
 return url.href;
}
