import test from 'node:test';
import assert from 'node:assert/strict';
import { progression, activity, createSnapshot } from '../src/progression.mjs';
import { RENDERERS, escapeXml, picture, renderMobileAuto } from '../src/render.mjs';

const now = new Date('2026-10-31T18:00:00Z');
const config = { username: 'GenissonEmilio', displayName: 'Genisson <Emilio>', className: 'Full Stack', tagline: 'Código & café', specialties: ['WEB', 'IA', 'GAMES'], repository: 'GenissonEmilio/github_stats' };
const day = (date, contributionCount) => ({ date, contributionCount });
const raw = () => ({
  user: { createdAt: '2022-12-13T19:54:13Z', followers: { totalCount: 38 }, contributionsCollection: {
    totalCommitContributions: 100, totalPullRequestContributions: 2, totalIssueContributions: 1, totalPullRequestReviewContributions: 0,
    contributionCalendar: { totalContributions: 103, weeks: [{ contributionDays: [day('2026-10-30', 2), day('2026-10-31', 3)] }] },
  } },
  repositories: [{ name: 'public', stargazerCount: 4, forkCount: 1, languages: { edges: [
    { size: 750, node: { name: 'TypeScript', color: '#3178c6' } },
    { size: 250, node: { name: 'Python', color: '#3572A5' } },
  ] } }],
  lifetime: { commits: 150, prs: 12, issues: 4, reviews: 8 },
});

test('XP usa pesos declarados e limites quadráticos exatos', () => {
  assert.equal(progression({ commits: 1, prs: 1, issues: 1, reviews: 1 }).xp, 90);
  assert.equal(progression({}).level, 1);
  assert.equal(progression({ commits: 9 }).level, 1);
  assert.equal(progression({ commits: 10 }).level, 2);
  assert.equal(progression({ commits: 40 }).level, 3);
  assert.equal(progression({ commits: 40 }).progress, 0);
  assert.equal(progression({ commits: 160 }).rank.code, 'D');
  assert.equal(progression({ commits: 562_500 }).rank.code, 'S+');
});
test('XP conquistado não regride quando o histórico fica indisponível', () => {
  assert.equal(progression({ commits: 1 }, 5000).xp, 5000);
  assert.equal(progression({ commits: 600 }, 5000).xp, 6000);
});
test('sequência aceita hoje ainda vazio, mas não ignora dia perdido', () => {
  const days = [day('2026-10-28', 1), day('2026-10-29', 2), day('2026-10-30', 1), day('2026-10-31', 0)];
  assert.equal(activity(days, now).current, 3);
  assert.equal(activity(days.slice(0, 2), now).current, 0);
  assert.equal(activity([...days.slice(0, 3), day('2026-10-31', 3)], now).current, 4);
});
test('dias ausentes quebram o recorde e datas futuras são ignoradas', () => {
  const result = activity([day('2026-10-20', 1), day('2026-10-25', 1), day('2026-10-26', 1), day('2026-11-01', 999)], now);
  assert.equal(result.best, 2);
  assert.equal(result.last30, 3);
  assert.equal(result.recent.length, 112);
});
test('sequências atravessam mês e ano bissexto', () => {
  const days = [day('2024-02-28', 1), day('2024-02-29', 1), day('2024-03-01', 1)];
  assert.equal(activity(days, new Date('2024-03-01T12:00:00Z')).current, 3);
});
test('percentuais mantêm o total de todas as linguagens e arquivos vazios funcionam', () => {
  const s = createSnapshot(raw(), config, {}, now);
  assert.equal(s.languages[0].percent, 75);
  assert.equal(s.stats.repositories, 1);
  assert.equal(s.stats.stars, 4);
  const empty = raw(); empty.repositories = [];
  assert.deepEqual(createSnapshot(empty, config, {}, now).languages, []);
});
test('conquistas persistem e nunca vazam para outro usuário', () => {
  const first = createSnapshot(raw(), config, {}, now);
  const reduced = raw(); reduced.lifetime = { commits: 0, prs: 0, issues: 0, reviews: 0 };
  const second = createSnapshot(reduced, config, first, now);
  assert.equal(second.achievements[0].unlockedAt, '2026-10-31');
  assert.equal(second.progression.xp, first.progression.xp);
  const other = createSnapshot(reduced, { ...config, username: 'Another' }, first, now);
  assert.equal(other.progression.xp, 0);
  assert.equal(other.achievements[0].unlockedAt, null);
});
test('missões avançam para o próximo marco ao atingir a meta', () => {
  const fixture = raw(); fixture.repositories[0].stargazerCount = 25;
  const s = createSnapshot(fixture, config, {}, now);
  assert.equal(s.quests[2].target, 50);
  assert.equal(s.quests[2].value, 25);
});
test('16 variantes escapam dados e são imagens sem dependências externas', () => {
  const s = createSnapshot(raw(), config, {}, now);
  for (const render of Object.values(RENDERERS)) for (const theme of ['dark', 'light']) for (const compact of [true, false]) {
    const svg = render(s, theme, compact);
    assert.match(svg, /role="img" aria-labelledby="title desc"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|NaN|undefined/);
    assert.doesNotMatch(svg, /Genisson <Emilio>/);
    assert.match(svg, compact ? /width="480"/ : /width="960"/);
  }
  assert.equal(escapeXml('<x a="1">&\''), '&lt;x a=&quot;1&quot;&gt;&amp;&apos;');
  assert.match(picture('hero', config.repository, 'A & B'), /A &amp; B/);
});
test('fonte mobile evita reescrita de media composta pelo GitHub e herda tema', () => {
  const s = createSnapshot(raw(), config, {}, now);
  const embed = picture('hero', config.repository, 'Player');
  assert.doesNotMatch(embed, /and \(prefers-color-scheme/);
  assert.match(embed, /media="\(max-width: 600px\)" srcset="[^\"]+-mobile-auto.svg"/);
  for (const render of Object.values(RENDERERS)) {
    const svg = renderMobileAuto(render, s);
    assert.match(svg, /@media\(prefers-color-scheme:light\)/);
    assert.match(svg, /fill="var\(--ge-bg\)"/);
    assert.match(svg, /width="480"/);
    assert.doesNotMatch(svg, /undefined|NaN/);
  }
});
