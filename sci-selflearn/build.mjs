import fs from 'fs';
import path from 'path';

const here = 'C:/Users/joshu/WorkBuddy AI/tempfolder/sci-selflearn';
const read = p => fs.readFileSync(path.join(here, p), 'utf8');

const { META, UNITS } = await import('./content/index.mjs');

const shell = read('app.html');
const app = read('app.js');

const libs = [
  read('vendor/d3.min.js'),
  read('vendor/markmap-view.js'),
  read('vendor/mermaid.min.js')
].map(s => s + '\n;\n').join('');

const data = 'window.APP_DATA=' + JSON.stringify({ META, UNITS }) + ';';

let html = shell
  .replace('/*__LIBS__*/', () => libs)
  .replace('/*__DATA__*/', () => data)
  .replace('/*__APP__*/', () => app);

const out = path.join(here, '自然4上自主學習_期中後.html');
fs.writeFileSync(out, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log('WROTE ' + out);
console.log('size ' + kb + ' KB, units ' + UNITS.length +
  ', items ' + UNITS.reduce((a, u) => a + u.items.length, 0) +
  ', cards ' + UNITS.reduce((a, u) => a + u.cards.length, 0) +
  ', examples ' + UNITS.reduce((a, u) => a + u.examples.length, 0) +
  ', gens ' + UNITS.reduce((a, u) => a + u.gens.length, 0) +
  ', tools ' + UNITS.reduce((a, u) => a + u.tools.length, 0));
