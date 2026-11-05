// Board-local visual cues derived from the player's legal before/after move.
// No reference to stage proofs, scores, rewards, persistence or future states.
export function describeBoardCues(stage,before,after,action){
 if(!stage?.board||!before||!after||!action?.prep)throw Error('Board cue requires a played move');
 const width=stage.board.width,height=stage.board.height;
 const validCell=c=>Number.isInteger(c)&&c>=0&&c<width*height;
 const earned=(before.stars??[]).filter(cell=>!(after.stars??[]).includes(cell));
 const starCell=earned.includes(after.position)&&validCell(after.position)?after.position:null;
 const gateChanged=stage.rulesVersion==='solo-v2-gate'&&before.gateOpen!==after.gateOpen;
 const gateCell=gateChanged&&validCell(stage.gate?.tile)?stage.gate.tile:null;
 const kind=action.prep.type;
 const itemCell=['wall','glove','ice','warp'].includes(kind)&&validCell(action.prep.to)?action.prep.to:null;
 if(starCell===null&&gateCell===null&&itemCell===null)return null;
 return {starCell,gateCell,gateOpen:gateCell===null?null:Boolean(after.gateOpen),itemCell,itemKind:itemCell===null?null:kind};
}
