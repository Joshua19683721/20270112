import fs from 'fs';

const HERE = 'C:/Users/joshu/WorkBuddy AI/tempfolder/math-selflearn';
const raw = JSON.parse(fs.readFileSync(HERE + '/data/raw3.json', 'utf8'));

const isBlankish = s => /^[\s\u3000\u00a0]*$/.test(s);

function splitArgs(inner) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of inner) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function findGroup(s, start) {
  // s[start] === '('
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') { depth--; if (depth === 0) return { inner: s.slice(start + 1, i), end: i }; }
  }
  return null;
}

function evalEq(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\') {
      let j = i + 1, name = '';
      while (j < s.length && /[A-Za-z]/.test(s[j])) { name += s[j]; j++; }
      while (j < s.length && s[j] === ' ') j++;
      if (s[j] === '(') {
        const g = findGroup(s, j);
        if (g) {
          out += applyCmd(name.toLowerCase(), g.inner);
          i = g.end + 1;
          continue;
        }
      }
      i = j;
      continue;
    }
    out += s[i];
    i++;
  }
  return out;
}

function applyCmd(name, inner) {
  const args = splitArgs(inner);
  switch (name) {
    case 'o': { // overstrike \o(a,b)
      const a2 = splitArgs(inner).map(evalEq);
      if (a2.length >= 2) {
        const [a, b] = a2;
        if (isBlankish(a)) return b;
        if (isBlankish(b)) return a;
        return a + b;
      }
      return a2.join('');
    }
    case 'f': { // fraction
      if (args.length >= 2) return evalEq(args[0]).trim() + '/' + evalEq(args[1]).trim();
      return evalEq(inner);
    }
    case 's': { // \s\up N(...)
      const sub = inner.replace(/^\s*(up|do)\s*-?\d+\s*/, '');
      return evalEq(sub);
    }
    case 'r': { // \r(n,x)
      const n = parseInt(args[0], 10);
      const t = evalEq(args.slice(1).join(','));
      return isNaN(n) ? t : t.repeat(Math.min(n, 20));
    }
    case 'b': { // bracket \b\bc\((...)\)
      return evalEq(inner.replace(/^[a-z]+\s*/, ''));
    }
    case 'l': { // list
      return evalEq(inner.replace(/^[a-z]+\s*/, ''));
    }
    case 'a': { // array
      return args.map(evalEq).join(' ');
    }
    default:
      return evalEq(inner);
  }
}

function resolveCode(code) {
  let s = String(code || '').trim();
  s = s.replace(/^eq\s+/i, '');
  s = s.replace(/\\o\s*\\ac\s*\(/gi, '\\o(');
  return evalEq(s).replace(/[\r\n]/g, '').trim();
}

const PH = '\u0015';
const MK_L = '\u27E6', MK_R = '\u27E7';
const out = {};
const stats = [];

for (const [key, e] of Object.entries(raw)) {
  const txt = e.text || '';
  const codes = e.codes || [];
  const vals = codes.map(resolveCode);
  let ai = 0;
  let qtext = '';
  let filled = 0, empty = 0;
  for (const ch of txt) {
    if (ch === PH) {
      const v = ai < vals.length ? vals[ai] : '';
      if (v) filled++; else empty++;
      qtext += MK_L + v + MK_R;
      ai++;
    } else {
      qtext += ch;
    }
  }
  out[key] = { file: e.file, text: txt, qtext, nFields: vals.length, nPh: (txt.match(/\u0015/g) || []).length, filled, empty };
  stats.push(`${key.padEnd(11)} ph=${String(out[key].nPh).padStart(3)} fields=${String(vals.length).padStart(3)} filled=${String(filled).padStart(3)} empty=${String(empty).padStart(3)}`);
}

fs.writeFileSync(HERE + '/data/resolved.json', JSON.stringify(out), 'utf8');
console.log(stats.join('\n'));
const t = stats.reduce((a, s) => {
  const m = s.match(/ph=\s*(\d+) fields=\s*(\d+) filled=\s*(\d+) empty=\s*(\d+)/);
  a.ph += +m[1]; a.f += +m[2]; a.fl += +m[3]; a.em += +m[4]; return a;
}, { ph: 0, f: 0, fl: 0, em: 0 });
console.log(`TOTAL ph=${t.ph} fields=${t.f} filled=${t.fl} empty=${t.em}`);
