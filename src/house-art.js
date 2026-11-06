// Raster art, material definitions and decorative light are independent from
// interactive hit regions and the immutable repair/save model.
export const HOUSE_ASSETS=Object.freeze({
 landscape:'./assets/house/snow-clearing.webp',
 materials:'./assets/house/material-atlas.webp',
 belongings:'./assets/house/entry-belongings.webp',
 character:'./assets/triken-orange-80.png',
});
function tile(id,x,y,size=128,base='#cfbb94'){
 // Pattern viewBox crops the atlas directly. No nested svg: page CSS cannot
 // resize texture viewports, and preserveAspectRatio=none avoids letterboxing.
 return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}" viewBox="${x+.5} ${y+.5} 127 127" preserveAspectRatio="none" overflow="hidden"><rect x="${x}" y="${y}" width="128" height="128" fill="${base}"/><image href="${HOUSE_ASSETS.materials}" width="256" height="256"/></pattern>`;
}
export function artDefinitions(){return `
 ${tile('oak',0,0,140,'#bc8e57')}${tile('plaster',128,0,180,'#e9d4a8')}${tile('limestone',0,128,115,'#cfc2a5')}${tile('cedar',128,128,135,'#7c9e97')}
 <pattern id="hall-oak" x="0" y="359" patternUnits="userSpaceOnUse" width="240" height="400" viewBox=".5 .5 127 127" preserveAspectRatio="none" overflow="hidden"><rect width="128" height="128" fill="#ac8052"/><image href="${HOUSE_ASSETS.materials}" width="256" height="256"/></pattern>
 <clipPath id="hall-ceiling"><path d="M0 0h480v101l-74 47H74L0 101Z"/></clipPath>
 <linearGradient id="warm-glass" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#fff1b1"/><stop offset=".4" stop-color="#ecb365"/><stop offset="1" stop-color="#9d5e36"/></linearGradient>
 <linearGradient id="cold-glass" x2=".6" y2="1"><stop stop-color="#cee4e9"/><stop offset=".5" stop-color="#70989c"/><stop offset="1" stop-color="#345b69"/></linearGradient>
 <linearGradient id="metal" x2="1" y2=".5"><stop stop-color="#4f3927"/><stop offset=".22" stop-color="#ad7e43"/><stop offset=".5" stop-color="#ffdb8a"/><stop offset=".7" stop-color="#c2985c"/><stop offset="1" stop-color="#725133"/></linearGradient>
 <linearGradient id="blue-metal" x2="1" y2="1"><stop stop-color="#668e9e"/><stop offset=".3" stop-color="#314f62"/><stop offset="1" stop-color="#142d40"/></linearGradient>
 <linearGradient id="edge-shade" x2="1" y2=".5"><stop stop-color="#152c3c" stop-opacity=".48"/><stop offset=".15" stop-color="#203a46" stop-opacity="0"/><stop offset=".85" stop-color="#1d333f" stop-opacity="0"/><stop offset="1" stop-color="#142c3d" stop-opacity=".5"/></linearGradient>
 <linearGradient id="wall-light" x2=".6" y2="1"><stop stop-color="#ffecc5" stop-opacity=".34"/><stop offset=".46" stop-color="#fff7c8" stop-opacity="0"/><stop offset="1" stop-color="#413a39" stop-opacity=".3"/></linearGradient>
 <linearGradient id="ceiling-light" x2="0" y2="1"><stop stop-color="#876a4e"/><stop offset=".6" stop-color="#d5bc92"/><stop offset="1" stop-color="#ebd9b3"/></linearGradient>
 <linearGradient id="side-dark" x2="1" y2="0"><stop stop-color="#254153" stop-opacity=".5"/><stop offset="1" stop-color="#172c41" stop-opacity=".16"/></linearGradient>
 <linearGradient id="snow-edge" x2=".2" y2="1"><stop stop-color="#fffbea"/><stop offset=".4" stop-color="#e1f1f6"/><stop offset=".72" stop-color="#a3c8df"/><stop offset="1" stop-color="#729cb9"/></linearGradient>
 <linearGradient id="ice-glass" x2="1" y2="0"><stop stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#71c6e0" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
 <radialGradient id="amber-halo"><stop stop-color="#ffda87" stop-opacity=".62"/><stop offset=".45" stop-color="#ffc965" stop-opacity=".25"/><stop offset="1" stop-color="#f3ba67" stop-opacity="0"/></radialGradient>
 <radialGradient id="room-vignette"><stop offset=".48" stop-color="#4c3021" stop-opacity="0"/><stop offset="1" stop-color="#302638" stop-opacity=".32"/></radialGradient>
 <radialGradient id="leaf"><stop stop-color="#bad1a7"/><stop offset=".45" stop-color="#799d77"/><stop offset="1" stop-color="#3d6453"/></radialGradient>
 <pattern id="roof-tiles" width="26" height="24" patternUnits="userSpaceOnUse"><rect width="26" height="24" fill="#254b60"/><path d="M0 1h26v12q-13 10-26 0Z" fill="#3c6c7e"/><path d="M0 2h26M2 14q11 7 22 0" fill="none" stroke="#85a8ae" stroke-width="1"/><path d="M0 20h26" stroke="#152d42" stroke-width="2"/></pattern>
 <pattern id="rug-weave" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 1h5M1 0v5" stroke="#ecddac" stroke-width=".5" opacity=".32"/></pattern>
 <filter id="ground-shadow" x="-60%" y="-100%" width="220%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
 <filter id="deep-shadow" x="-35%" y="-35%" width="170%" height="185%"><feDropShadow dx="3" dy="7" stdDeviation="4" flood-color="#172b43" flood-opacity=".5"/></filter>
 <clipPath id="roof-clip"><path d="M48 219L199 109l151 105 82-56L276 55 124 162Z"/></clipPath>
 <clipPath id="hall-floor"><path d="M74 359h332l74 111v70H0v-70Z"/></clipPath>`;}
