# -*- coding: utf-8 -*-
import zipfile, re, io, os, json, glob
BASE = r"E:/K1151WW_3/Resource/SystemResource/knsh_book/TeachResource/ppt"
def runs(xml):
    # 依 <a:p> 分組，同一段落內的 <a:t> 直接串接（不補空白）
    out=[]
    for para in re.findall(r'<a:p>([\s\S]*?)</a:p>', xml):
        t=''.join(re.findall(r'<a:t>([\s\S]*?)</a:t>', para))
        t=t.replace('&amp;','&').replace('&lt;','<').replace('&gt;','>').replace('&quot;','"').replace('&#39;',"'")
        t=t.strip()
        if t: out.append(t)
    return out
res={}
for f in sorted(glob.glob(os.path.join(BASE,'*.pptx'))):
    name=os.path.basename(f)[:-5]
    z=zipfile.ZipFile(f)
    slides=sorted([n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$',n)],
                  key=lambda n:int(re.search(r'slide(\d+)',n).group(1)))
    S=[]
    for n in slides:
        S.append(runs(z.read(n).decode('utf-8')))
    res[name]=S
    print('='*70)
    print(name, '  slides=',len(S))
    for i,ss in enumerate(S,1):
        print('  [%02d] %s'%(i,' | '.join(ss)))
json.dump(res,io.open('pptx.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
