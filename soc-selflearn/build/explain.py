# -*- coding: utf-8 -*-
"""用本機 qwen2.5:7b 為題庫逐題產生「為什麼」詳解（以課本重點摘要為依據）。"""
import json, os, re, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from opencc import OpenCC

CC = OpenCC('s2twp')
TW = [('视频', '影片'), ('軟體', '軟體'), ('信息', '資訊'), ('網絡', '網路'),
      ('数据', '資料'), ('质量', '品質'), ('塑料', '塑膠'), ('自行車', '自行車'),
      ('公里', '公里'), ('公尺', '公尺'), ('里面', '裡面'), ('什么', '什麼'),
      ('为了', '為了'), ('因为', '因為'), ('所以', '所以'), ('这个', '這個'),
      ('那个', '那個'), ('哪些', '哪些'), ('台湾', '臺灣'), ('台灣', '臺灣'),
      ('台北', '臺北'), ('台中', '臺中'), ('台南', '臺南'), ('台東', '臺東'),
      ('台西', '臺西')]


def tw(s):
    s = CC.convert(s)
    for a, b in TW:
        s = s.replace(a, b)
    return s


E = r'E:\01_大補帖(領域)'
SUMMARY = os.path.join(E, r'09_重點摘要PPT\11_國小社會4上重點摘要(全冊)_(教).pdf')
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
LESSONS = ['1-1', '1-2', '1-3', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '4-3']


def summary(i):
    r = subprocess.run(['pdftotext', '-f', str(i + 1), '-l', str(i + 1), '-layout', SUMMARY, '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    return re.sub(r'[ \t]+', ' ', r.stdout)[:1500]


def ask(prompt):
    body = json.dumps(dict(model='qwen2.5:7b', prompt=prompt, stream=False,
                           options=dict(temperature=0.25, num_predict=520,
                                        num_ctx=3072))).encode('utf-8')
    req = urllib.request.Request('http://localhost:11434/api/generate', data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as f:
        return json.loads(f.read().decode('utf-8'))['response']


def item_line(it):
    if it['t'] == 'tf':
        return '題：' + it['q'] + '　正確答案：' + ('正確（○）' if it['a'] else '錯誤（╳）')
    if it['t'] == 'mc':
        return ('題：' + it['q'] + '　選項：' + '／'.join(it['o']) +
                '　正確答案：' + it['o'][it['a']])
    return '題：' + it['q'] + '　正確答案：' + it['a']


def batch(args):
    lid, idx, ctx, chunk = args
    lines = '\n'.join('%d. %s' % (n + 1, item_line(it)) for n, it in enumerate(chunk))
    p = ('你是臺灣國小四年級社會科老師。以下是這一課的課本重點：\n'
         '<<<\n' + ctx + '\n>>>\n\n'
         '請為下面每一題寫一句「為什麼答案是這個」的詳解，給小四學生看。\n'
         '規則：\n'
         '1. 只根據上面的課本重點，不可以自己編課本沒有的知識。\n'
         '2. 每句 18～45 個字，要指出關鍵概念；答「錯誤」的題目要順便說正確說法。\n'
         '3. 用臺灣慣用繁體中文，不要出現英文、不要出現「根據題目」「本題」這種贅詞。\n'
         '4. 嚴格輸出 N 行，格式為「編號.詳解」，不要有標題、不要有額外說明。\n\n'
         '題目：\n' + lines + '\n\n詳解：\n')
    try:
        r = ask(p)
    except Exception as e:
        print('ERR batch', lid, idx, e)
        return (lid, idx, {})
    out = {}
    for line in r.splitlines():
        m = re.match(r'^\s*(\d+)\s*[.．、|]\s*(.+)$', line)
        if not m:
            continue
        n = int(m.group(1)) - 1
        s = tw(m.group(2)).strip()
        s = re.sub(r'^[「"『]|["」』]$', '', s)
        s = re.sub(r'[A-Za-z]{2,}', '', s)
        if 8 <= len(s) <= 70 and 0 <= n < len(chunk):
            out[n] = s.rstrip('。') + '。'
    return (lid, idx, out)


def main():
    quiz = json.load(open(os.path.join(PROJ, 'data', 'quiz_raw.json'), encoding='utf-8'))
    jobs = []
    for li, lid in enumerate(LESSONS):
        ctx = summary(li)
        items = quiz[lid]
        for s in range(0, len(items), 6):
            jobs.append((lid, s, ctx, items[s:s + 6]))
    print('batches', len(jobs), 'items', sum(len(j[3]) for j in jobs))
    why = {}
    with ThreadPoolExecutor(max_workers=4) as ex:
        for lid, s, out in ex.map(batch, jobs):
            for n, v in out.items():
                why['%s#%d' % (lid, s + n)] = v
    json.dump(why, open(os.path.join(PROJ, 'data', 'why.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    total = sum(len(quiz[l]) for l in LESSONS)
    print('explanations', len(why), '/', total)
    for k in list(why)[:6]:
        print(' ', k, why[k])


if __name__ == '__main__':
    main()
