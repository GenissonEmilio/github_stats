import { readFile } from 'node:fs/promises';
import { RENDERERS } from '../src/render.mjs';
const root = new URL('../', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('generated/stats.json', root), 'utf8'));
if (!snapshot.generatedAt || !Number.isFinite(snapshot.progression.xp) || snapshot.stats.repositories < 0) throw new Error('Snapshot inválido.');
for (const name of Object.keys(RENDERERS)) for (const variant of ['dark', 'light', 'mobile-dark', 'mobile-light', 'mobile-auto']) {
  const path = `generated/${name}-${variant}.svg`;
  const svg = await readFile(new URL(path, root), 'utf8');
  if (!svg.startsWith('<svg ') || !svg.endsWith('</svg>\n') || /NaN|undefined|Infinity|<script|<foreignObject|https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg', ''))) throw new Error(`SVG inválido: ${path}`);
}
console.log('20 SVGs autossuficientes e snapshot verificados.');
