import fs from 'fs';

const HERE = 'C:/Users/joshu/WorkBuddy AI/tempfolder/math-selflearn';
const R = JSON.parse(fs.readFileSync(HERE + '/data/resolved.json', 'utf8'));

const MK = /\u27E6([^\u27E6\u27E7]*)\u27E7/g;
const BAD_ANS = /EMBED|SHAPE|MERGEFORMAT|EQ\s|\u0013|\u0014|\u0015|□|eq\s|^[,，、]$/i;

const clean = s => s
  .replace(/\u0007/g, ' ¦ ')
  .replace(/[\u0001-\u0008\u000e-\u001f]/g, '')
  .replace(/[ \t\u00a0]+/g, ' ')
  .replace(/¦\s*¦/g, '¦')
  .trim();

const splitLines = t => t
  .replace(/\f/g, '\n')
  .replace(/\u000b/g, '\n')
  .split(/\r\n|\r|\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0);

const SEC_RE = /^([一二三四五六七八九十]+)、\s*(.*)$/;
const ITEM_RE = /^\(?(\d{1,2})\)?[.、．]\s*(.*)$/;
const SUB_RE = /^\((\d{1,2})\)\s*(.*)$/;

function parsePaper(key) {
  const e = R[key];
  if (!e) return [];
  const lines = splitLines(e.qtext);
  const items = [];
  let section = '', sectionTitle = '';
  let cur = null;
  const flush = () => {
    if (cur && (cur.lines.join('').match(MK) || []).length) {
      items.push(cur);
    }
    cur = null;
  };
  for (const line of lines) {
    const ms = line.match(SEC_RE);
    if (ms && line.length < 60) {
      flush();
      section = ms[1];
      sectionTitle = clean(ms[2]);
      continue;
    }
    const mi = line.match(ITEM_RE);
    if (mi && line.length < 400) {
      flush();
      cur = { section, sectionTitle, no: mi[1], lines: [mi[2]] };
      continue;
    }
    if (cur) cur.lines.push(line);
  }
  flush();

  const out = [];
  for (const it of items) {
    let body = clean(it.lines.join(' '));
    const answers = [];
    let bad = false;
    body = body.replace(MK, (_, a) => {
      const v = clean(a);
      if (BAD_ANS.test(v)) bad = true;
      answers.push(v);
      return '\u0001';
    });
    if (bad || answers.length === 0) continue;
    if (answers.some(a => !a)) continue;
    // 去掉題號後殘留的 tab/空白
    let stem = body.replace(/\u0001/g, '＿＿');
    if (stem.length < 6) continue;
    out.push({
      src: key, section: it.section, sectionTitle: it.sectionTitle,
      no: +it.no, stem, answers, nBlank: answers.length,
    });
  }
  return out;
}

const keys = Object.keys(R).filter(k => !k.endsWith('_lesson'));
const all = [];
const stat = [];
for (const k of keys) {
  const items = parsePaper(k);
  all.push(...items);
  stat.push(`${k.padEnd(11)} items=${String(items.length).padStart(3)}`);
}
fs.writeFileSync(HERE + '/data/bank_raw.json', JSON.stringify(all, null, 1), 'utf8');
console.log(stat.join('\n'));
console.log('TOTAL items=' + all.length + ' blanks=' + all.reduce((a, b) => a + b.nBlank, 0));
