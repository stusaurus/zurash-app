// Prepare a static GitHub Pages bundle containing *all* chapter dependencies.
// This script never deploys; deployment and publication are gated separately.
import {cpSync,existsSync,mkdirSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {resolve,relative,extname,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const DEFAULT_ROOT=fileURLToPath(new URL('../',import.meta.url));
const STATIC_DIRECTORIES=['src','assets','data'];
const REQUIRED=[
 'index.html','adventure.html','chapter-two.html','duel-boss.html',
 'chapter-two-review.html','style.css','adventure.css','expedition.css',
 'src/adventure.js','src/chapter-fun-lab.js','src/boss-duel.js',
 'src/boss-cpu-worker.js','src/puzzle/cpu-encounter.js',
 'src/puzzle/chapter-two-progress.js','src/puzzle/chapter-two-save-retry.js',
 'src/puzzle/campaign.js','data/campaign.json',
 'data/chapters/chapter-01/manifest.json',
 'data/chapters/chapter-02/adventure-v1.json',
 'assets/zurash-approved-logo.webp','assets/triken-orange-80.png',
 'assets/triken-aqua-80.png','assets/triken-lime-80.png',
 'assets/triken-purple-80.png','assets/house/material-atlas.webp'
];

export function buildPublicSite(destination,{root=DEFAULT_ROOT}={}){
 const source=resolve(root),output=resolve(destination);
 if(source===output)throw Error('Refusing to overwrite source tree');
 const nested=relative(source,output);
 if(nested.startsWith('..')===false&&nested!==''&&nested.split(/[\\/]/).length>2)
  throw Error('Output must be a top-level build directory, not nested application content');
 for(const name of REQUIRED){
  if(!existsSync(join(source,name)))throw Error('Missing required source asset: '+name);
 }
 rmSync(output,{recursive:true,force:true});
 mkdirSync(output,{recursive:true});
 for(const name of readdirSync(source)){
  if(!['.html','.css'].includes(extname(name)))continue;
  cpSync(join(source,name),join(output,name));
 }
 for(const name of STATIC_DIRECTORIES)
  cpSync(join(source,name),join(output,name),{recursive:true});
 writeFileSync(join(output,'.nojekyll'),'');
 for(const name of REQUIRED)
  if(!existsSync(join(output,name)))throw Error('Missing published file: '+name);
 return output;
}

export function verifyPublicSite(output){
 const root=resolve(output),missing=REQUIRED.filter(name=>!existsSync(join(root,name)));
 if(missing.length)throw Error('Unpublished chapter dependencies: '+missing.join(', '));
 // Every stage of both chapters must be served, not merely the HTML shells.
 for(const dir of ['data/chapters/chapter-01/chunks','data/chapters/chapter-02','assets/house/v7','src/puzzle'])
  if(!existsSync(join(root,dir)))throw Error('Missing static directory: '+dir);
 return true;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const output=buildPublicSite(process.argv[2]||join(DEFAULT_ROOT,'dist'));
 verifyPublicSite(output);
 process.stdout.write('Static ZURASH! adventure bundle verified: '+output+'\n');
}
