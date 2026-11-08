# -*- coding: utf-8 -*-
"""組裝 content/SOC4A.json：單元＋知識卡＋題庫＋詳解＋圖頁＋教具。"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
D = os.path.join(PROJ, 'data')
sys.path.insert(0, HERE)
from units import META, UNITS, TOOLS  # noqa

quiz = json.load(open(os.path.join(D, 'quiz_raw.json'), encoding='utf-8'))
fill = json.load(open(os.path.join(D, 'fill_raw.json'), encoding='utf-8'))
why = json.load(open(os.path.join(D, 'why_clean.json'), encoding='utf-8'))
pages = json.load(open(os.path.join(D, 'pages.json'), encoding='utf-8'))

SPECIAL_IMG = {'1-1#5': 'qicon_compass', '1-1#13': 'qicon_cross'}
SPECIAL_Q = {
    '1-1#13': '在地圖上，〔下圖〕可能是代表醫院的符號。',
}

# 第五單元「主題探究」沒有隨堂練習卷，依知識卡內容人工命題。
# 格式與 quiz_raw.json 相同；答案由命題時一併寫定，不靠模型。
EXTRA_ITEMS = {
    '5-1': [
        dict(t='tf', q='探究的主題訂得愈大，資料就愈好找，也寫得愈深。', a=False, hint='',
             why='主題要小而具體，「家鄉的老街」比「我的家鄉」好，資料才找得到、也寫得深。'),
        dict(t='tf', q='訪問別人之前，先準備問題並徵求對方同意，是比較好的做法。', a=True, hint='',
             why='訪問前先準備問題，並徵求同意、記下對方說法，資料才可靠也得體。'),
        dict(t='tf', q='把照片、地圖和自己畫的圖放進小書時，都要註明來源。', a=True, hint='',
             why='課本提醒資料要註明來源，讓讀者知道內容是從哪裡來的。'),
        dict(t='tf', q='發表時只要把找到的資料全部念完，不必說自己對家鄉的新感覺。', a=False, hint='',
             why='發表要說清楚主題、方法、三個最重要的發現，以及你對家鄉的新感覺。'),
        dict(t='tf', q='「六何」包含何人、何事、何時、何地、如何、為何。', a=True, hint='',
             why='六何就是這六個提問角度，用來把訪問的問題問完整。'),
        dict(t='mc', q='下面哪一個探究題目最「小而具體」，適合做家鄉小書？',
             o=['我的家鄉', '家鄉的老街', '臺灣', '全世界'], a=1, hint='',
             why='「家鄉的老街」範圍明確，資料找得到、也寫得深；其餘太大。'),
        dict(t='mc', q='想比較家鄉兩個節慶的異同，用哪一種整理工具最適合？',
             o=['方格表', '時序圖', '魚骨圖', '心智圖'], a=0, hint='',
             why='課本用方格表比較異同；時序圖排先後、魚骨圖找原因、心智圖做分類。'),
        dict(t='mc', q='想找出「老街為什麼會沒落」的原因，用哪一種圖最適合？',
             o=['魚骨圖', '時序圖', '方格表', '地圖'], a=0, hint='',
             why='魚骨圖用來整理原因；時序圖排先後、方格表比較異同、心智圖分類。'),
        dict(t='mc', q='想把老街從興起到現在的變化排出先後，應該用？',
             o=['時序圖', '魚骨圖', '方格表', '心智圖'], a=0, hint='',
             why='時序圖專門排先後順序，最適合看一個地方的變化。'),
        dict(t='mc', q='下面哪一項不是「六何」？',
             o=['何人', '何時', '何價', '為何'], a=2, hint='',
             why='六何是何人、何事、何時、何地、如何、為何，沒有「何價」。'),
        dict(t='mc', q='下面哪一種做法不適合拿來蒐集家鄉資料？',
             o=['實地觀察', '訪問店家', '閱讀地圖', '直接抄同學的小書當成自己的發現'], a=3, hint='',
             why='抄別人的成果不是自己的探究；應該自己觀察、訪問、查資料並註明來源。'),
        dict(t='fill', q='訪問前先用＿＿＿＿把問題問完整。', a='六何', hint='把課本重點整理的原句補完整。',
             why='課本重點原句：「六何」把問題問完整。'),
        dict(t='fill', q='資料要註明＿＿＿＿，才知道是從哪裡來的。', a='來源', hint='把課本重點整理的原句補完整。',
             why='課本重點原句：資料要註明「來源」。'),
        dict(t='fill', q='主題要＿＿＿＿，資料才找得到、也寫得深。', a='小而具體', hint='把課本重點整理的原句補完整。',
             why='課本重點原句：主題要「小而具體」。'),
        dict(t='fill', q='用＿＿＿＿分類，可以把找到的資料分成幾大類。', a='心智圖', hint='把課本重點整理的原句補完整。',
             why='課本重點原句：用「心智圖」分類。'),
        dict(t='fill', q='發表時要說清楚主題、方法和三個最重要的＿＿＿＿。', a='發現', hint='把課本重點整理的原句補完整。',
             why='課本重點原句：三個最重要的「發現」。'),
    ],
}

errs = []
seen = set()


def build_items(lid):
    out = []
    for i, x in enumerate(quiz.get(lid, [])):
        k = '%s#%d' % (lid, i)
        it = dict(x)
        it['id'] = '%s:q%d' % (lid, i)
        it['k'] = k
        it['why'] = why.get(k, '回到「重點卡」找這題的依據，再想一想關鍵字。')
        if k in SPECIAL_IMG:
            it['img'] = SPECIAL_IMG[k]
        if k in SPECIAL_Q:
            it['q'] = SPECIAL_Q[k]
        if it['t'] == 'mc':
            if not (0 <= it['a'] < len(it['o'])):
                errs.append('MC answer out of range ' + it['id'])
            if len(it['o']) < 2:
                errs.append('MC too few options ' + it['id'])
        if it['t'] == 'tf' and not isinstance(it['a'], bool):
            errs.append('TF answer not bool ' + it['id'])
        out.append(it)
    for i, x in enumerate(fill.get(lid, [])):
        it = dict(x)
        it['id'] = '%s:f%d' % (lid, i)
        it['t'] = 'fill'
        it['why'] = '課本重點原句：' + it['q'].replace('＿＿＿＿', '「' + it['a'] + '」')
        it['hint'] = '把課本重點整理的原句補完整。'
        if '＿＿＿＿' not in it['q']:
            errs.append('FILL no blank ' + it['id'])
        out.append(it)
    for i, x in enumerate(EXTRA_ITEMS.get(lid, [])):
        it = dict(x)
        it['id'] = '%s:x%d' % (lid, i)
        it.setdefault('hint', '')
        it.setdefault('why', '')
        out.append(it)
    for it in out:
        if it['id'] in seen:
            errs.append('dup id ' + it['id'])
        seen.add(it['id'])
        if not it.get('q') or not it.get('why'):
            errs.append('missing q/why ' + it['id'])
        if it['t'] == 'mc' and not (0 <= it['a'] < len(it['o'])):
            errs.append('MC answer out of range ' + it['id'])
        if it['t'] == 'tf' and not isinstance(it['a'], bool):
            errs.append('TF answer not bool ' + it['id'])
        if it['t'] == 'fill' and ('＿＿＿＿' not in it['q'] or not it.get('a')):
            errs.append('FILL invalid ' + it['id'])
    return out


# pages.py 的 desc 多半直接抓 PDF 文字層，地圖／海報類會混入圖例編號、\x07、
# 私用區字形等亂碼，念出來很怪。這裡統一改寫成給學生看的白話描述。
KEEP_DESC = {'概念圖', '重點表', '桌遊卡牌', '歌曲'}
PROJ_DESC = {
    'proj1': '主題探究小書的第一部分：跟著提示把「想介紹家鄉的什麼」寫清楚，'
             '練習訂出一個小而具體的主題。',
    'proj2': '主題探究小書的空白版型：封面、目錄、內頁到「我的發現」，'
             '可以印出來做成自己的家鄉小書。',
}


def short_title(t):
    return t.split('｜')[0].split('_')[-1].strip()


def clean_desc(k, v):
    g, t = v['group'], v['title']
    s = short_title(t)
    if k in PROJ_DESC:
        return PROJ_DESC[k]
    if g in KEEP_DESC:
        return (v.get('desc') or '').strip()
    if g == '縣市海報':
        return s + '｜縣市主題海報：有人口、面積、地形、主要河川和地方簡介。點圖放大，找找自己的家鄉在哪裡。'
    if g == '主題地圖':
        return s + '｜臺灣主題地圖原頁。點圖放大，先認圖例和方向標，再對照課本找地名。'
    if g == '世界地圖':
        return s + '｜世界地圖原頁。點圖放大，先找臺灣在哪裡，再看周圍的國家與海洋。'
    if g == '地圖挑戰':
        return s + '｜地圖出題挑戰：圖上的代號要填回正確的縣市或地形，可以當成一次小考。'
    if g == '學習單':
        return s + '｜配合課本的學習單原頁。可以先在紙上寫寫看，再回到「練習」對答案。'
    if g == '素養任務':
        return s + '｜素養任務學習單，把課本知識拿來解決生活裡的問題，適合和同學討論。'
    if g == '備課講義':
        return s + '｜備課講義原頁，補充課本沒講完的例子、圖片和說明。'
    if g == '課外補充':
        return s + '｜課外補充閱讀，把這一課的知識連到真實的生活經驗。'
    return (v.get('desc') or s or g).strip()


for k, v in pages.items():
    v['desc'] = clean_desc(k, v)

lib = {}
for k, v in pages.items():
    lib.setdefault(v['group'], []).append(k)
for g in lib:
    lib[g].sort()

for u in UNITS:
    for les in u['lessons']:
        lid = les['id']
        les['items'] = build_items(lid)
        # 主題探究兩頁在 pages.py 標成 u5（單元代號），這裡併回 5-1 這一課
        les['pages'] = sorted([k for k, v in pages.items()
                               if v['lesson'] == lid or (lid == '5-1' and v['lesson'] == 'u5')])
        les['tools'] = [TOOLS[t] for t in les['tools'] if t in TOOLS]
        if not les['cards']:
            errs.append('no cards ' + lid)
        for j, c in enumerate(les['cards']):
            c['id'] = les['id'] + ':c' + str(j)
        if len(les['items']) < 10:
            errs.append('too few items ' + lid)
        if not les['pages']:
            errs.append('no pages ' + lid)

data = dict(META=META, UNITS=UNITS, PAGES=pages, LIBRARY=lib)
os.makedirs(os.path.join(PROJ, 'content'), exist_ok=True)
out = os.path.join(PROJ, 'content', 'SOC4A.json')
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

n_les = sum(len(u['lessons']) for u in UNITS)
n_items = sum(len(l['items']) for u in UNITS for l in u['lessons'])
n_cards = sum(len(l['cards']) for u in UNITS for l in u['lessons'])
n_tools = sum(len(l['tools']) for u in UNITS for l in u['lessons'])
ct = Counter(i['t'] for u in UNITS for l in u['lessons'] for i in l['items'])
print('units', len(UNITS), 'lessons', n_les, 'cards', n_cards,
      'items', n_items, dict(ct), 'tools', n_tools, 'pages', len(pages))
print('size %.2f MB' % (os.path.getsize(out) / 1048576))
print('ERRORS', len(errs))
for e in errs[:20]:
    print('  ', e)
