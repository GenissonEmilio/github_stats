import test from 'node:test';
import assert from 'node:assert/strict';
import { graphql, collectProfile } from '../src/github.mjs';

test('API incompleta falha em vez de publicar zeros', async () => {
  await assert.rejects(graphql('query', {}, 'test', async () => ({ ok: true, json: async () => ({ errors: [{ message: 'bad query' }] }) })), /incompleta/);
  await assert.rejects(graphql('query', {}, 'test', async () => ({ ok: false, status: 401 })), /HTTP 401/);
});
test('API pagina repositórios, exclui privados e soma os anos sem sobreposição', async () => {
  const calls = [];
  const totals = { totalCommitContributions: 10, totalPullRequestContributions: 2, totalIssueContributions: 1, totalPullRequestReviewContributions: 3 };
  const fetcher = async (url, options) => {
    const { query, variables } = JSON.parse(options.body);
    calls.push(variables);
    let user;
    if (query.includes('repositories(first:100')) {
      const next = variables.cursor === null;
      const repo = { name: next ? 'first' : 'second', isPrivate: false, languages: { pageInfo: { hasNextPage: false }, edges: [] } };
      user = { repositories: { nodes: [repo, { ...repo, isPrivate: true }], pageInfo: { hasNextPage: next, endCursor: next ? 'page2' : null } } };
    } else if (query.includes('createdAt')) user = { createdAt: '2025-12-31T23:59:00Z', contributionsCollection: totals };
    else user = { contributionsCollection: totals };
    return { ok: true, status: 200, json: async () => ({ data: { user } }) };
  };
  const raw = await collectProfile('GenissonEmilio', 'test', new Date('2026-10-31T18:00:00Z'), fetcher);
  assert.deepEqual(raw.repositories.map(repo => repo.name), ['first', 'second']);
  assert.deepEqual(raw.lifetime, { commits: 20, prs: 4, issues: 2, reviews: 6 });
  assert.equal(calls.at(-2).to, '2025-12-31T23:59:59Z');
  assert.equal(calls.at(-1).from, '2026-01-01T00:00:00Z');
});
test('usuário inválido é rejeitado antes de fazer requisições', async () => {
  await assert.rejects(collectProfile('bad/name', 'test'), /inválido/);
});
