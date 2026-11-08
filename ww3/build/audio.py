# -*- coding: utf-8 -*-
import os,io,json,re,subprocess,glob,shutil
MP3=r"E:/K1151WW_3/Resource/SystemResource/knsh_book/TeachResource/mp3"
OUT=r"C:/Users/joshu/WorkBuddy AI/tempfolder/ww3/assets/au"
PJ=json.load(io.open('pages.json',encoding='utf-8'))
UNITDIR={'GR':['Lesson2','Lesson3','Lesson4'],'U1':['Lesson5'],'U2':['Lesson6'],'R1':['Lesson7'],
         'U3':['Lesson8'],'U4':['Lesson9'],'R2':['Lesson10'],'CF':['Lesson11'],'PD':['Lesson12','Lesson13'],'TR':['Lesson14']}
os.makedirs(OUT,exist_ok=True)
def enc(src,dst,br='32k',sr='22050'):
    if os.path.exists(dst): return os.path.getsize(dst)
    cmd=['ffmpeg','-y','-loglevel','error','-i',src,'-ac','1','-ar',sr,'-b:a',br,dst]
    subprocess.run(cmd,check=True)
    return os.path.getsize(dst)

def files_of(unit):
    out=[]
    for d in UNITDIR.get(unit,[]):
        p=os.path.join(MP3,d)
        if os.path.isdir(p): out+= [os.path.join(p,f) for f in os.listdir(p) if f.lower().endswith('.mp3')]
    return out

res={'page':{},'story':{},'files':{}}
tot=0
for r in PJ:
    fs=files_of(r['unit'])
    # 頁碼對應：14-15 -> P14 / P15
    nums=re.findall(r'\d+',r['n'])
    cand=[f for f in fs if re.match(r'^[Pp]%s(_[A-Za-z])?_qwbf\.mp3$'%nums[0],os.path.basename(f))]
    if not cand and len(nums)>1:
        cand=[f for f in fs if re.match(r'^[Pp]%s(_[A-Za-z])?_qwbf\.mp3$'%nums[1],os.path.basename(f))]
    if cand:
        cand.sort(key=lambda x:len(os.path.basename(x)))
        dst=os.path.join(OUT,'pg_'+r['key']+'.mp3')
        sz=enc(cand[0],dst); tot+=sz
        res['page'][r['key']]={'f':'pg_'+r['key']+'.mp3','sz':sz,'src':os.path.basename(cand[0])}
    else:
        res['page'][r['key']]=None

# 繪本 / 課文動畫音檔
for u in ['GR','U1','U2','U3','U4','CF']:
    fs=files_of(u)
    st=[f for f in fs if 'storyqwbf' in os.path.basename(f).lower()]
    if st:
        dst=os.path.join(OUT,'story_'+u+'.mp3')
        sz=enc(st[0],dst,'40k'); tot+=sz
        res['story'][u]={'f':'story_'+u+'.mp3','sz':sz,'src':os.path.basename(st[0])}

# 單字音檔索引（原檔名以 _<word>.mp3 結尾）
idx={}
for u,ds in UNITDIR.items():
    for d in ds:
        p=os.path.join(MP3,d)
        if not os.path.isdir(p): continue
        for f in os.listdir(p):
            if not f.lower().endswith('.mp3'): continue
            m=re.match(r'^[Pp]\d+(?:_[A-Za-z]+)?_(.+)\.mp3$',f)
            if not m: continue
            w=m.group(1).lower()
            if re.fullmatch(r'[a-z]{2,}',w) and w not in ('qwbf','script','storyqwbf','storykwgd','jz','biaoti'):
                idx.setdefault(w,os.path.join(p,f))
res['files']=idx
print('page audio',sum(1 for v in res['page'].values() if v),'story',len(res['story']),'word idx',len(idx),'total',round(tot/1048576,2),'MB')
json.dump(res,io.open('audio.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
