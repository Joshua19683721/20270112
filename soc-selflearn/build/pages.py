# -*- coding: utf-8 -*-
"""把 E:\\ 社會 4 上大補帖的 PDF 頁轉成壓縮 WebP，建立圖文教材清單。"""
import glob, json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

E = r'E:\01_大補帖(領域)'
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
PGDIR = os.path.join(PROJ, 'assets', 'pg')
TMP = os.path.join(PROJ, 'data', '_render')
os.makedirs(PGDIR, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

LESSON_ORDER = ['1-1', '1-2', '1-3', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '4-3']
LESSON_NAME = {
    '1-1': '家鄉在哪裡', '1-2': '家鄉的地形', '1-3': '氣候、水資源與生活',
    '2-1': '傳統住屋與生活', '2-2': '器物與生活', '3-1': '信仰與生活',
    '3-2': '老街與生活', '4-1': '生活的作息', '4-2': '傳統的節慶',
    '4-3': '現代的節日',
}


def pdfpages(path):
    r = subprocess.run(['pdfinfo', path], capture_output=True, text=True,
                       encoding='utf-8', errors='replace')
    m = re.search(r'^Pages:\s*(\d+)', r.stdout, re.M)
    return int(m.group(1)) if m else 1


def pdftxt(path, page):
    r = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), '-layout', path, '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    s = re.sub(r'\s+', ' ', r.stdout).strip()
    s = re.sub(r'\s*\d{1,2}\s*$', '', s)
    return s[:150]


def lesson_of(name, default='all'):
    m = re.search(r'_(\d-\d)_', name)
    if m:
        return m.group(1)
    m = re.search(r'第\s*0?(\d)\s*單元', name)
    return 'u' + m.group(1) if m else default


def title_of(name):
    s = os.path.splitext(os.path.basename(name))[0]
    s = re.sub(r'^\d+[_-]', '', s)
    s = re.sub(r'^國小社會4上', '', s)
    s = re.sub(r'^國小社會', '', s)
    s = re.sub(r'^\d+[_-]', '', s)
    s = re.sub(r'[（(][學教][）)]$', '', s)
    return s.strip('_- ')[:32]


def add(entries, key, path, page, lesson, title, group, desc=None, dpi=95, width=980):
    entries.append(dict(key=key, src=path, page=page, lesson=lesson,
                        title=title, group=group, desc=desc, dpi=dpi, width=width))


