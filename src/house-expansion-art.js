import {accessibleHouseAreas} from './puzzle/house.js';

// Progressive reveal using the already approved painted exterior.
// Dormant rooms are encased in translucent snow; completing a room and reaching
// the milestone clears that snow to reveal the original, matching artwork.
// No alternate image sets, star charges, or changes to v2 persistence.
export const EXTERIOR_GROWTH_ORDER=Object.freeze(['living','kitchen','bedroom','garden']);

const defs=`<defs>
 <radialGradient id="growth-fog">
  <stop stop-color="#fffef7" stop-opacity=".94"/>
  <stop offset=".28" stop-color="#e2f1f7" stop-opacity=".78"/>
  <stop offset=".57" stop-color="#d0e8f2" stop-opacity=".48"/>
  <stop offset="1" stop-color="#d3e9f4" stop-opacity="0"/>
 </radialGradient>
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
  <ellipse cx="88" cy="343" rx="87" ry="92" fill="url(#growth-fog)"/>
  <path d="M31 312q28-25 56-18t57 11m-110 91q48 15 105-1" stroke="url(#growth-snow-rim)" stroke-width="7" stroke-opacity=".43" stroke-linecap="round" fill="none"/>
  <path d="M55 325q24-16 46 4m-43 39q21-12 44 3" stroke="#f9feff" stroke-width="3" opacity=".42" fill="none"/>
  <path d="M80 326v43m-17-28 35 18m-33 2 34-28" stroke="#c3e5ef" stroke-width="2" opacity=".42" fill="none"/>
 </g>`,
 kitchen:`<g data-house-sealed-area="kitchen" pointer-events="none">
  <ellipse cx="435" cy="343" rx="76" ry="101" fill="url(#growth-fog)"/>
  <path d="M389 287q43-34 87-27m-85 140q40 13 86-4" stroke="url(#growth-snow-rim)" stroke-opacity=".43" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M399 325q27-15 58 3m-58 40q31 14 61-4" stroke="#f8feff" stroke-width="3" opacity=".42" fill="none"/>
  <path d="M433 315v50m-20-36 39 18m-40 12 40-33" stroke="#b9dfea" stroke-width="2" opacity=".42" fill="none"/>
 </g>`,
 bedroom:`<g data-house-sealed-area="bedroom" pointer-events="none">
  <ellipse cx="341" cy="167" rx="89" ry="81" fill="url(#growth-fog)"/>
  <path d="M303 176q30-48 54-40t42 56" stroke="url(#growth-snow-rim)" stroke-width="7" stroke-opacity=".41" stroke-linecap="round" fill="none"/>
  <path d="M320 172q25-12 43 9" stroke="#f8feff" stroke-width="3" opacity=".47" fill="none"/>
  <path d="M340 151v42m-20-28 41 18m-39 7 40-30" stroke="#b9e1ed" stroke-width="2" opacity=".42" fill="none"/>
 </g>`,
 garden:`<g data-house-sealed-area="garden" pointer-events="none">
  <ellipse cx="438" cy="425" rx="88" ry="100" fill="url(#growth-fog)"/>
  <path d="M391 386q30-23 83-11m-77 87q44 22 82 14" stroke="url(#growth-snow-rim)" stroke-width="7" stroke-opacity=".43" stroke-linecap="round" fill="none"/>
  <path d="M412 402q19 14 45 1m-51 32q26-14 52 9" stroke="#f7fdff" stroke-width="3" opacity=".45" fill="none"/>
  <path d="M439 394v58m-22-42 45 27m-45 5 44-40" stroke="#b5dce7" stroke-width="2" opacity=".42" fill="none"/>
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