export const exteriorBackground=()=>`<g data-art-layer="landscape" pointer-events="none"><image href="${HOUSE_ASSETS.landscape}" x="0" y="0" width="480" height="540" preserveAspectRatio="xMidYMid slice"/><path d="M0 359Q100 321 209 354T480 346V540H0Z" fill="url(#snow-edge)" opacity=".27"/><ellipse cx="250" cy="408" rx="197" ry="42" fill="#243e66" opacity=".3" filter="url(#ground-shadow)"/></g>`;
export function roofFinish(){
 let a='<g data-art-layer="roof-material" pointer-events="none" clip-path="url(#roof-clip)"><path d="M0 0H480V250H0Z" fill="url(#roof-tiles)"/><path d="M199 100l151 114 90-60L275 49Z" fill="#132b46" opacity=".22"/><path d="M42 211L199 100 350 210l82-58" fill="none" stroke="#c6d8d8" stroke-opacity=".7" stroke-width="4"/></g>';
 a+='<path d="M43 211Q87 180 124 157L198 101Q202 95 207 102L352 205l72-53 9 5-80 60q-11 0-13-7L200 114 55 223q-12 4-12-12Z" fill="url(#snow-edge)" filter="url(#small-shadow)"/>';
 a+='<path d="M128 157L274 51q4-1 8 2l141 93-7 9-141-88-139 99Z" fill="url(#snow-edge)"/>';
 for(let n=0;n<8;n++){const x=60+n*13,y=220-n*9.5;a+=`<path d="M${x} ${y}l3 16 3-20Z" fill="url(#ice-glass)"/>`;}
 for(let n=0;n<5;n++){const x=270+n*15,y=167+n*10.5;a+=`<path d="M${x} ${y}l2 14 3-11Z" fill="url(#ice-glass)"/>`;}
 return a;
}
export function exteriorFinish(s){
 const fixed=s.home.done['home-entry-1'],door=s.home.done['home-entry-0'];
 let a='<g data-art-layer="weather-and-props" pointer-events="none">';
 a+='<path d="M56 392q59 7 98 0m109 2q45 4 81-2l70-43" fill="none" stroke="url(#snow-edge)" stroke-width="7" stroke-linecap="round"/>';
 a+='<path d="M0 491Q60 468 103 488m251-41q56-16 126-5" fill="none" stroke="#eef8fa" stroke-width="10" stroke-linecap="round"/>';
 // Individual slate pavers and snow rims follow the original southern path.
 for(let i=0;i<4;i++){const x=179-i*20,y=433+i*22,w=28+i*5;a+=`<path d="M${x} ${y}l${w} 2-12 14-${w} -1Z" fill="#a2aeb5" stroke="#6d8395" stroke-width="1.2"/><path d="M${x+1} ${y}l${w-2} 2" stroke="#f4f9f8" stroke-width="4" stroke-linecap="round"/>`;}
 a+='<g transform="translate(320 366)"><path d="M0 0h17v22H0Z" fill="url(#oak)" stroke="#6d5036"/><path d="M-4 0h25l-4-5H0Z" fill="#e4edf0"/><path d="M8-3V-22m0 8q-20-15-15-23 15 1 15 15 1-25 11-30 9 14-9 30 18-13 23-4-8 13-23 11" fill="url(#leaf)" stroke="#4a725f" stroke-width="1.5"/></g>';
 if(fixed){a+='<path d="M89 340q26 7 65-1" fill="none" stroke="#e7bc6e" stroke-width="3"/><ellipse cx="118" cy="348" rx="57" ry="30" fill="url(#amber-halo)"/>';}
 else {a+='<path d="M308 360l-9 21 12 20m-5-22l-10-8m12 11l10-9M71 390l-7-21m2 6l-10-8m11 14l7-9" fill="none" stroke="#7b7369" stroke-width="2"/><path d="M319 343l12 3-2 46-13-4Z" fill="#a5967e" stroke="#6d6b65"/><path d="M314 362l24 9" stroke="#777467" stroke-width="4"/>';}
 if(!door)a+='<path d="M140 438l32 6-8 5-36-8Zm171-17 23 4-3 6-25-5Z" fill="#806e56"/><circle cx="161" cy="443" r="1.5" fill="#3f4750"/>';
 // Deterministic fine ice glints, never a random asset that changes on reload.
 for(let i=0;i<22;i++){const x=(i*73+17)%480,y=470+(i*13)%69;a+=`<path d="M${x-1} ${y}h3m-1.5-1.5v3" stroke="#fff7db" stroke-width=".7" opacity="${.25+(i%3)*.2}"/>`;}
 return a+'</g>';
}
export function hallAtmosphere(s){
 let a='<g data-art-layer="ambient-light" pointer-events="none"><path d="M0 0H480V540H0Z" fill="url(#room-vignette)"/><path d="M326 264l-97 157 163 56-18-213Z" fill="#c6e6f2" opacity=".1"/>';
 if(s.home.done['home-entry-2'])a+='<ellipse cx="146" cy="230" rx="126" ry="155" fill="url(#amber-halo)" opacity=".55"/><ellipse cx="207" cy="391" rx="139" ry="48" fill="url(#amber-halo)" opacity=".45"/>';
 else a+='<path d="M0 0H480V540H0Z" fill="#344659" opacity=".08"/>';
 return a+'</g>';
}
export function doorHardware(done){
 let a='<g pointer-events="none">';
 for(const y of [31,107])a+=`<path d="M6 ${y}h13l5 4-5 4H6Z" fill="url(#metal)"/><circle cx="9" cy="${y+4}" r="1" fill="#5c4630"/><circle cx="17" cy="${y+4}" r="1" fill="#5c4630"/>`;
 if(done)a+='<path d="M10 134V43q2-29 30-34" fill="none" stroke="#fff1b8" stroke-width="1" opacity=".5"/>';
 return a+'</g>';
}
