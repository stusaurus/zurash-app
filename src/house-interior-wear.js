// Presentation-only wear layers. Each layer is tied to an existing paid repair.
// No progress, currency, area unlock or save schema changes.
export const INTERIOR_WEAR_REPAIRS = Object.freeze({
  living: 'ice-crane',           // repair floorboards
  kitchen: 'ice-workshop',      // repair counter and work wall
  bedroom: 'home-bedroom-1',    // replace damaged wall covering
});

const ART = Object.freeze({
  living: `<g data-wear-part="broken-floor" opacity=".93">
    <path d="M114 447l52-15 49 8 22-8 72 14-23 18-44 5-24-9-54 10-53-8Z" fill="#352f34" opacity=".71"/>
    <path d="M110 444l54-13 47 7 29-8 73 14-23 8-51-8-25 6-49-10-50 12Z" fill="#8b6046" opacity=".72"/>
    <path d="M112 442l53-9 46 7 28-7 70 11" stroke="#edbf80" stroke-width="3" stroke-linecap="round" fill="none" opacity=".65"/>
    <path d="M165 435l13 32m59-34 8 28m-98-7-14 6m157-10 24 8" stroke="#483d39" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/>
    <path d="M52 388l45-8 22 7-10 10-59 6Z M339 476l48-10 24 14-12 7-63-3Z" fill="#2c3239" opacity=".53"/>
    <path d="M55 389l42-6 18 5M343 477l45-8 19 12" stroke="#d9b18b" stroke-width="3" opacity=".67" fill="none"/>
    <path d="M219 474l19 4m-5 11 28-1m-164-20 14 4m277 29 19 6" stroke="#c9a47b" stroke-width="2" opacity=".45" fill="none"/>
  </g>`,
  kitchen: `<g data-wear-part="cracked-work-wall" opacity=".92">
    <path d="M205 169l44 10 12 22-14 19 28 22-11 33-45-12-26-25-14-34Z" fill="#68534b" opacity=".20"/>
    <path d="M208 173l26 25-9 22 29 19-13 28M255 183l-6 21 16 16-12 20m-48 10-14 20 5 17" stroke="#513d3c" stroke-width="4" stroke-linecap="round" fill="none" opacity=".72"/>
    <path d="M210 173l26 25-8 21 28 19-13 27M257 182l-6 21 16 17" stroke="#e5c3a6" stroke-width="2" stroke-linecap="round" fill="none" opacity=".58"/>
    <path d="M138 277l22-11 34 10-4 15-32 8-26-9Z M297 287l21-17 22 10-5 14-20 9Z" fill="#7c665c" opacity=".47"/>
    <path d="M140 276l21-10 34 10M297 285l21-16 23 11" stroke="#f1dbc0" stroke-width="2" fill="none" opacity=".47"/>
  </g>`,
  bedroom: `<g data-wear-part="torn-wallpaper" opacity=".94">
    <path d="M143 206l32-18 27 11-7 42-31 24-32-21Z M335 266l30-10 20 18-7 30-34 8-18-23Z" fill="#856858" opacity=".58"/>
    <path d="M144 205l31-16 23 12-8 35-29 19-24-14Z M337 264l27-8 18 18-7 27-30 8-15-22Z" fill="#3d343d" opacity=".47"/>
    <path d="M143 205l32-17 27 10-7 43-31 24M337 265l30-10 20 19-9 28" stroke="#e7bfa7" stroke-width="3" fill="none" opacity=".76"/>
    <path d="M151 224l11 12-4 19 18 18M348 276l15 8-3 22m-133-1 19-14 11 19-8 12" stroke="#342f3b" stroke-width="3" fill="none" opacity=".63"/>
    <path d="M147 298l19-12 31 6 5 13-32 10-20-4Z" fill="#71616a" opacity=".40"/>
  </g>`,
});

/** Wear belongs to a repairable surface, not the entire room or furniture. */
export function renderInteriorWear(save, scene) {
  const repair = INTERIOR_WEAR_REPAIRS[scene];
  if (!repair || save.home.done[repair]) return '';
  return '<g data-house-interior-wear="' + scene + '" data-wear-repair="' + repair + '" pointer-events="none" aria-hidden="true">' + ART[scene] + '</g>';
}

/** Tiny repair-finish accents that integrate the existing raster art into the cabin.
 * The wallpaper is deliberately framed as timber-bordered panels instead of
 * hiding or stretching the already-approved wallpaper variants.
 */
export function renderRepairedFinish(save, scene) {
  if (scene === 'bedroom' && save.home.done['home-bedroom-1']) {
    // Preserve the three approved motifs; each gains a matching understated inset.
    const selected = save.home.styles['home-bedroom-1'] ?? 0;
    const accent = ['#d9b784','#8fb9d5','#d0afe5'][selected] ?? '#d9b784';
    return `<g data-repaired-detail="bedroom-wall" data-repaired-style="${selected}" pointer-events="none" aria-hidden="true" opacity=".94">
      <defs><linearGradient id="house-repair-oak-trim" x1="0" y1="0" x2=".9" y2="1">
        <stop stop-color="#6a4939"/><stop offset=".5" stop-color="#b28457"/><stop offset="1" stop-color="#674435"/>
      </linearGradient></defs>
      <!-- Upper beams align the new finish with the existing timber architecture.
           All elements stay outside the central window and are display-only. -->
      <path d="M108 82h66v9h-66Z M390 82h45v9h-45Z" fill="url(#house-repair-oak-trim)" stroke="#53382f" stroke-width="1"/>
      <path d="M112 84h59M394 84h39" stroke="${accent}" stroke-width="1.5" opacity=".74"/>
      <path d="M167 89h7v128h-7Z M390 89h7v128h-7Z" fill="url(#house-repair-oak-trim)" opacity=".91"/>
      <path d="M170 94v119M393 94v119" stroke="${accent}" stroke-width="1.4" opacity=".5"/>
      <path d="M170 216h223l1 13H171Z" fill="#362e30" opacity=".6"/>
      <path d="M170 216h223v9H170Z" fill="url(#house-repair-oak-trim)"/>
      <path d="M173 218H390" stroke="${accent}" opacity=".67" stroke-width="1.5"/>
      <path d="M170 222v75h6v-75m213 0v75h6v-75" fill="url(#house-repair-oak-trim)" stroke="#593c35" stroke-width="1"/>
      <path d="M174 231v61M392 232v61" stroke="${accent}" stroke-width="1.5" opacity=".65"/>
      <path d="M111 295h325v7H111Z" fill="#623d32" opacity=".8"/>
      <path d="M113 296h322" stroke="${accent}" stroke-width="1.6" opacity=".59"/>
    </g>`;
  }
  if (scene === 'kitchen' && save.home.done['ice-workshop']) {
    // The restored counter should sit on the timber floor, not appear pasted on.
    // This shadow is rendered behind the cabinet sprite, not over the furniture.
    return `<g data-repaired-detail="kitchen-counter-contact" pointer-events="none" aria-hidden="true">
      <ellipse cx="212" cy="390" rx="113" ry="12" fill="#352e36" opacity=".16"/>
      <ellipse cx="212" cy="389" rx="94" ry="7" fill="#51403a" opacity=".10"/>
    </g>`;
  }
  return '';
}
