import { readFile } from 'node:fs/promises';
import { RENDERERS } from '../src/render.mjs';
const root = new URL('../', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('generated/stats.json', root), 'utf8'));
if (!snapshot.generatedAt || !Number.isFinite(snapshot.progression.xp) || snapshot.stats.repositories < 0) throw new Error('Snapshot inválido.');
for (const name of Object.keys(RENDERERS)) for (const theme of ['dark', 'light']) for (const mobile of [false, true]) {
  const path = `generated/${name}${mobile ? '-mobile' : ''}-${theme}.svg`;
  const svg = await readFile(new URL(path, root), 'utf8');
  if (!svg.startsWith('<svg ') || !svg.endsWith('</svg>\n') || /NaN|undefined|Infinity|<script|<foreignObject|https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg', ''))) throw new Error(`SVG inválido: ${path}`);
}
console.log('16 SVGs autossuficientes e snapshot verificados.');
