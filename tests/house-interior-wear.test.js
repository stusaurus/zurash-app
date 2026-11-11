import test from 'node:test';
import assert from 'node:assert/strict';
import {newHome,TASKS} from '../src/puzzle/house.js';
import {INTERIOR_WEAR_REPAIRS,renderInteriorWear,renderRepairedFinish} from '../src/house-interior-wear.js';
import {renderLayeredScene} from '../src/house-layered-art.js';

test('interior wear is attached to exactly one existing repair per room',()=>{
  const save=newHome(),unchanged=structuredClone(save);
  assert.deepEqual(Object.keys(INTERIOR_WEAR_REPAIRS),['living','kitchen','bedroom']);
  for(const [scene,id] of Object.entries(INTERIOR_WEAR_REPAIRS)){
    assert.ok(TASKS.some(t=>t.id===id && t.area===scene));
    const art=renderLayeredScene(save,scene);
    assert.match(art,new RegExp('data-house-interior-wear="'+scene+'"'));
    assert.match(art,new RegExp('data-wear-repair="'+id+'"'));
    assert.match(art,/pointer-events="none" aria-hidden="true"/);
    const repaired=structuredClone(save);
    repaired.home.done[id]=true;
    assert.equal(renderInteriorWear(repaired,scene),'');
    assert.doesNotMatch(renderLayeredScene(repaired,scene),/data-house-interior-wear=/);
  }
  assert.equal(renderInteriorWear(save,'entry'),'');
  assert.equal(renderInteriorWear(save,'garden'),'');
  assert.doesNotMatch(renderLayeredScene(save,'exterior'),/data-house-interior-wear=/);
  assert.deepEqual(save,unchanged);
});

test('unrelated repairs do not remove the remaining damaged wall or floor',()=>{
  const save=newHome();
  save.home.done[INTERIOR_WEAR_REPAIRS.living]=true;
  assert.doesNotMatch(renderLayeredScene(save,'living'),/data-house-interior-wear=/);
  assert.match(renderLayeredScene(save,'kitchen'),/data-house-interior-wear="kitchen"/);
  assert.match(renderLayeredScene(save,'bedroom'),/data-house-interior-wear="bedroom"/);
  assert.equal(save.version,2);
});

test('repaired wallpaper obtains a timber junction and cabinet stays grounded',()=>{
  const save=newHome();
  assert.equal(renderRepairedFinish(save,'bedroom'),'');
  assert.equal(renderRepairedFinish(save,'kitchen'),'');
  save.home.done['home-bedroom-1']=true;
  const trim=renderLayeredScene(save,'bedroom');
  assert.match(trim,/data-repaired-detail="bedroom-wall"/);
  assert.match(trim,/house-repair-oak-trim/);
  assert.match(trim,/pointer-events="none" aria-hidden="true"/);
  assert.doesNotMatch(trim,/data-house-interior-wear="bedroom"/);
  save.home.done['ice-workshop']=true;
  const counter=renderLayeredScene(save,'kitchen');
  assert.match(counter,/data-repaired-detail="kitchen-counter-contact"/);
  assert.doesNotMatch(counter,/data-house-interior-wear="kitchen"/);
  assert.doesNotMatch(renderLayeredScene(save,'living'),/data-repaired-detail=/);
  assert.equal(save.version,2);
});
