# -*- coding: utf-8 -*-
"""從隨堂練習「重點整理」(教用版, -raw 模式) 產生填空題。"""
import json, os, re, subprocess

ROOT = r'E:\01_大補帖(領域)\12_隨堂練習'
TEACH = os.path.join(ROOT, '01_國小社會4上隨堂練習_(教).pdf')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'data', 'fill_raw.json')

# 重點整理所在頁 (0-based)
PAGES = {'1-1': [1], '1-2': [3], '1-3': [5], '2-1': [7], '2-2': [9],
         '3-1': [11, 12], '3-2': [14], '4-1': [16, 17], '4-2': [19], '4-3': [22]}

BAD_ANS = ('第', '單元', '頁', '共', '教師', '學生', '姓名', '社會', '配合', '課')


def tidy(s):
    s = s.replace('\u3000', ' ')
    s = re.sub(r'\s+', '', s)
    return s.strip()


def statements(page):
    lines = []
    for l in page.splitlines():
        l = l.strip()
        if not l:
            continue
        if re.fullmatch(r'\d{1,2}', l):          # 頁碼
            continue
        if re.fullmatch(r'[\u4e00-\u9fff]', l):  # 左側直排標籤
            continue
        if l.startswith(('第一單元', '第二單元', '第三單元', '第四單元', '社會 4')):
            continue
        lines.append(l)
    joined = ''.join(lines)
    # 敘述邊界：編號 1. / (1) / 1、
    parts = re.split(r'(?=(?:\(\d+\)|\d+\s*[.、]))', joined)
    return [tidy(p) for p in parts if p.strip()]


def main():
    out = {}
    txt = subprocess.run(['pdftotext', '-raw', TEACH, '-'], capture_output=True,
                         text=True, encoding='utf-8', errors='replace').stdout
    pgs = txt.split('\f')
    for lid, ids in PAGES.items():
        sts = []
        for i in ids:
            sts += statements(pgs[i])
        items, seen = [], set()
        for s in sts:
            if len(s) < 12 or len(s) > 95:
                continue
            blanks = list(re.finditer(r'（\s*([^（）]{1,14}?)\s*）', s))
            if not (1 <= len(blanks) <= 4):
                continue
            for k, m in enumerate(blanks):
                ans = tidy(m.group(1))
                if not ans or len(ans) > 10 or not re.search(r'[\u4e00-\u9fff]', ans):
                    continue
                if any(b in ans for b in BAD_ANS):
                    continue
                # 除了目標空之外，其餘空保留答案，讓題意完整
                pieces, pos = [], 0
                for j, b in enumerate(blanks):
                    pieces.append(s[pos:b.start()])
                    pieces.append('＿＿＿＿' if j == k else '「' + tidy(b.group(1)) + '」')
                    pos = b.end()
                pieces.append(s[pos:])
                stem = ''.join(pieces)
                stem = re.sub(r'^\(?\d+\)?\s*[.、]?\s*', '', stem)
                stem = re.sub(r'^\d+\s*[.、]\s*', '', stem)
                if len(stem) < 10 or '＿＿＿＿' not in stem:
                    continue
                if stem in seen:
                    continue
                seen.add(stem)
                items.append(dict(t='fill', q=stem, a=ans))
        # 每課至少留 24 題，優先短句
        items.sort(key=lambda x: len(x['q']))
        out[lid] = items[:24]
        print(lid, len(out[lid]))
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('TOTAL', sum(len(v) for v in out.values()))


if __name__ == '__main__':
    main()
