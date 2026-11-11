import test from 'node:test';
import assert from 'node:assert/strict';
import {newHome,TASKS} from '../src/puzzle/house.js';
import {renderLayeredScene,ART_PLACEMENTS} from '../src/house-layered-art.js';
import {renderFurnitureContact} from '../src/house-furniture-contact.js';

const objectRooms = {
  'home-living-2':'living',
  'home-kitchen-2':'kitchen',
  'home-bedroom-0':'bedroom',
  'home-bedroom-2':'bedroom'
};

test('subtle floor contacts are visible only for their own completed furniture',()=>{
  const base=newHome(), before=structuredClone(base);
  for(const [id,scene] of Object.entries(objectRooms)){
    const slot=TASKS.find(t=>t.id===id).slot;
    const rect=ART_PLACEMENTS[scene][slot];
    assert.equal(renderFurnitureContact(base,scene,id,rect),'');
    const complete=structuredClone(base);
    complete.home.done[id]=true;
    const contact=renderFurnitureContact(complete,scene,id,rect);
    assert.match(contact,new RegExp('data-furniture-contact="'+id+'"'));
    assert.match(contact,/pointer-events="none"/);
    assert.doesNotMatch(renderFurnitureContact(complete,'exterior',id,rect),/data-furniture-contact/);
    assert.match(renderLayeredScene(complete,scene),new RegExp('data-furniture-contact="'+id+'"'));
    complete.home.pending=id;
    assert.equal(renderFurnitureContact(complete,scene,id,rect),'');
  }
  assert.deepEqual(base,before);
});

test('the floor-contact effects do not add object nodes or change the save',()=>{
  const save=newHome(), original=structuredClone(save);
  const before=renderLayeredScene(save,'bedroom');
  assert.doesNotMatch(before,/data-furniture-contact=/);
  save.home.done['home-bedroom-0']=true;
  save.home.done['home-bedroom-2']=true;
  assert.equal((renderLayeredScene(save,'bedroom').match(/data-furniture-contact=/g)||[]).length,2);
  assert.equal((renderLayeredScene(save,'bedroom').match(/data-object=/g)||[]).length,3);
  assert.equal(save.version,original.version);
  assert.deepEqual(save.progress,original.progress);
});
