// Presentation-only floor contact, scoped to repaired freestanding furniture.
// Source art and 15 repairs remain unchanged. The shadows sit BEHIND each sprite.
const CONTACTS = Object.freeze({
  'home-living-2': {scene:'living', radius:35, depth:5, bottomInset:4},
  'home-kitchen-2': {scene:'kitchen', radius:30, depth:5, bottomInset:4},
  'home-bedroom-0': {scene:'bedroom', radius:102, depth:10, bottomInset:9},
  'home-bedroom-2': {scene:'bedroom', radius:31, depth:5, bottomInset:5},
});

export function renderFurnitureContact(save,scene,id,placement){
  const spec=CONTACTS[id];
  if(!spec || spec.scene!==scene || !save.home.done[id] || save.home.pending===id)return '';
  const [x,y,width,height]=placement;
  const centerX=x+width/2;
  const baseline=y+height-spec.bottomInset;
  // Neither ellipse is clickable or part of the editable repair ledger.
  return `<g data-furniture-contact="${id}" aria-hidden="true" pointer-events="none">
    <ellipse cx="${centerX}" cy="${baseline}" rx="${spec.radius}" ry="${spec.depth*1.35}"
      fill="#2c2231" opacity=".23" filter="url(#house-floor-shadow-blur)"/>
    <ellipse cx="${centerX}" cy="${baseline}" rx="${spec.radius*.77}" ry="${Math.max(2,spec.depth*.56)}"
      fill="#3c3031" opacity=".10"/>
  </g>`;
}
