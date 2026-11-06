"""Deterministic format/size conversion; no cropping, matting or artistic editing.
Generated originals stay untouched. Rebuild requires generated-sources.json inputs.
"""
from pathlib import Path
from PIL import Image
import json, hashlib

ROOT=Path(__file__).resolve().parents[1]
sources=json.loads((ROOT/'reports/house-v7/generated-sources.json').read_text())
records=[]
for r in sources['backgrounds']+sources['repairs']:
    p=Path(r.get('source',r.get('path','')))
    if not p.is_file(): continue
    background='key' in r
    ident=r['key'] if background else r['id']
    state='fixed' if background else r['state']
    dest=ROOT/'assets/house/v7'/('backgrounds' if background else r['scene'])/f'{ident}-{state}-v1.webp'
    dest.parent.mkdir(parents=True,exist_ok=True)
    im=Image.open(p);im.thumbnail((960,1080) if background else (640,640),Image.Resampling.LANCZOS)
    im.save(dest,'WEBP',quality=88,method=6,exact=True)
    alpha=im.getchannel('A') if im.mode=='RGBA' else None
    records.append({'assetId':f'{ident}-{state}-v1','taskId':None if background else r['id'],'scene':r.get('scene',ident.replace('-shell','')),'state':state,'path':dest.relative_to(ROOT).as_posix(),'width':im.width,'height':im.height,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'alpha':bool(alpha),'alphaBounds':list(alpha.getbbox()) if alpha else None,'transparentFraction':round(sum(v<8 for v in alpha.get_flattened_data())/(im.width*im.height),4) if alpha else 0,'version':1,'status':'draft-integrated-awaiting-visual-approval','productionApproved':False,'presentInGit':False})
(ROOT/'assets/house/v7/asset-records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'converted':len(records),'bytes':sum(r['bytes'] for r in records)}))
