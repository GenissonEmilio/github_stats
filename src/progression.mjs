export const XP_WEIGHTS = Object.freeze({ commits: 10, prs: 40, issues: 15, reviews: 25 });
export const RANKS = [
  { level: 1, code: 'E', name: 'Recruta' },
  { level: 5, code: 'D', name: 'Explorador' },
  { level: 10, code: 'C', name: 'Construtor' },
  { level: 20, code: 'B', name: 'Especialista' },
  { level: 35, code: 'A', name: 'Arquiteto' },
  { level: 50, code: 'S', name: 'Lendário' },
  { level: 75, code: 'S+', name: 'Mestre' },
];

export function progression(lifetime, previousXp = 0) {
  const earned = Object.entries(XP_WEIGHTS).reduce((sum, [key, weight]) => sum + Math.max(0, lifetime[key] ?? 0) * weight, 0);
  const xp = Math.max(earned, previousXp);
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const floor = (level - 1) ** 2 * 100;
  const ceiling = level ** 2 * 100;
  return { xp, earned, level, floor, ceiling, remaining: ceiling - xp, progress: (xp - floor) / (ceiling - floor),
    rank: RANKS.findLast(rank => level >= rank.level), nextRank: RANKS.find(rank => rank.level > level) ?? null };
}

export function activity(days, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const byDate = new Map(days.filter(day => day.date <= today).map(day => [day.date, day.contributionCount]));
  let best = 0, running = 0;
  const ordered = [...byDate].sort(([a], [b]) => a.localeCompare(b));
  let last = null;
  for (const [date, count] of ordered) {
    if (last && new Date(date) - new Date(last) !== 86400_000) running = 0;
    running = count > 0 ? running + 1 : 0;
    best = Math.max(best, running);
    last = date;
  }
  let cursor = new Date(`${today}T00:00:00Z`);
  if (!(byDate.get(today) > 0)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let current = 0;
  while (byDate.get(cursor.toISOString().slice(0, 10)) > 0) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const recent = Array.from({ length: 112 }, (_, index) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 111 + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: byDate.get(key) ?? 0 };
  });
  return { current, best, recent, activeDays: ordered.filter(([, count]) => count > 0).length,
    last30: recent.slice(-30).reduce((sum, day) => sum + day.count, 0),
    last7: recent.slice(-7).reduce((sum, day) => sum + day.count, 0) };
}

export function createSnapshot(raw, config, previous = {}, now = new Date()) {
  if (previous.config?.username !== config.username) previous = {};
  const collection = raw.user.contributionsCollection;
  const languages = new Map();
  let bytes = 0;
  for (const repo of raw.repositories) for (const edge of repo.languages.edges) {
    const entry = languages.get(edge.node.name) ?? { name: edge.node.name, color: edge.node.color ?? '#9b8afb', bytes: 0, repositories: 0 };
    entry.bytes += edge.size;
    entry.repositories++;
    bytes += edge.size;
    languages.set(entry.name, entry);
  }
  const arsenal = [...languages.values()].sort((a, b) => b.bytes - a.bytes)
    .map(lang => ({ ...lang, percent: bytes ? lang.bytes / bytes * 100 : 0 }));
  const stats = {
    contributions: collection.contributionCalendar.totalContributions,
    commits: collection.totalCommitContributions, prs: collection.totalPullRequestContributions,
    issues: collection.totalIssueContributions, reviews: collection.totalPullRequestReviewContributions,
    repositories: raw.repositories.length,
    stars: raw.repositories.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    forks: raw.repositories.reduce((sum, repo) => sum + repo.forkCount, 0),
    followers: raw.user.followers.totalCount,
  };
  const days = collection.contributionCalendar.weeks.flatMap(week => week.contributionDays);
  const streak = activity(days, now);
  const progress = progression(raw.lifetime, previous.progression?.xp);
  const definitions = [
    ['first-code', 'Hello, world', '1 commit na jornada', raw.lifetime.commits, 1, 'code'],
    ['builder', 'World builder', '25 repositórios originais', stats.repositories, 25, 'box'],
    ['polyglot', 'Poliglota', '5 linguagens no arsenal', arsenal.length, 5, 'branch'],
    ['collaborator', 'Co-op mode', '10 pull requests na jornada', raw.lifetime.prs, 10, 'merge'],
    ['streak', 'Em sequência', '7 dias seguidos de atividade', streak.best, 7, 'bolt'],
    ['starlight', 'Starlight', '25 estrelas recebidas', stats.stars, 25, 'star'],
  ];
  const achievements = definitions.map(([id, title, description, value, target, icon]) => {
    const saved = previous.achievements?.find(item => item.id === id)?.unlockedAt;
    return { id, title, description, value, target, icon, unlockedAt: saved ?? (value >= target ? now.toISOString().slice(0, 10) : null) };
  });
  const nextMilestone = (value, steps) => steps.find(step => step > value) ?? Math.ceil((value + 1) / steps.at(-1)) * steps.at(-1);
  const quests = [
    { title: 'Próximo nível', value: progress.xp - progress.floor, target: progress.ceiling - progress.floor, detail: `${progress.remaining.toLocaleString('pt-BR')} XP para o nível ${progress.level + 1}` },
    { title: 'Construa o próximo mundo', value: stats.repositories, target: nextMilestone(stats.repositories, [10, 25, 50, 75, 100]), detail: 'Repositórios públicos e originais' },
    { title: 'A comunidade reconhece', value: stats.stars, target: nextMilestone(stats.stars, [5, 10, 25, 50, 100]), detail: 'Estrelas recebidas nos seus projetos' },
  ];
  return { schemaVersion: 1, generatedAt: now.toISOString(), joinedYear: new Date(raw.user.createdAt).getUTCFullYear(), config, stats, lifetime: raw.lifetime,
    progression: progress, activity: streak, calendar: days.filter(day => day.date <= now.toISOString().slice(0, 10)), languages: arsenal, achievements, quests };
}
