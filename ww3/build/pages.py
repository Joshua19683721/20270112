# -*- coding: utf-8 -*-
import os,io,json,glob,re
from PIL import Image
ROOT=r"E:/K1151WW_3/Resource/SystemResource/knsh_book/PageContent/Book"
OUT=r"C:/Users/joshu/WorkBuddy AI/tempfolder/ww3/assets/pg"
CFG=r"E:/K1151WW_3/Resource/SystemResource/knsh_book/SystemResource/Config/config_page.json"
d=json.load(io.open(CFG,encoding='utf-8-sig'))
# 課本 lesson index -> 單元
MAP={1:None,2:'GR',3:'GR',4:'GR',5:'U1',6:'U2',7:'R1',8:'U3',9:'U4',10:'R2',11:'CF',12:'PD',13:'PD',14:'TR',15:None}
os.makedirs(OUT,exist_ok=True)
rec=[]
for L in d['book']['lessons']:
    idx=int(L['lessonName'])
    unit=MAP.get(idx)
    if not unit: continue
    for p in L['pages']:
        url=p['pageUrl']; pn=p['pageNumber']
        jpg=os.path.join(os.path.dirname(os.path.join(ROOT,url.replace('PageContent/Book/',''))),os.path.basename(url).replace('.svg','.jpg'))
        if not os.path.exists(jpg):
            print('MISS',jpg); continue
        key='p'+re.sub(r'[^0-9]','',pn)
        out=os.path.join(OUT,key+'.webp')
        im=Image.open(jpg).convert('RGB')
        w,h=im.size
        if w>1180:
            im=im.resize((1180,int(h*1180/w)),Image.LANCZOS)
        im.save(out,'WEBP',quality=80,method=6)
        rec.append({'unit':unit,'n':pn,'key':key,'w':im.size[0],'h':im.size[1],
                    'sz':os.path.getsize(out),'src':os.path.basename(jpg)[:-4]})
print('pages',len(rec),'total',round(sum(r['sz'] for r in rec)/1048576,2),'MB')
json.dump(rec,io.open('pages.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
for r in rec: print(' %-3s %-9s %-8s %dx%d %5dKB'%(r['unit'],r['n'],r['key'],r['w'],r['h'],r['sz']//1024))
