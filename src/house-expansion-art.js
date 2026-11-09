import {accessibleHouseAreas} from './puzzle/house.js';

// Progressive reveal using the already approved painted exterior.
// Dormant rooms are encased in translucent snow; completing a room and reaching
// the milestone clears that snow to reveal the original, matching artwork.
// No alternate image sets, star charges, or changes to v2 persistence.
export const EXTERIOR_GROWTH_ORDER=Object.freeze(['living','kitchen','bedroom','garden']);

const defs=`<defs>
 <linearGradient id="growth-frost" x2=".3" y2="1">
  <stop stop-color="#fffef7" stop-opacity=".94"/>
  <stop offset=".34" stop-color="#d5ecf5" stop-opacity=".9"/>
  <stop offset=".83" stop-color="#a7d5e4" stop-opacity=".79"/>
  <stop offset="1" stop-color="#e8f5f9" stop-opacity=".94"/>
 </linearGradient>
 <linearGradient id="growth-snow-rim" x2=".1" y2="1">
  <stop stop-color="#fffdf5"/><stop offset=".6" stop-color="#dceef4"/><stop offset="1" stop-color="#a7ccd9"/>
 </linearGradient>
 <radialGradient id="growth-thaw">
  <stop stop-color="#ffd183" stop-opacity=".4"/>
  <stop offset=".54" stop-color="#ffd08d" stop-opacity=".2"/>
  <stop offset="1" stop-color="#ffd08d" stop-opacity="0"/>
 </radialGradient>
 </defs>`;
const sealed={
 living:`<g data-house-sealed-area="living" pointer-events="none">
  <path d="M20 305Q48 271 75 280L153 295Q162 339 149 404Q77 422 18 405Z" fill="url(#growth-frost)"/>
  <path d="M20 307q52-46 132-10m-128 106q66 18 122-3" stroke="url(#growth-snow-rim)" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M41 326q31-18 52 3t48-6M49 365q23-17 44 3t37-7" stroke="#e7f8fb" stroke-opacity=".8" stroke-width="5" fill="none"/>
  <path d="M78 311v58m-22-35 42 19m-41 8 40-28" stroke="#b4dce7" stroke-opacity=".8" stroke-width="2" fill="none"/>
 </g>`,
 kitchen:`<g data-house-sealed-area="kitchen" pointer-events="none">
  <path d="M380 268q29-29 61-38l39 17v162q-51 13-94-6Z" fill="url(#growth-frost)"/>
  <path d="M381 273q47-43 96-21m-89 150q41 12 91-3" stroke="url(#growth-snow-rim)" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M405 304q23 18 52-7M398 341q34-15 70 3M405 380q30 10 61-5" stroke="#f3fdff" stroke-opacity=".85" stroke-width="5" fill="none"/>
  <path d="M431 320v59m-19-43 37 19m-39 8 40-37" stroke="#abd8e4" stroke-opacity=".75" stroke-width="2" fill="none"/>
 </g>`,
 bedroom:`<g data-house-sealed-area="bedroom" pointer-events="none">
  <path d="M282 173Q308 112 353 111Q379 127 408 199L401 227Q337 218 285 205Z" fill="url(#growth-frost)"/>
  <path d="M288 175q52-82 91-25l24 45m-114 10q45 13 110 11" stroke="url(#growth-snow-rim)" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M321 168q22-20 40 8m-61 17q29-20 69 2" stroke="#f3fcfe" stroke-opacity=".83" stroke-width="5" fill="none"/>
  <path d="M341 151v51m-24-31 48 13m-47 7 46-30" stroke="#abd2df" stroke-opacity=".75" stroke-width="2" fill="none"/>
 </g>`,
 garden:`<g data-house-sealed-area="garden" pointer-events="none">
  <path d="M386 367Q431 340 481 355V510Q430 505 385 471Z" fill="url(#growth-frost)"/>
  <path d="M389 366q48-26 89-7m-90 105q43 39 93 26" stroke="url(#growth-snow-rim)" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M407 386q18 23 46 3m-55 40q34-19 73 9m-51 31 38-20" stroke="#f3fcff" stroke-opacity=".85" stroke-width="5" fill="none"/>
  <path d="M443 381v81m-24-56 47 22m-47 12 46-40" stroke="#b2d9e3" stroke-opacity=".74" stroke-width="2" fill="none"/>
 </g>`,
};
const revealed={
 living:`<g data-house-growth-area="living" pointer-events="none">
  <ellipse cx="93" cy="341" rx="78" ry="75" fill="url(#growth-thaw)"/>
  <path d="M39 312q55-25 105-4" stroke="#ffe5ab" stroke-width="4" opacity=".56" fill="none" stroke-linecap="round"/>
  <path d="M52 400q45 9 89-3" stroke="#ffe6bb" stroke-width="3" opacity=".55" fill="none"/>
 </g>`,
 kitchen:`<g data-house-growth-area="kitchen" pointer-events="none">
  <ellipse cx="433" cy="344" rx="68" ry="88" fill="url(#growth-thaw)"/>
  <path d="M387 298q44-38 91-27" stroke="#ffe6b2" stroke-width="4" opacity=".58" fill="none" stroke-linecap="round"/>
  <path d="M393 396q36 8 84 0" stroke="#ffe5ae" stroke-width="3" opacity=".55" fill="none"/>
 </g>`,
 bedroom:`<g data-house-growth-area="bedroom" pointer-events="none">
  <ellipse cx="340" cy="177" rx="74" ry="65" fill="url(#growth-thaw)"/>
  <path d="M337 130l4 12 11 4-11 4-4 12-4-12-11-4 11-4Z" fill="#fff4be" opacity=".82"/>
  <circle cx="382" cy="181" r="3" fill="#fff6c8" opacity=".9"/>
 </g>`,
 garden:`<g data-house-growth-area="garden" pointer-events="none">
  <ellipse cx="439" cy="430" rx="71" ry="76" fill="url(#growth-thaw)"/>
  <path d="M403 443q28-16 65-6" stroke="#fff1c1" opacity=".65" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M438 396l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff1b7" opacity=".86"/>
 </g>`,
};

export function renderExteriorGrowth(save){
 const opened=new Set(accessibleHouseAreas(save));
 const revealedAreas=EXTERIOR_GROWTH_ORDER.filter(area=>opened.has(area));
 const layers=EXTERIOR_GROWTH_ORDER.map(area=>opened.has(area)?revealed[area]:sealed[area]).join('');
 return `<g data-art-layer="house-growth" pointer-events="none" data-growth-count="${revealedAreas.length}">${defs}${layers}</g>`;
}
