# -*- coding: utf-8 -*-
"""ARPAbet -> 美式 IPA，含重音與音節切分。

規則：
  - 單音節虛詞（a / the / and / is…）不標重音，避免出現 ˈə。
  - 句子裡單音節詞一律不標重音，只留多音節詞的重音，讀起來才像句子。
"""
import re
import cmudict

_D = cmudict.dict()

VOW = {'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY',
       'IH', 'IY', 'OW', 'OY', 'UH', 'UW'}

MAP = {
    'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ', 'AY': 'aɪ',
    'EH': 'ɛ', 'ER': 'ɝ', 'EY': 'eɪ', 'IH': 'ɪ', 'IY': 'i', 'OW': 'oʊ',
    'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'u',
    'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'ɡ', 'HH': 'h',
    'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p',
    'R': 'r', 'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v', 'W': 'w',
    'Y': 'j', 'Z': 'z', 'ZH': 'ʒ',
}

ONSETS = {
    'PR', 'BR', 'TR', 'DR', 'KR', 'GR', 'FR', 'THR', 'SHR', 'PL', 'BL',
    'KL', 'GL', 'FL', 'SL', 'SP', 'ST', 'SK', 'SM', 'SN', 'SW', 'TW',
    'DW', 'KW', 'GW', 'HW', 'PY', 'TY', 'KY', 'FY', 'VY', 'MY', 'NY',
    'HY', 'BY', 'LY', 'GY', 'DY', 'SY', 'ZY',
    'SPR', 'STR', 'SKR', 'SPL', 'SKW', 'SPY', 'STY', 'SKY',
}

# 字典查不到的手動音標（專有名詞、複合詞）
MANUAL = {
    "jack-o'-lantern": 'ˈdʒæk ə ˈlæntərn',
    "jack-o-lantern": 'ˈdʒæk ə ˈlæntərn',
    'taichung': 'ˌtaɪˈtʃʊŋ',
    'tainan': 'ˌtaɪˈnɑn',
    'yilan': 'ˌiˈlɑn',
    'hsinchu': 'ˌʃɪnˈtʃu',
    'kaohsiung': 'ˌkaʊˈʃʊŋ',
    'chiayi': 'ˌtʃiˈɑi',
    'taitung': 'ˌtaɪˈtʊŋ',
    'taipei': 'ˌtaɪˈpeɪ',
    'boka': 'ˈboʊkə',
    'kevin': 'ˈkɛvɪn',
}

CJK = re.compile(r'[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]+')


def _split_phones(phones):
    vi = [i for i, p in enumerate(phones) if p.rstrip('012') in VOW]
    if not vi:
        return []
    syls = []
    for k, i in enumerate(vi):
        start = 0 if k == 0 else vi[k - 1] + 1
        cluster = phones[start:i]
        if k == 0:
            onset = cluster
        else:
            onset = []
            for take in (3, 2, 1):
                if len(cluster) >= take and ''.join(cluster[-take:]) in ONSETS:
                    onset = cluster[-take:]
                    break
            if not onset and cluster:
                onset = cluster[-1:]
        coda_start = start + len(cluster) - len(onset)
        coda = phones[coda_start:i]
        if syls:
            syls[-1][2].extend(phones[syls[-1][3] + 1:coda_start])
        syls.append([onset, phones[i], [], i])
    last = vi[-1]
    if syls:
        syls[-1][2].extend(phones[last + 1:])
    return [(s[0], s[1], s[2]) for s in syls]


def _ph(p):
    base = p.rstrip('012')
    st = p[len(base):]
    if base == 'AH':
        return 'ə' if st == '0' else 'ʌ'
    if base == 'ER':
        return 'ɚ' if st == '0' else 'ɝ'
    return MAP.get(base, base.lower())


def _core(key):
    """回傳 (ipa, 音節數, 主重音在第幾節或 -1)"""
    phones = _D[key][0]
    syls = _split_phones(phones)
    if not syls:
        return ''.join(_ph(p) for p in phones), 1, 0
    stress = [s[1][-1:] if s[1][-1:].isdigit() else '0' for s in syls]
    if '1' not in stress:
        for i, s in enumerate(stress):
            if s == '2':
                stress[i] = '1'
                break
    else:
        ones = [i for i, s in enumerate(stress) if s == '1']
        for i in ones[:-1]:
            stress[i] = '2'
    out = []
    for i, (on, v, cd) in enumerate(syls):
        mark = 'ˈ' if stress[i] == '1' else ('ˌ' if stress[i] == '2' else '')
        out.append(mark + ''.join(_ph(p) for p in on) + _ph(v) +
                   ''.join(_ph(p) for p in cd))
    primary = stress.index('1') if '1' in stress else -1
    return ''.join(out), len(syls), primary


def word_ipa(word, sent=False):
    """單字 / 連字號詞 / 空白分隔詞組 -> IPA。
       sent=True 時，單音節詞不標重音（句子裡不需要）。"""
    key = word.lower().strip()
    if not key:
        return ''
    if ' ' in key:
        return ' '.join(p for p in (word_ipa(x, sent) for x in key.split()) if p)
    if key in MANUAL:
        s = MANUAL[key]
        return s.lstrip('ˈˌ') if (sent and s.count('ˈ') + s.count('ˌ') == 1) else s
    if '-' in key and key.replace('-', '') not in _D:
        return '-'.join(x for x in (word_ipa(p, sent) for p in key.split('-') if p) if x)
    if key not in _D:
        return ''
    s, n, primary = _core(key)
    if n == 1 and (sent or primary < 0):
        return s.lstrip('ˈˌ')
    return s


_TOK = re.compile(r"[A-Za-z][A-Za-z'\-]*|[^A-Za-z\s]+|\s+")


def sent_ipa(text):
    """整句轉 IPA：逐詞轉（單音節不標重音），標點直接黏回去。
       中英夾雜時只取含英文的片段，避免中文字被剝掉後留下孤立的數字。"""
    segs = [s for s in CJK.split(text.replace('／', ' / '))
            if len(re.findall(r'[A-Za-z]', s)) >= 2]
    if not segs:
        return ''
    text = ' '.join(segs)
    out = []
    for m in _TOK.finditer(text):
        t = m.group(0)
        if t.isspace():
            out.append(' ')
        elif re.match(r'[A-Za-z]', t):
            out.append(word_ipa(t, sent=True) or t.lower())
        else:
            out.append(t)
    s = ''.join(out)
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\s+([,.!?;:])', r'\1', s)
    return s


if __name__ == '__main__':
    for t in ['eleven', 'thirteen', 'twenty', 'weather', 'sunny', 'umbrella',
              'earthquake', 'beautiful', 'honest', 'delicious', 'library',
              'a', 'the', 'and', 'is', 'it', 'of', 'to', 'in', 'on']:
        print('%-12s %s' % (t, word_ipa(t)))
    print()
    for s in ["How's the weather?", "It's a cat.", "Is it a cat?",
              "It's sunny and windy.", "Let's go to the park."]:
        print('%-26s %s' % (s, sent_ipa(s)))
