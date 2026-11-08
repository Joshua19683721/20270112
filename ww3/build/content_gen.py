# -*- coding: utf-8 -*-
"""組裝 WW3 完整內容 JSON"""
import io, json, os, sys, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from units import UNITS
from newitems import ALL as NEW

BASE = r"C:\Users\joshu\WorkBuddy AI\tempfolder\eng-selflearn\content\WW3.json"
OUT = r"C:\Users\joshu\WorkBuddy AI\tempfolder\ww3\content\WW3.json"
PJ = json.load(io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages.json'), encoding='utf-8'))
AJ = json.load(io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio.json'), encoding='utf-8'))

base = json.load(io.open(BASE, encoding='utf-8'))
BLAB = {L['label']: L for L in base['lessons']}
LBL2NO = {'GR': 1, 'U1': 2, 'U2': 3, 'R1': 4, 'U3': 5, 'U4': 6, 'R2': 7, 'C&F': 8}

# 課本頁圖：unit code -> pages
PAGES = {}
for r in PJ:
    PAGES.setdefault(r['unit'], []).append(r)

# 國際教育題目按主題分配到各單元
ICMAP = {'雪地交通': 2, '世界名鐘': 3, '各國護照': 5, '火山與防災': 6}

lessons = []
for u in UNITS:
    no = u['no']
    lab = u['label']
    # --- 課文頁 ---
    pages = []
    ucode = {'GR': 'GR', 'U1': 'U1', 'U2': 'U2', 'R1': 'R1', 'U3': 'U3', 'U4': 'U4',
             'R2': 'R2', 'CF': 'CF', 'PD': 'PD'}[lab]
    for r in PAGES.get(ucode, []):
        au = AJ['page'].get(r['key'])
        pages.append({"n": r['n'], "k": "pg_" + r['key'],
                      "au": ("pg_" + r['key']) if au else ""})
    pages.sort(key=lambda x: int(''.join(c for c in x['n'].split('-')[0] if c.isdigit())))

    # --- 題庫：舊題 + 新題 ---
    items = []
    bl = None
    for k, v in BLAB.items():
        if LBL2NO.get(k) == no:
            bl = v
            break
    if bl:
        items += copy.deepcopy(bl['items'])
    items += copy.deepcopy(NEW.get(lab, []))
    if lab in ('U1', 'U2', 'U3', 'U4'):
        for it in NEW['IC']:
            for key, target in ICMAP.items():
                if target == no and key in it['sec']:
                    items.append(copy.deepcopy(it))
    # PD 借用 GR/U1 的單字音檔題？不另加。

    # --- 單字音檔檢查 ---
    words = []
    for w in u['words']:
        w2 = dict(w)
        a = w2.get('au') or ''
        if a.startswith('w_'):
            if a[2:] not in AJ['files']:
                w2['au'] = ''
        elif a:
            if not os.path.exists(os.path.join(
                    r"C:\Users\joshu\WorkBuddy AI\tempfolder\ww3\assets\au", a + '.mp3')):
                w2['au'] = ''
        words.append(w2)

    story = ''
    for code, v in AJ['story'].items():
        if code == ucode:
            story = 'story_' + code
    lessons.append({
        "no": no, "label": lab, "title": u['title'], "zh": u['zh'], "story": story,
        "pages": pages, "words": words, "sents": u['sents'],
        "phonics": u['phonics'], "culture": u['culture'], "items": items,
    })

V = {
    "vol": "Wonder World 3",
    "code": "WW3",
    "sub": "115年國小 Wonder World 3（上）",
    "lessons": lessons,
}
json.dump(V, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---- 統計 ----
tot = 0
print('%-4s %-26s %-5s %-5s %-5s %-6s %-6s' % ('no', 'title', '頁', '字', '句', '拼讀', '題'))
for L in lessons:
    n = len(L['items']); tot += n
    print('%-4s %-26s %-5d %-5d %-5d %-6d %-6d' % (L['no'], L['title'][:26], len(L['pages']),
          len(L['words']), len(L['sents']), len(L['phonics']), n))
print('合計', tot, '題')
print('素養卡', sum(len(L['culture']) for L in lessons))

# ---- 檢查 ----
ids = {}
for L in lessons:
    for it in L['items']:
        if it['id'] in ids:
            print('!! 重複 id', it['id'])
        ids[it['id']] = 1
        if it['t'] == 'mc' and not (0 <= it['a'] < len(it['o'])):
            print('!! mc 答案越界', it['id'], it['q'][:30])
        if it['t'] == 'mc' and len(set(it['o'])) != len(it['o']):
            print('!! mc 選項重複', it['id'], it['o'])
        if it['t'] == 'type' and not it.get('a'):
            print('!! type 無答案', it['id'])
        if it['t'] == 'multi':
            import re as _re
            nb = len(_re.findall(r'[\uFF3F_]{2,}', it['body']))
            if nb != len(it['a']):
                print('!! multi 空格數不符', it['id'], nb, len(it['a']), it['body'][:40])
        if it['t'] == 'group':
            for s in it['subs']:
                if not (0 <= s['a'] < len(s['o'])):
                    print('!! group 答案越界', it['id'])
print('id 總數', len(ids))
