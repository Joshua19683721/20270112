# -*- coding: utf-8 -*-
"""課本頁圖 OCR：兩個視覺模型各跑一次，原始輸出落地後再做交叉驗證。

用法：
  python ocr.py run      # 跑模型（可中斷、可續跑），寫入 ocr_raw.json
  python ocr.py match    # 從 ocr_raw.json 產生 ocr.json（秒級，可反覆調參）
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from difflib import SequenceMatcher

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = r"E:\K1151WW_3\Resource\SystemResource\knsh_book\PageContent\Book"
CFG = (r"E:\K1151WW_3\Resource\SystemResource\knsh_book\SystemResource"
       r"\Config\config_page.json")
PJ = json.load(io.open(os.path.join(HERE, 'pages.json'), encoding='utf-8'))
V = json.load(io.open(r"C:\Users\joshu\WorkBuddy AI\tempfolder\ww3\content\WW3.json",
                      encoding='utf-8'))
RAW = os.path.join(HERE, 'ocr_raw.json')
OUT = os.path.join(HERE, 'ocr.json')
TMP = os.path.join(HERE, '_ocr.jpg')
OLLAMA = "http://127.0.0.1:11434/api/generate"

MA = "qwen2.5vl:3b"
MB = "minicpm-v4.5:8b"

PA = ("This is a page from a Taiwanese elementary English textbook. Transcribe the English "
      "text printed on the page, one line per speech bubble, sentence, label or heading, "
      "in reading order. Output ONLY the text lines. No translation, no explanation, "
      "no bullet points.")
PB = ("Transcribe the English text printed on this page, one line per speech bubble or "
      "text block, in reading order. Output only the text, no translation, no explanation.")

CJK = re.compile(r'[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]')
WORD = re.compile(r"[A-Za-z][A-Za-z'\-]*")

# ---- 已知句庫（分歧時挑正確版本）----
CORPUS = set()


def norm(s):
    s = s.lower().replace('\u2019', "'").replace('\u2018', "'")
    s = re.sub(r"[^a-z0-9' ]", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


for L in V['lessons']:
    for s in L['sents']:
        CORPUS.add(norm(s['en']))
    for w in L['words']:
        CORPUS.add(norm(w['w']))


def strip_cjk(t):
    """頁面常混中文註解，只留英文部分。"""
    m = CJK.search(t)
    if not m:
        return t.strip()
    head = t[:m.start()].strip()
    return head if len(WORD.findall(head)) >= 1 else ''


def clean(lines):
    out, seen = [], set()
    for ln in lines:
        t = ln.strip().lstrip('-*\u2022 0123456789. ').strip()
        t = strip_cjk(t)
        t = re.sub(r'\b\d{3}\b', ' ', t)          # 音軌編號 015
        t = re.sub(r'(^|\s)-[A-Za-z]{1,3}-?(?=\s|$)', ' ', t)  # 拼讀標記 -ad -
        t = re.sub(r'\s+', ' ', t).strip(' -')
        if len(t) < 3 or not re.search(r'[A-Za-z]{2}', t):
            continue
        if re.fullmatch(r'(unit|lesson)\s*\d+', t, re.I):
            continue
        k = norm(t)
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(t)
    return out


def prep(rec):
    src = os.path.join(ROOT, rec['src_dir'], rec['src'] + '.jpg')
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if w > 1500:
        im = im.resize((1500, int(h * 1500 / w)), Image.LANCZOS)
    im.save(TMP, 'JPEG', quality=92)
    return TMP


def ask(model, prompt, path, timeout=420):
    b = base64.b64encode(open(path, 'rb').read()).decode()
    body = json.dumps({"model": model, "prompt": prompt, "images": [b],
                       "stream": False, "think": False,
                       "options": {"temperature": 0, "num_predict": 700,
                                   "num_ctx": 2048}}).encode()
    for attempt in range(3):
        req = urllib.request.Request(OLLAMA, body, {"Content-Type": "application/json"})
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode())
            return clean((r.get("response") or "").splitlines())
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:160]
            if attempt == 2:
                print('   ERR', model, msg, flush=True)
                return None
            time.sleep(2)
        except Exception as e:
            if attempt == 2:
                print('   ERR', model, e, flush=True)
                return None
            time.sleep(3)
    return None


def src_dir_map():
    cfg = json.load(io.open(CFG, encoding='utf-8-sig'))
    byn = {}
    for L in cfg['book']['lessons']:
        for p in L['pages']:
            byn[str(p['pageNumber'])] = p['pageUrl'].replace('PageContent/Book/', '')
    for rec in PJ:
        u = byn.get(rec['n'])
        rec['src_dir'] = os.path.dirname(u) if u else ''
    return [r for r in PJ if r['src_dir']]


def cmd_run():
    pages = src_dir_map()
    raw = json.load(io.open(RAW, encoding='utf-8')) if os.path.exists(RAW) else {}
    t0 = time.time()
    for i, rec in enumerate(pages, 1):
        k = rec['key']
        cur = raw.get(k) or {}
        need_a = 'a' not in cur
        need_b = 'b' not in cur
        if not (need_a or need_b):
            continue
        p = prep(rec)
        if need_a:
            cur['a'] = ask(MA, PA, p) or []
        if need_b:
            cur['b'] = ask(MB, PB, p) or []
        raw[k] = cur
        json.dump(raw, io.open(RAW, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('[%2d/%d] %-9s A=%2d B=%2d (%.0fs)' %
              (i, len(pages), k, len(cur['a']), len(cur['b']), time.time() - t0), flush=True)
    print('run 完成，耗時 %.0f 秒' % (time.time() - t0))


# ---------------- 比對 ----------------

def toks(s):
    return WORD.findall(norm(s))


def f1(a, b):
    ta, tb = toks(a), toks(b)
    if not ta or not tb:
        return 0.0
    sa, sb = set(ta), set(tb)
    common = len(sa & sb)
    if not common:
        return 0.0
    p = common / len(sa)
    r = common / len(sb)
    ch = SequenceMatcher(None, norm(a), norm(b)).ratio()
    return max(2 * p * r / (p + r), ch * 0.95)


def best_window(a, lb, used):
    """A 的一行 vs B 的 1~3 行連續視窗（處理行切分不一致）"""
    best, bi, bj = 0.0, -1, -1
    for i in range(len(lb)):
        if i in used:
            continue
        for n in (1, 2, 3):
            if i + n > len(lb):
                break
            seg = lb[i:i + n]
            if any((i + x) in used for x in range(n)):
                break
            s = f1(a, ' '.join(seg))
            if s > best:
                best, bi, bj = s, i, i + n
    return best, bi, bj


def pick(a, seg):
    """兩邊都有 → 選命中句庫的版本，否則選較長（資訊較完整）"""
    na, nb = norm(a), norm(seg)
    if na in CORPUS and nb not in CORPUS:
        return a
    if nb in CORPUS and na not in CORPUS:
        return seg
    if na in CORPUS and nb in CORPUS:
        return a
    return a if len(a) >= len(seg) else seg


SENT_CUE = set("""is are am was were can do does did don't doesn't isn't aren't
let let's it it's i i'm you you're he he's she she's we we're they they're
my your his her this that these those there what how where who why yes no not
look come go get have has want like wake listen say hello hi bye thank thanks
good great ok okay sorry help please""".split())


def is_wordlist(t):
    """dance, draw, sing, swim… 這種逗號串起來的單字表不要。"""
    parts = [p.strip() for p in re.split(r'[,，/、]', t) if p.strip()]
    if len(parts) < 3:
        return False
    for p in parts:
        toks = [w.lower().strip("'") for w in WORD.findall(p)]
        if len(toks) > 4 or any(w in SENT_CUE for w in toks):
            return False
    return True


def is_sentence(t):
    """單字列表頁會讀成 ad dad mad 這種字串，這種不要顯示。"""
    if is_wordlist(t):
        return False
    if re.fullmatch(r"[\w'’\- ]+\s*=\s*[\w'’\- ]+", t.strip()):   # How's = How is
        return False
    if re.search(r'[?!.]\s*$', t):
        return True
    toks = [w.lower().strip("'") for w in WORD.findall(t)]
    if not toks:
        return False
    if any(w in SENT_CUE for w in toks):
        return True
    if len(toks) >= 5 and ',' in t:
        return True
    return False


def postclean(t):
    """match 階段再清一次（原始輸出可能已含舊版清過的殘留）"""
    t = re.sub(r'(^|\s)-[A-Za-z]{1,3}-?(?=\s|$)', ' ', t)   # 拼讀標記 -ad -
    t = re.sub(r'\s+\d{1,3}$', '', t)                        # 尾端音軌號 Read and Say 16
    return re.sub(r'\s+', ' ', t).strip(' -')


def cmd_match(th=0.62):
    raw = json.load(io.open(RAW, encoding='utf-8'))
    res = {}
    for k, v in raw.items():
        la, lb = v.get('a') or [], v.get('b') or []
        lo, hi = min(len(la), len(lb)), max(len(la), len(lb))
        # 一邊明顯漏讀（行數不到另一邊 40%）→ 視為不可靠，用另一邊，標記單模型
        if lo == 0 or (hi >= 6 and lo / hi < 0.4):
            cand = la if len(la) >= len(lb) else lb
            src = "a" if len(la) >= len(lb) else "b"
        else:
            used, cand = set(), []
            for a in la:
                s, i, j = best_window(a, lb, used)
                if s >= th and i >= 0:
                    for x in range(i, j):
                        used.add(x)
                    cand.append(pick(a, ' '.join(lb[i:j])))
            src = "ab"
        keep, seen = [], set()
        for t in cand:
            t = postclean(t)
            if not is_sentence(t):
                continue
            kk = norm(t)
            if not kk or kk in seen:
                continue
            seen.add(kk)
            keep.append(t)
        res[k] = {"v": keep, "single": max(len(la), len(lb)) - len(keep),
                  "a": len(la), "b": len(lb), "m": src}
    json.dump(res, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    tv = sum(len(x['v']) for x in res.values())
    ta = sum(max(x['a'], x['b']) for x in res.values())
    one = sum(1 for x in res.values() if x['m'] != 'ab')
    print('頁數 %d｜候選行數 %d｜採用 %d｜單模型頁 %d' % (len(res), ta, tv, one))
    for k in sorted(res, key=lambda x: int(re.sub(r'\D', '', x) or 0)):
        r = res[k]
        print('  %-9s A=%2d B=%2d 用=%2d 丟=%2d %s' %
              (k, r['a'], r['b'], len(r['v']), r['single'], r['m']))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'run'
    if cmd == 'run':
        cmd_run()
    else:
        cmd_match(float(sys.argv[2]) if len(sys.argv) > 2 else 0.62)
