import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectProfile } from '../src/github.mjs';
import { createSnapshot } from '../src/progression.mjs';
import { RENDERERS, picture, renderMobileAuto } from '../src/render.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const config = JSON.parse(await readFile(join(root, 'profile.config.json'), 'utf8'));
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('Defina GH_TOKEN ou GITHUB_TOKEN. Nenhum arquivo foi alterado.');
const target = join(root, 'generated');
const stage = join(root, '.cache', 'generated-stage');
let previous = {};
try { previous = JSON.parse(await readFile(join(target, 'stats.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

// All API requests must succeed before any published artifact is replaced.
const now = new Date();
const raw = await collectProfile(config.username, token, now);
const snapshot = createSnapshot(raw, config, previous, now);
await mkdir(stage, { recursive: true });
try {
  for (const [name, render] of Object.entries(RENDERERS)) {
    for (const theme of ['dark', 'light']) for (const mobile of [false, true]) {
      await writeFile(join(stage, `${name}${mobile ? '-mobile' : ''}-${theme}.svg`), render(snapshot, theme, mobile));
    }
    await writeFile(join(stage, `${name}-mobile-auto.svg`), renderMobileAuto(render, snapshot));
  }
  await writeFile(join(stage, 'stats.json'), JSON.stringify(snapshot, null, 2) + '\n');
  const embed = Object.keys(RENDERERS).map(name => picture(name, config.repository, `DevQuest · ${name}`)).join('\n\n');
  await writeFile(join(stage, 'embed.md'), embed + '\n');
  await mkdir(target, { recursive: true });
  const { readdir } = await import('node:fs/promises');
  for (const filename of await readdir(stage)) await rename(join(stage, filename), join(target, filename));
} finally { await rm(stage, { recursive: true, force: true }); }
console.log(`DevQuest atualizado: nível ${snapshot.progression.level}, ${snapshot.progression.xp} XP, ${snapshot.stats.repositories} repositórios públicos originais.`);
