// Lightweight celebration cues are computed from an actual validated move.
// No use of shortest-solution proofs, save writes, audio or gameplay changes.
const toolLabels={
 wall:'🧊 壁をずらした！',
 glove:'✊ グローブ成功！',
 ice:'◆ アイスを置いた！',
 warp:'✧ ワープ成功！'
};
export function describeMoveEffects(before,after,action){
 if(!before||!after||!action?.prep)throw Error('Move effects require before, after and action');
 const messages=[];
 const tool=toolLabels[action.prep.type];
 if(tool)messages.push(tool);
 const earned=before.stars.length-after.stars.length;
 if(earned>0)messages.push('★ 星を'+earned+'個ゲット！');
 if(before.gateOpen!==after.gateOpen&&typeof after.gateOpen==='boolean')
  messages.push(after.gateOpen?'▦ 氷扉が開いた！':'▦ 氷扉が閉じた！');
 return messages;
}
