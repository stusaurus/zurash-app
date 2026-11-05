import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,readdirSync,readFileSync,rmSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPublicSite,verifyPublicSite} from '../scripts/build-public-site.js';

const root=fileURLToPath(new URL('../',import.meta.url));
function withBundle(fn){
 const parent=mkdtempSync(join(tmpdir(),'zurash-public-'));
 try{
  const out=join(parent,'dist');
  assert.equal(buildPublicSite(out,{root}),resolve(out));
  assert.equal(verifyPublicSite(out),true);
  return fn(out);
 }finally{rmSync(parent,{recursive:true,force:true});}
}
function files(dir,ext){
 const result=[];
 const walk=(base,rel)=>{
  for(const entry of readdirSync(base,{withFileTypes:true})){
   const next=join(rel,entry.name),absolute=join(base,entry.name);
   if(entry.isDirectory())walk(absolute,next);
   else if(!ext||extname(entry.name)===ext)result.push(next);
  }
 };
 walk(dir,'');
 return result;
}

test('Pages bundle contains all chapter-1 and chapter-2 stages, worker, scripts and every image',()=>{
 withBundle(out=>{
  for(const name of files(root,'.html'))
   if(!name.includes('/')&&!name.includes('\\'))
    assert.ok(existsSync(join(out,name)),'Missing root page '+name);
  for(const name of files(join(root,'data'),'.json'))
   assert.ok(existsSync(join(out,'data',name)),'Missing chapter data '+name);
  for(const name of files(join(root,'src'),'.js'))
   assert.ok(existsSync(join(out,'src',name)),'Missing runtime script '+name);
  for(const name of files(join(root,'assets')))
   assert.ok(existsSync(join(out,'assets',name)),'Missing art '+name);
  assert.ok(existsSync(join(out,'.nojekyll')));
  // Development reports, source test fixtures and package dependencies are
  // deliberately not published with the static game.
  for(const excluded of ['tests','scripts','reports','docs','node_modules','package.json','package-lock.json','.github'])
   assert.equal(existsSync(join(out,excluded)),false,excluded+' should not be published');
 });
});

test('every local href or src in primary release routes is present in the bundle',()=>{
 withBundle(out=>{
  for(const filename of ['index.html','adventure.html','chapter-two.html','chapter-two-review.html','duel-boss.html']){
   const html=readFileSync(join(out,filename),'utf8');
   const attrs=[...html.matchAll(/\\b(?:src|href)\s*=\s*["']([^"']+)["']/g)];
   for(const [,value] of attrs){
    if(/^(?:https?:|data:|mailto:|tel:|#|\/\/|javascript:)/i.test(value))continue;
    const pathname=value.split(/[?#]/)[0];
    if(!pathname)continue;
    assert.ok(!pathname.startsWith('/'),'Root-absolute link breaks GitHub Pages repo path: '+filename+' -> '+value);
    const linked=resolve(join(out,dirname(filename)),pathname);
    assert.ok(linked.startsWith(resolve(out)),'Link escapes bundle: '+filename+' -> '+value);
    assert.ok(existsSync(linked),'Missing linked asset: '+filename+' -> '+value);
   }
  }
 });
});

test('an incomplete final deployment bundle fails the release gate',()=>{
 withBundle(out=>{
  unlinkSync(join(out,'data/chapters/chapter-02/adventure-v1.json'));
  assert.throws(()=>verifyPublicSite(out),/Unpublished chapter dependencies/);
 });
});
