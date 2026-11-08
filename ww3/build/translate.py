# -*- coding: utf-8 -*-
"""把 OCR 出來的頁面句子翻成繁體中文（臺灣小學用語）。
   先沿用既有句庫的翻譯，只把沒見過的句子送本機模型。"""
import io
import json
import os
import re
import time
import urllib.request

from opencc import OpenCC

CC = OpenCC('s2twp')          # 簡 -> 繁體（臺灣用語）

# 轉完仍是大陸用語的，再換一次
TW_TERMS = [
    ('單詞', '單字'), ('信息', '資訊'), ('視頻', '影片'), ('打印', '列印'),
    ('網絡', '網路'), ('軟件', '軟體'), ('硬盤', '硬碟'), ('鼠標', '滑鼠'),
    ('服務器', '伺服器'), ('內存', '記憶體'), ('屏幕', '螢幕'), ('短信', '簡訊'),
    ('自行車', '腳踏車'), ('公交車', '公車'), ('出租車', '計程車'),
    ('土豆', '馬鈴薯'), ('西紅柿', '番茄'), ('幼兒園', '幼稚園'),
    ('默認', '預設'), ('優化', '調整'), ('高清', '高畫質'),
]


def tw(z):
    for a, b in TW_TERMS:
        z = z.replace(a, b)
    return z
HERE = os.path.dirname(os.path.abspath(__file__))
OCR = os.path.join(HERE, 'ocr.json')
OUT = os.path.join(HERE, 'ocr_zh.json')
V = json.load(io.open(r"C:\Users\joshu\WorkBuddy AI\tempfolder\ww3\content\WW3.json",
                      encoding='utf-8'))
OLLAMA = "http://127.0.0.1:11434/api/generate"
MODEL = "qwen2.5:7b"


def norm(s):
    s = s.lower().replace('\u2019', "'").replace('\u2018', "'")
    s = re.sub(r"[^a-z0-9' ]", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


# 既有翻譯
KNOWN = {}
for L in V['lessons']:
    for s in L['sents']:
        if s.get('zh'):
            KNOWN.setdefault(norm(s['en']), s['zh'])

PROMPT = """你是臺灣國小英語老師。把下面每一句英文翻成自然、口語的繁體中文，給四年級學生看。
規則：
- 只輸出編號加翻譯，一行一句，格式 `1. 中文`，不要解釋、不要加註。
- 用臺灣用語（例如「橡皮擦」「彩色筆」「颱風」），不要用中國大陸用語。
- 驚嘆詞照語氣翻（Hooray! → 太棒了！）。
- 人名地名保留原文（Boka、Kevin、Taichung 可寫臺中）。
- 課本指令句照臺灣課本說法：Listen and Say→聽一聽，說一說；Look and Match→看一看，連連看；
  Listen and Number→聽一聽，寫上編號；Read and Say→讀一讀，說一說；Point and Say→指一指，說一說；
  Look, Read, and Write→看一看，讀一讀，寫一寫；Repeat after me→跟著我說。
- 翻不出合理意思就照字面翻，不要自己編故事。

句子：
%s"""


def call(lines):
    body = json.dumps({"model": MODEL, "prompt": PROMPT % "\n".join(lines),
                       "stream": False, "think": False,
                       "options": {"temperature": 0, "num_predict": 900}}).encode()
    req = urllib.request.Request(OLLAMA, body, {"Content-Type": "application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=300).read().decode())
    return r.get("response", "") or ""


def parse(txt, n):
    out = [""] * n
    for line in txt.splitlines():
        m = re.match(r'\s*(\d+)\s*[.、)]\s*(.+)', line)
        if not m:
            continue
        i = int(m.group(1)) - 1
        if 0 <= i < n and not out[i]:
            z = tw(CC.convert(m.group(2).strip()))
            if not re.search(r'[。！？…]$', z):
                z = z.rstrip('，,、 ') + '。'
            out[i] = z
    return out


def main():
    ocr = json.load(io.open(OCR, encoding='utf-8'))
    lines, seen = [], set()
    for v in ocr.values():
        for t in v['v']:
            if t not in seen:
                seen.add(t)
                lines.append(t)
    res = {}
    todo = []
    for t in lines:
        k = norm(t)
        if k in KNOWN:
            res[t] = KNOWN[k]
        else:
            todo.append(t)
    print('OCR 不重複句子 %d，沿用既有翻譯 %d，待翻 %d' %
          (len(lines), len(res), len(todo)))

    if os.path.exists(OUT):
        res.update(json.load(io.open(OUT, encoding='utf-8')))
        todo = [t for t in todo if not res.get(t)]

    B = 12
    t0 = time.time()
    for i in range(0, len(todo), B):
        chunk = todo[i:i + B]
        num = ['%d. %s' % (j + 1, t) for j, t in enumerate(chunk)]
        try:
            got = parse(call(num), len(chunk))
        except Exception as e:
            print('  ERR', e)
            continue
        for t, z in zip(chunk, got):
            if z:
                res[t] = z
        json.dump(res, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('  [%d/%d] %s' % (min(i + B, len(todo)), len(todo),
                                ' / '.join(got[:2])[:60]), flush=True)

    json.dump(res, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    miss = [t for t in lines if not res.get(t)]
    print('完成 %d 筆，缺 %d 筆，耗時 %.0f 秒' % (len(res), len(miss), time.time() - t0))
    for m in miss[:10]:
        print('  缺:', m)


if __name__ == '__main__':
    main()
