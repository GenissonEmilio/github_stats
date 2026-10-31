const endpoint = 'https://api.github.com/graphql';

export async function graphql(query, variables, token, fetcher = fetch) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Genisson-DevQuest' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status >= 500 && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`GitHub respondeu HTTP ${response.status}. Painel anterior preservado.`);
    const payload = await response.json();
    if (payload.errors?.length || !payload.data?.user) {
      throw new Error('Consulta GitHub incompleta ou usuário inexistente. Painel anterior preservado.');
    }
    return payload.data.user;
  }
}

const totals = `totalCommitContributions totalPullRequestContributions
  totalIssueContributions totalPullRequestReviewContributions`;

export async function collectProfile(login, token, now = new Date(), fetcher = fetch) {
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(login)) throw new Error('Usuário GitHub inválido.');
  const to = now.toISOString();
  const from = new Date(now.getTime() - 365 * 86400_000).toISOString();
  const user = await graphql(`query($login:String!,$from:DateTime!,$to:DateTime!) {
    user(login:$login) { login name createdAt followers { totalCount }
      contributionsCollection(from:$from,to:$to) { ${totals}
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }
    }
  }`, { login, from, to }, token, fetcher);

  const repositories = [];
  let cursor = null;
  do {
    const result = await graphql(`query($login:String!,$cursor:String) {
      user(login:$login) {
        repositories(first:100,after:$cursor,ownerAffiliations:OWNER,privacy:PUBLIC,isFork:false) {
          pageInfo { hasNextPage endCursor }
          nodes { name isPrivate isArchived stargazerCount forkCount
            languages(first:100,orderBy:{field:SIZE,direction:DESC}) {
              pageInfo { hasNextPage }
              edges { size node { name color } }
            }
          }
        }
      }
    }`, { login, cursor }, token, fetcher);
    const page = result.repositories;
    if (page.nodes.some(repo => repo.languages.pageInfo.hasNextPage)) throw new Error('Paginação de linguagens incompleta.');
    repositories.push(...page.nodes.filter(repo => !repo.isPrivate));
    if (page.pageInfo.hasNextPage && !page.pageInfo.endCursor) throw new Error('Cursor de repositórios ausente.');
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);

  const lifetime = { commits: 0, prs: 0, issues: 0, reviews: 0 };
  for (let year = new Date(user.createdAt).getUTCFullYear(); year <= now.getUTCFullYear(); year++) {
    const yearFrom = `${year}-01-01T00:00:00Z`;
    const yearTo = year === now.getUTCFullYear() ? to : `${year}-12-31T23:59:59Z`;
    const result = await graphql(`query($login:String!,$from:DateTime!,$to:DateTime!) {
      user(login:$login) { contributionsCollection(from:$from,to:$to) { ${totals} } }
    }`, { login, from: yearFrom, to: yearTo }, token, fetcher);
    const c = result.contributionsCollection;
    lifetime.commits += c.totalCommitContributions;
    lifetime.prs += c.totalPullRequestContributions;
    lifetime.issues += c.totalIssueContributions;
    lifetime.reviews += c.totalPullRequestReviewContributions;
  }
  return { user, repositories, lifetime };
}
