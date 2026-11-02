// Local, opt-in human playtest observations. Kept separate from chapter progress
// and house stars; no network calls or game-rule changes.
export const CHAPTER_TWO_REVIEW_KEY='zurash-app:chapter-two-playtest-review:v1';
export const emptyChapterTwoReviews=()=>({version:1,reviews:{}});
const choices={enjoyment:['fun','okay','poor'],difficulty:['easy','balanced','hard'],insight:['strong','some','none']};
export function loadChapterTwoReviews(storage){
 const raw=storage.getItem(CHAPTER_TWO_REVIEW_KEY);
 if(raw===null)return emptyChapterTwoReviews();
 const data=JSON.parse(raw);
 if(data?.version!==1||!data.reviews||typeof data.reviews!=='object'||Array.isArray(data.reviews))
  throw Error('Unsupported chapter-two playtest feedback');
 for(const [id,row]of Object.entries(data.reviews)){
  if(!/^[a-z0-9-]{1,80}$/.test(id)||!choices.enjoyment.includes(row?.enjoyment)||
    (row.difficulty!==null&&!choices.difficulty.includes(row.difficulty))||
    (row.insight!==undefined&&row.insight!==null&&!choices.insight.includes(row.insight))||
    typeof row.note!=='string'||row.note.length>300||typeof row.title!=='string'||
    !Number.isFinite(Date.parse(row.savedAt)))throw Error('Invalid chapter-two playtest feedback');
 }
 return data;
}
export function recordChapterTwoReview(storage,stage,{enjoyment,difficulty=null,insight=null,note=''},{now=new Date().toISOString()}={}){
 if(!stage||typeof stage.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(stage.id)||
    !choices.enjoyment.includes(enjoyment)||
    (difficulty!==null&&!choices.difficulty.includes(difficulty))||
    (insight!==null&&!choices.insight.includes(insight))||
    typeof note!=='string'||note.length>300)throw Error('Invalid feedback input');
 const data=loadChapterTwoReviews(storage);
 data.reviews[stage.id]={title:stage.chapter.title,number:stage.chapter.number,enjoyment,difficulty,insight,note,savedAt:now};
 storage.setItem(CHAPTER_TWO_REVIEW_KEY,JSON.stringify(data));
 return data.reviews[stage.id];
}
export function exportChapterTwoReviews(storage){
 const data=loadChapterTwoReviews(storage);
 return JSON.stringify({app:'ズラッシュ！',kind:'chapter-two-human-playtest',...data},null,2)+'\n';
}
