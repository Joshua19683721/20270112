import fs from 'fs';
import path from 'path';

const ROOT = 'E:/02數學';
const OUT = 'C:/Users/joshu/WorkBuddy AI/tempfolder/math-selflearn/manifest3.json';
const UNITS = [6, 7, 8, 9, 10];

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};
const all = walk(ROOT).map(p => p.replace(/\\/g, '/'));
const rel = p => p.slice(ROOT.length + 1);
const pad = n => String(n).padStart(2, '0');

const pick = (predicate) => all.filter(predicate);
const man = { __root: ROOT };
const log = [];

for (const u of UNITS) {
  const U = pad(u);
  const tag = 'u' + u;

  // 教案
  const lesson = pick(p => p.includes('簡易教案') && p.includes('_第' + U + '單元.doc'));
  if (lesson[0]) man[tag + '_lesson'] = rel(lesson[0]);

  // 學前 / 學後 / 基礎 / 素養（教用 WORD）
  const pre = pick(p => p.includes('01單元學前檢測卷/教用(WORD)') && p.includes('第' + U + '單元'));
  if (pre[0]) man[tag + '_pre'] = rel(pre[0]);

  const post = pick(p => p.includes('03單元學後檢測卷/教用(WORD)') && p.includes('第' + U + '單元'));
  if (post[0]) man[tag + '_post'] = rel(post[0]);

  const basic = pick(p => p.includes('06基礎能力練習卷/教用(WORD)') && p.includes('第' + U + '單元'));
  if (basic[0]) man[tag + '_basic'] = rel(basic[0]);

  const lit = pick(p => p.includes('05數學素養單元學習單/教用(WORD)') && p.includes('第' + U + '單元'));
  if (lit[0]) man[tag + '_lit'] = rel(lit[0]);

  // 活動練習單（教用）
  const act = pick(p => p.includes('02活動練習單/教用(WORD)') && p.includes('第' + U + '單元活動'))
    .sort((a, b) => a.localeCompare(b, 'en'));
  act.forEach((p, i) => { man[tag + '_act' + (i + 1)] = rel(p); });

  // 隨堂
  const daily = pick(p => p.includes('04隨堂練習單/教用(WORD)') && p.includes('第' + U + '單元'))
    .sort((a, b) => a.localeCompare(b, 'en'));
  daily.forEach((p, i) => { man[tag + '_daily' + (i + 1)] = rel(p); });

  // 學習單
  const ws = pick(p => p.includes('07學習單/教用(WORD)') && p.includes('第' + U + '單元'))
    .sort((a, b) => a.localeCompare(b, 'en'));
  ws.forEach((p, i) => { man[tag + '_ws' + (i + 1)] = rel(p); });

  log.push(`U${u}: lesson=${lesson.length} pre=${pre.length} post=${post.length} basic=${basic.length} lit=${lit.length} act=${act.length} daily=${daily.length} ws=${ws.length}`);
}

// 月考：第三次月考 A/B（8-10）、期末考 A/B（6-10）
const exams = [
  ['exam3A', '第三次月考A卷'],
  ['exam3B', '第三次月考B卷'],
  ['finalA', '期末考A卷'],
  ['finalB', '期末考B卷'],
];
for (const [k, kw] of exams) {
  const hit = pick(p => p.includes('教用(WORD)') && p.includes(kw));
  if (hit[0]) man[k] = rel(hit[0]);
  log.push(`${k}: ${hit.length}`);
}
const gift = pick(p => p.includes('10挑戰資優卷') && p.includes('(教).doc'));
if (gift[0]) man.gifted = rel(gift[0]);
log.push('gifted: ' + gift.length);

fs.writeFileSync(OUT, JSON.stringify(man, null, 1), 'utf8');
console.log(log.join('\n'));
console.log('keys=' + Object.keys(man).length);
