import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
export const writeEvidence=(dir,name,text)=>fs.writeFile(path.join(dir,name+'.gz'),gzipSync(text,{mtime:0}));
export const readEvidence=async(dir,name)=>gunzipSync(await fs.readFile(path.join(dir,name+'.gz'))).toString('utf8');
