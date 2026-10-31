// Research-only solo rules. Existing two-player serialization is untouched.
import { dimensions, isPlayable } from '../geometry.js';
export const RULES_VERSION = 'solo-v1';
export const ITEM_KEYS = ['iceBlock', 'powerGlove', 'warpCrystal'];
const fail = message => { throw Error(`Invalid puzzle: ${message}`); };
export function validateStage(stage) {
  if (!stage || stage.schemaVersion !== 1 || stage.rulesVersion !== RULES_VERSION) fail('version');
  if (typeof stage.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(stage.id)) fail('id');
  if (!Number.isInteger(stage.revision) || stage.revision < 1) fail('revision');
  if (!['candidate','approved'].includes(stage.status)) fail('status');
  if (!stage.board || stage.board.width === undefined || stage.board.height === undefined) fail('board');
  const {width,height} = dimensions(stage.board);
  const board = {width,height,playableCells:stage.board.playableCells};
  if (board.playableCells !== undefined && (!Array.isArray(board.playableCells) || !board.playableCells.length || new Set(board.playableCells).size !== board.playableCells.length || board.playableCells.some(c=>!Number.isInteger(c)||c<0||c>=width*height))) fail('mask');
  const cells = name => {
    const list=stage[name];
    if (!Array.isArray(list) || new Set(list).size!==list.length || list.some(c=>!isPlayable(board,c))) fail(name);
    return list;
  };
  const walls=cells('walls'),stars=cells('stars'),fixed=cells('fixed'),sockets=cells('iceSockets');
  if (!isPlayable(board,stage.start) || stars.length<1 || stars.length>8) fail('start/stars');
  const occupied=[stage.start,...walls,...stars,...fixed];
  if (new Set(occupied).size!==occupied.length) fail('overlapping objects');
  if (sockets.some(c=>occupied.includes(c))) fail('occupied socket');
  if (!Array.isArray(stage.portals) || stage.portals.some(p=>!Array.isArray(p)||p.length!==2||p[0]===p[1]||p.some(c=>!isPlayable(board,c)||occupied.includes(c)||sockets.includes(c)))) fail('portals');
  const portals=stage.portals.flat();
  if(new Set(portals).size!==portals.length) fail('overlapping portals');
  if (!stage.inventory || Object.keys(stage.inventory).some(k=>!ITEM_KEYS.includes(k)) || ITEM_KEYS.some(k=>!Number.isInteger(stage.inventory[k])||stage.inventory[k]<0||stage.inventory[k]>2)) fail('inventory');
  if (stage.inventory.iceBlock && !sockets.length) fail('ice sockets required');
  if (stage.inventory.warpCrystal && !stage.portals.length) fail('portal required');
  if (stage.goal?.type !== 'collect-all' || Object.keys(stage.goal).some(k=>k!=='type')) fail('goal');
  return stage;
}
export function initialPuzzle(stage) {
  validateStage(stage);
  return {position:stage.start,walls:[...stage.walls],stars:[...stage.stars],ice:[],inventory:{...stage.inventory},ply:0};
}
