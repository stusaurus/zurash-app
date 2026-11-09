import {accessibleHouseAreas} from './puzzle/house.js';

// Small, additive architectural reveals over the approved painted house shell.
// These overlays do not replace the original image or change the v2 save.
// Placement is in the same 480x540 coordinates as house-layered-art.js.
export const EXTERIOR_GROWTH_ORDER=Object.freeze(['living','kitchen','bedroom','garden']);

const defs=String.raw\`<defs>
 <linearGradient id="growth-timber" x2=".14" y2="1"><stop stop-color="#e9bd7b"/><stop offset=".45" stop-color="#b9854c"/><stop offset="1" stop-color="#73523a"/></linearGradient>
 <linearGradient id="growth-roof" x2=".2" y2="1"><stop stop-color="#8fb3bd"/><stop offset=".4" stop-color="#496d80"/><stop offset="1" stop-color="#263b58"/></linearGradient>
 <linearGradient id="growth-glass" x2=".1" y2="1"><stop stop-color="#fff5bd"/><stop offset=".6" stop-color="#e3ac64"/><stop offset="1" stop-color="#9f6b42"/></linearGradient>
 <linearGradient id="growth-snow" x2="0" y2="1"><stop stop-color="#fffdf1"/><stop offset=".65" stop-color="#edf6fa"/><stop offset="1" stop-color="#b8d4df"/></linearGradient>
 <radialGradient id="growth-warmth"><stop stop-color="#ffd27e" stop-opacity=".46"/><stop offset="1" stop-color="#ffcd79" stop-opacity="0"/></radialGradient>
 <filter id="growth-shadow" x="-35%" y="-35%" width="170%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#283e53" flood-opacity=".38"/></filter>
 </defs>\`;

const modules={
 living:String.raw\`<g data-house-growth-area="living" filter="url(#growth-shadow)">
  <path d="M25 314 69 284 144 302 144 397 26 403Z" fill="url(#growth-timber)" stroke="#7d593d" stroke-width="3"/>
  <path d="M23 316 67 284 67 401 24 406Z" fill="#926b49" opacity=".62"/>
  <path d="M29 322H136M33 395H140M70 290v111M139 310v89" fill="none" stroke="#f3cc8b" stroke-width="4" opacity=".72"/>
  <path d="M19 312 65 271 148 294 147 312 67 289 21 328Z" fill="url(#growth-roof)" stroke="#5e6472" stroke-width="3"/>
  <path d="M20 306Q45 275 64 270L145 292l6 10-84-20-47 36Z" fill="url(#growth-snow)" stroke="#d5e7ed" stroke-width="3"/>
  <path d="M22 314q7 12 6 20m25-34q5 14 1 22m64-21q-4 15-1 29" fill="none" stroke="#e7f7fb" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="105" cy="356" rx="42" ry="59" fill="url(#growth-warmth)"/>
  <rect x="79" y="328" width="43" height="61" rx="7" fill="#704b37" stroke="#e9ba7a" stroke-width="5"/>
  <rect x="85" y="335" width="31" height="47" rx="3" fill="url(#growth-glass)" stroke="#fff0c0" stroke-width="2"/>
  <path d="M101 335v47M85 356h31" stroke="#85613e" stroke-width="4"/>
  <path d="M79 390h45" stroke="#f4d6a1" stroke-width="7" stroke-linecap="round"/>
  <path d="M30 399Q76 390 141 399" stroke="url(#growth-snow)" stroke-width="11" stroke-linecap="round" fill="none"/>
 </g>\`,
 kitchen:String.raw\`<g data-house-growth-area="kitchen" filter="url(#growth-shadow)">
  <path d="M382 290 441 251 480 264v136l-96 4Z" fill="url(#growth-timber)" stroke="#7d563d" stroke-width="4"/>
  <path d="M439 255v147M384 303l56-42M392 397l85-1" fill="none" stroke="#eec78a" stroke-width="4" opacity=".8"/>
  <path d="M380 291 438 242 481 254v19l-41-15-60 49Z" fill="url(#growth-roof)" stroke="#5b6678" stroke-width="3"/>
  <path d="M379 288q30-23 59-49l43 13v15l-43-17-55 49Z" fill="url(#growth-snow)" stroke="#d2e7ef" stroke-width="3"/>
  <path d="M388 300q3 14-1 22m58-62q3 18-3 31" stroke="#f1fcfd" stroke-width="5" stroke-linecap="round" fill="none"/>
  <ellipse cx="439" cy="350" rx="48" ry="64" fill="url(#growth-warmth)"/>
  <path d="M406 318h52v64h-52Z" fill="#654936" stroke="#e1b985" stroke-width="6"/>
  <path d="M411 322h43v55h-43Z" fill="url(#growth-glass)"/>
  <path d="M433 322v56m-22-29h43" stroke="#8e6744" stroke-width="4"/>
  <path d="M400 386h64M384 401q45-10 95 0" stroke="url(#growth-snow)" stroke-width="8" fill="none" stroke-linecap="round"/>
 </g>\`,
 bedroom:String.raw\`<g data-house-growth-area="bedroom" filter="url(#growth-shadow)">
  <path d="M300 193 329 130 368 131 392 194v19h-91Z" fill="url(#growth-timber)" stroke="#71543f" stroke-width="4"/>
  <path d="M300 192 324 137q17-24 30-6l39 62-11 8-31-57-20-3-21 64Z" fill="url(#growth-roof)" stroke="#485e71" stroke-width="4"/>
  <path d="M296 187 321 136q14-24 31-16l42 66-5 14-39-60q-9-10-22 3l-23 58Z" fill="url(#growth-snow)" stroke="#eaf8fb" stroke-width="4"/>
  <path d="M308 192q4 15 0 25m75-23q-5 15-1 24" fill="none" stroke="#e7f7fb" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="345" cy="178" rx="32" ry="40" fill="url(#growth-warmth)"/>
  <circle cx="346" cy="172" r="22" fill="#7a533b" stroke="#e0b680" stroke-width="6"/>
  <circle cx="346" cy="172" r="16" fill="url(#growth-glass)" stroke="#fbe7ac" stroke-width="2"/>
  <path d="M346 156v32m-16-16h32" stroke="#8f6946" stroke-width="4"/>
  <path d="M300 211q45-8 91 0" stroke="url(#growth-snow)" stroke-width="10" stroke-linecap="round"/>
 </g>\`,
 garden:String.raw\`<g data-house-growth-area="garden" filter="url(#growth-shadow)">
  <path d="M395 433q29-50 82-36" stroke="#4c685c" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M402 438v-56q26-29 64 0v58" fill="none" stroke="#835f45" stroke-width="10" stroke-linejoin="round"/>
  <path d="M399 383q30-38 70-1" stroke="url(#growth-snow)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M404 405q16-23 24 0t37-5" stroke="#64937c" stroke-width="5" fill="none"/>
  <circle cx="413" cy="393" r="5" fill="#fbe5a5"/><circle cx="451" cy="395" r="5" fill="#ffe8a9"/>
  <path d="M395 445q32-13 81-5M412 469q23-9 58-3" fill="none" stroke="url(#growth-snow)" stroke-width="13" stroke-linecap="round"/>
  <path d="M417 450l-5 15m46-23 6 19" stroke="#87a1b0" stroke-width="3"/>
  <path d="M408 397q-12-18-19-8m56 4q16-22 27-18" stroke="#8db2a0" stroke-width="6" fill="none" stroke-linecap="round"/>
 </g>\`,
};

export function renderExteriorGrowth(save){
 const visible=new Set(accessibleHouseAreas(save));
 const parts=EXTERIOR_GROWTH_ORDER.filter(area=>visible.has(area)).map(area=>modules[area]).join('');
 return \`<g data-art-layer="house-growth" pointer-events="none" data-growth-count="\${EXTERIOR_GROWTH_ORDER.filter(area=>visible.has(area)).length}">\${defs}\${parts}</g>\`;
}
