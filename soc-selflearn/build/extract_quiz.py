# -*- coding: utf-8 -*-
"""從「國小社會4上隨堂練習_(教).pdf」抽出全冊題庫（含教用答案）與重點整理填空。"""
import json, os, re, subprocess, sys

ROOT = r'E:\01_大補帖(領域)\12_隨堂練習'
TEACH = os.path.join(ROOT, '01_國小社會4上隨堂練習_(教).pdf')
STU = os.path.join(ROOT, '02_國小社會4上隨堂練習_(學).pdf')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'data')

# 每一課：重點整理頁(0-based)、測驗頁(0-based)
LESSONS = [
    ('1-1', [1], [2]),
    ('1-2', [3], [4]),
    ('1-3', [5], [6]),
    ('2-1', [7], [8]),
    ('2-2', [9], [10]),
    ('3-1', [11, 12], [13]),
    ('3-2', [14], [15]),
    ('4-1', [16, 17], [18]),
    ('4-2', [19], [20, 21]),
    ('4-3', [22], [23]),
]

CIRC = '①②③④⑤⑥⑦⑧⑨⑩'
FULLNUM = '０１２３４５６７８９'


def pdftext(path):
    return subprocess.run(['pdftotext', '-layout', path, '-'],
                          capture_output=True, text=True, encoding='utf-8',
                          errors='replace').stdout


def pages(text):
    return text.split('\f')


