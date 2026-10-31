import {validateStage} from './schema.js';
export async function sha256(text) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function createCatalog(manifest,loadText,{maxCachedChunks=3,allowCandidates=false}={}) {
  if(manifest.version!==1||!Array.isArray(manifest.chunks)||!Number.isInteger(maxCachedChunks)||maxCachedChunks<1)throw Error('Invalid catalog');
  let previous=0;
  for(const c of manifest.chunks) {
    if(c.first!==previous+1||c.last<c.first||c.count!==c.last-c.first+1||!Number.isInteger(c.last)||!/^chunks\/[a-z0-9-]+\.json$/.test(c.path)||!/^[a-f0-9]{64}$/.test(c.sha256))throw Error('Invalid chunk index');
    previous=c.last;
  }
  if(previous!==manifest.count)throw Error('Invalid catalog count');
  const cache=new Map(),pending=new Map();
  async function chunk(entry) {
    if(cache.has(entry.path)){const value=cache.get(entry.path);cache.delete(entry.path);cache.set(entry.path,value);return value;}
    if(pending.has(entry.path))return pending.get(entry.path);
    const job=(async()=>{
      const text=await loadText(entry.path);
      if(await sha256(text)!==entry.sha256)throw Error('Chunk integrity failure');
      const data=JSON.parse(text);
      if(data.length!==entry.count)throw Error('Chunk count mismatch');
      data.forEach(validateStage);
      if(new Set(data.map(s=>s.id)).size!==data.length)throw Error('Duplicate stage id');
      cache.set(entry.path,data);
      while(cache.size>maxCachedChunks)cache.delete(cache.keys().next().value);
      return data;
    })();
    pending.set(entry.path,job);
    try{return await job;}finally{pending.delete(entry.path);}
  }
  return {
    async get(ordinal) {
      if(!Number.isInteger(ordinal)||ordinal<1||ordinal>manifest.count)throw Error('Stage outside catalog');
      const entry=manifest.chunks.find(c=>ordinal>=c.first&&ordinal<=c.last);
      const stage=(await chunk(entry))[ordinal-entry.first];
      if(stage.id!==`pz-${String(ordinal).padStart(6,'0')}`)throw Error('Stage id mismatch');
      if(!allowCandidates&&stage.status!=='approved')throw Error('Candidate is not playable in production');
      return structuredClone(stage);
    },
    cacheSize:()=>cache.size,
  };
}