def build_manifest():
    a = []
    # 1. 全冊概念構圖（10 頁，一課一張）
    p = os.path.join(E, r'08_概念構圖PPT\11_國小社會4上概念構圖(全冊)_(教).pdf')
    for i, lid in enumerate(LESSON_ORDER):
        add(a, 'cm_' + lid, p, i + 1, lid,
            lid + ' ' + LESSON_NAME[lid] + '｜概念構圖', '概念圖',
            '這一課的概念構圖：先看中央主題，再沿著箭頭往外讀，把「是什麼・有哪些・會怎樣」串起來。',
            dpi=115, width=1150)
    # 2. 全冊重點摘要（10 頁）
    p = os.path.join(E, r'09_重點摘要PPT\11_國小社會4上重點摘要(全冊)_(教).pdf')
    for i, lid in enumerate(LESSON_ORDER):
        add(a, 'sm_' + lid, p, i + 1, lid,
            lid + ' ' + LESSON_NAME[lid] + '｜重點摘要', '重點表',
            '課本重點整理成階層表，由上往下讀：大概念 → 分類 → 具體例子。',
            dpi=105, width=1050)
    # 3. 各課學習單（學用）
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'13_各課學習單\學用(PDF)\*.pdf')))):
        lid = lesson_of(os.path.basename(f))
        for pg in range(1, min(pdfpages(f), 2) + 1):
            add(a, 'ws%02d_%d' % (n + 1, pg), f, pg, lid, title_of(f),
                '學習單', pdftxt(f, pg), dpi=95, width=900)
    # 4. 素養學習單（學用）
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'14_素養學習單\學用(PDF)\*.pdf')))):
        lid = lesson_of(os.path.basename(f))
        add(a, 'lit%02d' % (n + 1), f, 1, lid, title_of(f), '素養任務', pdftxt(f, 1), dpi=95, width=900)
    # 5. 社會備課（彩色講義首頁）
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'01_教專社會備課\*\*.pdf')))):
        if '備課' not in os.path.basename(f):
            continue
        lid = lesson_of(os.path.basename(f), 'all')
        add(a, 'bk%02d' % (n + 1), f, 1, lid, title_of(f), '備課講義',
            pdftxt(f, 1), dpi=95, width=900)
    # 6. 課外補充
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'17_課外補充\*.pdf')))):
        for pg in range(1, min(pdfpages(f), 2) + 1):
            add(a, 'ext%d_%d' % (n + 1, pg), f, pg, 'all', title_of(f),
                '課外補充', pdftxt(f, pg), dpi=90, width=900)
    # 7. 臺灣主題地圖
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'19_主題地圖集_臺灣地圖\PDF\*.pdf')))):
        add(a, 'map%02d' % (n + 1), f, 1, 'all', title_of(f), '主題地圖',
            pdftxt(f, 1), dpi=100, width=1000)
    # 8. 世界地圖（挑 6 張）
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'20_主題地圖集_世界地圖\PDF\*.pdf')))[:8]):
        add(a, 'wld%02d' % (n + 1), f, 1, 'all', title_of(f), '世界地圖',
            pdftxt(f, 1), dpi=95, width=950)
    # 9. 縣市主題海報（17 張，讓學生選自己的家鄉）
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'18_主題地圖集_家鄉地圖\縣市海報PDF\*.pdf')))):
        add(a, 'city%02d' % (n + 1), f, 1, 'all', title_of(f), '縣市海報',
            pdftxt(f, 1), dpi=90, width=900)
    # 10. 地圖出題（學用）
    for n, f in enumerate(sorted(glob.glob(os.path.join(E, r'21_主題地圖集_臺灣與世界地圖出題\*(學).pdf')))):
        add(a, 'mq%02d' % (n + 1), f, 1, 'all', title_of(f), '地圖挑戰',
            pdftxt(f, 1), dpi=95, width=900)
    # 11. 主題探究小書 + 桌遊卡牌 + 三合院之歌
    p = os.path.join(E, r'10_探究教學PPT\11_國小社會4上主題探究小書_第05單元_介紹家鄉有方法(學).pdf')
    add(a, 'proj1', p, 1, 'u5', '主題探究小書｜介紹家鄉有方法', '主題探究',
        pdftxt(p, 1), dpi=95, width=900)
    add(a, 'proj2', p, 2, 'u5', '主題探究小書｜我的家鄉小書', '主題探究',
        pdftxt(p, 2), dpi=95, width=900)
    p = os.path.join(E, r'01_教專社會備課\08_家鄉的傳統節慶\02_國小社會4上桌遊卡牌(54張)_4-2_家鄉的傳統節慶(教).pdf')
    for pg in range(1, min(pdfpages(p), 6) + 1):
        add(a, 'card%d' % pg, p, pg, '4-2', '家鄉傳統節慶桌遊卡牌', '桌遊卡牌',
            '節慶桌遊卡牌，可印出來玩配對；也可以直接在「互動教具」裡翻牌。', dpi=90, width=900)
    p = os.path.join(E, r'01_教專社會備課\03_三合院之歌\02_國小社會三合院之歌歌詞_(學).pdf')
    add(a, 'song1', p, 1, '2-1', '三合院之歌｜歌詞', '歌曲',
        '配合 2-1 的三合院之歌，用唱的記住正身、護龍與稻埕。點「朗讀」聽一次。', dpi=100, width=950)
    return a


def render(e):
    out = os.path.join(PGDIR, e['key'] + '.webp')
    tmp = os.path.join(TMP, e['key'])
    try:
        if os.path.exists(out):
            w, h = Image.open(out).size
        else:
            if not os.path.exists(tmp + '.png'):
                subprocess.run(['pdftoppm', '-f', str(e['page']), '-l', str(e['page']),
                                '-r', str(e['dpi']), '-png', '-singlefile', e['src'], tmp],
                               capture_output=True, timeout=90)
            if not os.path.exists(tmp + '.png'):
                return (e['key'], 'NO PNG')
            im = Image.open(tmp + '.png').convert('RGB')
            if im.width > e['width']:
                h2 = round(im.height * e['width'] / im.width)
                im = im.resize((e['width'], h2), Image.LANCZOS)
            im.save(out, 'WEBP', quality=74, method=5)
            w, h = im.size
        e2 = {k: e[k] for k in ('key', 'lesson', 'title', 'group', 'desc')}
        e2['w'], e2['h'], e2['bytes'] = w, h, os.path.getsize(out)
        return (e['key'], e2)
    except Exception as ex:
        return (e['key'], 'ERR ' + str(ex)[:60])


def main():
    entries = build_manifest()
    print('pages to render:', len(entries))
    res = {}
    with ThreadPoolExecutor(max_workers=5) as ex:
        for k, v in ex.map(render, entries):
            res[k] = v
            if isinstance(v, str):
                print('  !', k, v)
    ok = {k: v for k, v in res.items() if isinstance(v, dict)}
    bad = [k for k, v in res.items() if not isinstance(v, dict)]
    json.dump(ok, open(os.path.join(PROJ, 'data', 'pages.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    total = sum(v['bytes'] for v in ok.values())
    print('OK', len(ok), 'BAD', len(bad), 'size %.2f MB' % (total / 1048576))
    if bad:
        print('bad:', bad[:30])


if __name__ == '__main__':
    main()