def tidy(s):
    """清理 PDF 逐字加空格、多餘空白、換行。"""
    s = s.replace('\u3000', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    # 中文字之間被 PDF 拉開的空格（含全形標點）
    for _ in range(3):
        s = re.sub(r'(?<=[\u4e00-\u9fff。，、；：！？）」》])\s+(?=[\u4e00-\u9fff（「《])', '', s)
    s = re.sub(r'(?<=[\u4e00-\u9fff])\s+(?=[，。、；：！？）])', '', s)
    s = re.sub(r'(?<=[（(])\s+', '', s)
    s = re.sub(r'\s+(?=[)）])', '', s)
    # 數字與單位間的空格保留，但「1000 公尺」收掉
    s = re.sub(r'(?<=\d)\s+(?=[\u4e00-\u9fff])', '', s)
    return s.strip()


def split_blocks(txt, pat):
    """依題號起點切塊。"""
    ms = list(re.finditer(pat, txt, re.M))
    out = []
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(txt)
        out.append((m, txt[m.start():end]))
    return out


def clean_stem(s):
    s = re.sub(r'^\s*[（(]\s*[○╳✕×○×\d０-９]?\s*[）)]\s*', '', s)
    s = re.sub(r'^\s*\d+\s*[.．、]\s*', '', s)
    s = re.sub(r'^\s*[（(]\s*\d+\s*[）)]\s*', '', s)
    s = re.sub(r'^\s*\d+\s*$', '', s)
    return tidy(s)


def strip_tail(s):
    """去掉頁碼、下一節標題之後的內容。"""
    s = re.split(r'[一二三四五六]、\s*(?:是非題|選擇題|勾選題|連連看|配合題|填空題)', s)[0]
    s = re.sub(r'\s+\d{1,2}\s*$', '', s)
    return s


def parse_mc(block, ans):
    """把選擇題塊切成題幹與四個選項。"""
    b = strip_tail(block)
    # 去掉開頭的答案括號與題號
    b = re.sub(r'^\s*[（(]\s*[０-９\d]+\s*[）)]\s*\d+\s*[.．]\s*', '', b)
    # 找第一個 ① 的位置
    idx = b.find('①')
    if idx < 0:
        return None
    stem = tidy(b[:idx])
    tail = b[idx:]
    parts = re.split(r'([①②③④⑤])', tail)
    opts = {}
    cur = None
    for p in parts:
        if p in '①②③④⑤':
            cur = CIRC.index(p)
            opts[cur] = ''
        elif cur is not None:
            opts[cur] += p
    o = [tidy(opts.get(i, '')).rstrip('。') for i in range(4)]
    if not all(o) or not stem:
        return None
    return stem, o, (FULLNUM.index(ans) - 1) if ans in FULLNUM else int(ans) - 1


def parse_quiz(pagetext, lid):
    items = []
    # 逐頁串接（同一課可能跨頁）
    txt = '\n'.join(pagetext)
    # 清掉頁碼獨立行
    txt = re.sub(r'\n\s*\d{1,2}\s*\n', '\n', txt)

    # --- 是非題 ---
    tf_sec = re.split(r'二、\s*選擇題', txt)[0]
    for m, blk in split_blocks(tf_sec, r'^\s*[（(]\s*([○╳✕×])\s*[）)]\s*(\d+)\s*[.．]'):
        ans = m.group(1)
        stem = clean_stem(blk[m.end() - m.start():])
        stem = strip_tail(stem)
        if len(stem) < 6:
            continue
        items.append(dict(t='tf', q=stem, a=(ans in '○'), hint=''))
    # --- 選擇題 ---
    if '二、' in txt:
        mc_sec = txt.split('二、', 1)[1]
        mc_sec = re.split(r'三、', mc_sec)[0]
        for m, blk in split_blocks(mc_sec, r'^\s*[（(]\s*([０-９\d])\s*[）)]\s*(\d+)\s*[.．]'):
            r = parse_mc(blk, m.group(1))
            if not r:
                continue
            stem, opts, ai = r
            if ai < 0 or ai > 3:
                continue
            items.append(dict(t='mc', q=stem, o=opts, a=ai, hint=''))
    # --- 勾選題 → 逐句轉成是非題 ---
    if '三、勾選題' in txt:
        ck = txt.split('三、勾選題', 1)[1]
        ck = re.split(r'\n\s*\d{1,2}\s*$', ck, flags=re.M)[0]
        note = ''
        nm = re.search(r'●([^\n]+)', ck)
        if nm:
            note = tidy(nm.group(1))
        for m, blk in split_blocks(ck, r'^\s*[（(]\s*(✓|✔|)\s*[）)]\s*[（(]\s*(\d+)\s*[）)]'):
            body = tidy(blk[m.end() - m.start():])
            body = re.sub(r'^\s*[.．、]\s*', '', body)
            body = re.sub(r'\s+\d{1,2}\s*$', '', body).strip()
            if len(body) < 2:
                continue
            items.append(dict(t='tf', q=body, a=(m.group(1) != ''), g='勾選', hint=note))
    # --- 配合題 → 選項固定的單選 ---
    if '三、配合題' in txt:
        mt = txt.split('三、配合題', 1)[1]
        lines = [l for l in mt.splitlines()]
        codes = []
        for l in lines:
            c = tidy(l)
            if re.match(r'^[①②③④⑤]', c) and len(c) > 3 and '）' not in c and '(1)' not in c:
                cc = re.split(r'(?=[①②③④⑤])', c)
                for x in cc:
                    x = x.strip()
                    if len(x) > 1 and x[0] in '①②③④⑤':
                        val = re.sub(r'^[①②③④⑤]\s*', '', x).strip()
                        if val and val not in codes:
                            codes.append(val)
            if len(codes) >= 4 and '（' in l:
                break
        for m, blk in split_blocks(mt, r'^\s*[（(]\s*([０-９\d])\s*[）)]\s*[（(]\s*(\d+)\s*[）)]'):
            body = tidy(blk[m.end() - m.start():])
            body = re.sub(r'\s+\d{1,2}\s*$', '', body).strip()
            if len(body) < 2 or len(codes) < 4:
                continue
            ans = m.group(1)
            ai = (FULLNUM.index(ans) - 1) if ans in FULLNUM else int(ans) - 1
            items.append(dict(t='mc', q='【配合】' + body + '　應屬於下列哪一類？',
                              o=codes[:5], a=ai, hint=''))
    # --- 連連看 → 依課別給對照（由課本重點摘要核對） ---
    if '三、連連看' in txt:
        mt = txt.split('三、連連看', 1)[1]
        pairs = []
        for l in mt.splitlines():
            mm = re.match(r'\s*\((\d+)\)\s*(.+?)\s*˙\s*˙\s*([甲乙丙丁戊])\s*[、,]\s*(.+)', l)
            if mm:
                left = tidy(mm.group(2)).replace(' ', '')
                right = tidy(mm.group(4))
                pairs.append((int(mm.group(1)), left, mm.group(3), right))
        rights = [p[3] for p in pairs]
        # 正解對照（依課本重點摘要）
        KEYMAP = {
            '1-2': {'平原': '乙、平坦廣闊', '盆地': '丁、四周高、中間低平',
                    '丘陵': '甲、高度不超過 1000 公尺、坡度較平緩',
                    '台地': '丙、頂部平坦，邊緣以陡坡和低地相接'},
            '4-2': {'除夕': '乙、發壓歲錢', '清明節': '丙、掃墓祭祖',
                    '端午節': '丁、划龍舟', '中元節': '戊、普渡孤魂野鬼',
                    '中秋節': '甲、賞月'},
        }
        km = KEYMAP.get(lid, {})
        for n, left, letter, right in pairs:
            want = km.get(left)
            if want is None or len(rights) < 3:
                continue
            want = re.sub(r'^[甲乙丙丁戊]、', '', want)
            opts = [re.sub(r'^[甲乙丙丁戊]、', '', x) for x in rights]
            ai = next((i for i, x in enumerate(opts) if x.replace(' ', '') == want.replace(' ', '')), -1)
            if ai < 0:
                continue
            items.append(dict(t='mc', q='【連連看】「' + left + '」應該連到哪一項？',
                              o=opts, a=ai, hint=''))
    return items


# ---------- 重點整理 → 填空題 ----------
BAD = ('第', '單元', '頁', '共', '教師', '學生', '姓名', '社會', '配合')


def parse_fill(pagetext, lid):
    out = []
    for p in pagetext:
        for raw in p.splitlines():
            l = raw.strip()
            if not l or len(l) < 10 or len(l) > 78:
                continue
            if l.startswith(('第', '●', '一、', '二、', '三、')):
                continue
            blanks = re.findall(r'（\s*([^（）]{1,14}?)\s*）', l)
            if len(blanks) != 1:
                continue
            ans = tidy(blanks[0])
            if not ans or len(ans) > 12 or not re.search(r'[\u4e00-\u9fff]', ans):
                continue
            if any(b in ans for b in BAD):
                continue
            stem = tidy(l.replace('（' + blanks[0] + '）', '＿＿＿＿', 1))
            stem = re.sub(r'^\s*\d+\s*[.．、]\s*', '', stem)
            stem = re.sub(r'^\([^)]*\)\s*', '', stem)
            stem = re.sub(r'^[地家從第生器老信傳現][\s　]*', '', stem)
            if len(stem) < 8 or len(stem) > 60 or '＿＿＿＿' not in stem:
                continue
            if re.search(r'[（(][^）)]*[）)]', stem):
                continue
            out.append(dict(t='fill', q=stem, a=ans))
    # 去重
    seen, res = set(), []
    for x in out:
        k = x['q']
        if k in seen:
            continue
        seen.add(k)
        res.append(x)
    return res


def main():
    t_pages = pages(pdftext(TEACH))
    print('教用版頁數', len(t_pages))
    quiz_all, fill_all = {}, {}
    for lid, ip, qp in LESSONS:
        q = parse_quiz([t_pages[i] for i in qp], lid)
        f = parse_fill([t_pages[i] for i in ip], lid)
        quiz_all[lid] = q
        fill_all[lid] = f
        from collections import Counter
        print(lid, '題', len(q), dict(Counter(x['t'] for x in q)), '填空', len(f))
    os.makedirs(OUT, exist_ok=True)
    json.dump(quiz_all, open(os.path.join(OUT, 'quiz_raw.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    # 填空題由 extract_fill.py 獨立產出，這裡不覆寫該檔
    print('TOTAL quiz', sum(len(v) for v in quiz_all.values()))


if __name__ == '__main__':
    main()
