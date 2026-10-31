export const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const number = value => value.toLocaleString('pt-BR');
const palettes = {
  dark: { bg: '#0d111b', panel: '#141b29', border: '#283246', text: '#f0f3fa', muted: '#9daec5', accent: '#a999ff', mint: '#6ee7c0', track: '#273247', dim: '#1b2536', gold: '#f2cc82' },
  light: { bg: '#f8faff', panel: '#edf1fa', border: '#cdd6e6', text: '#17243b', muted: '#52637e', accent: '#6c49cc', mint: '#087a5a', track: '#d7dfed', dim: '#e4eaf5', gold: '#99630a' },
};
const paths = {
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  box: '<path d="m12 2 10 5v10l-10 5-10-5V7zM2 7l10 5 10-5M12 12v10M7 4l10 5"/>',
  branch: '<circle cx="6" cy="5" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><path d="M6 8v8m12-8c0 6-12 1-12 8"/>',
  merge: '<circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/><circle cx="6" cy="20" r="2"/><path d="M6 6v12m2-14c0 8 10 2 10 14m-4-9 4-4 4 4"/>',
  bolt: '<path d="m13 2-10 12h8l-1 8L21 9h-8z"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  lock: '<rect x="5" y="10" width="14" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
};

function painter(theme) {
  const p = palettes[theme];
  const text = (x, y, value, size = 16, fill = p.text, weight = 400, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" ${extra}>${escapeXml(value)}</text>`;
  const rect = (x, y, width, height, fill = p.panel, radius = 12, stroke = 'none') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
  const line = (x1, y1, x2, y2, stroke = p.border) => `<path d="M${x1} ${y1}H${x2}" stroke="${stroke}"/>`;
  const bar = (x, y, width, ratio, color = p.mint, height = 7) => rect(x, y, width, height, p.track, height / 2) + (ratio > 0 ? rect(x, y, Math.max(height, width * Math.min(1, ratio)), height, color, height / 2) : '');
  const icon = (x, y, name, color = p.accent, size = 24) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.code}</g>`;
  const heading = (label, title, width, mobile) => text(28, 35, label, 11, p.accent, 700, 'letter-spacing="2"') + text(28, 70, title, mobile ? 25 : 28, p.text, 700) + line(28, 90, width - 28, 90);
  const svg = (width, height, title, description, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(description)}</desc><style>text{font-family:"Segoe UI",Ubuntu,Arial,sans-serif}.mono{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace}</style>${rect(1, 1, width - 2, height - 2, p.bg, 20, p.border)}${content}</svg>\n`;
  return { p, text, rect, line, bar, icon, heading, svg };
}

export function renderHero(s, theme = 'dark', mobile = false) {
  const { p, text, rect, line, bar, svg } = painter(theme);
  const w = mobile ? 480 : 960, h = mobile ? 414 : 330;
  const progress = s.progression;
  const cx = mobile ? 379 : 818, cy = mobile ? 138 : 139, r = mobile ? 58 : 70;
  const polygon = scale => Array.from({ length: 6 }, (_, i) => {
    const angle = (60 * i - 30) * Math.PI / 180;
    return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
  }).join(' ');
  let c = text(28, 37, 'GE / DEVQUEST', 13, p.mint, 700, 'class="mono" letter-spacing="2"');
  c += rect(w - 139, 20, 110, 26, p.dim, 13) + text(w - 84, 38, 'PLAYER 01', 10, p.muted, 600, 'class="mono" text-anchor="middle" letter-spacing="1.5"');
  c += `<circle cx="${cx}" cy="${cy}" r="${r + 22}" fill="none" stroke="${p.border}" stroke-dasharray="3 9"/><polygon points="${polygon(1.06)}" fill="${p.panel}" stroke="${p.accent}" stroke-width="1.5"/><polygon points="${polygon(.88)}" fill="none" stroke="${p.border}"/>`;
  c += text(cx, cy - 25, 'RANK', 10, p.muted, 600, 'class="mono" text-anchor="middle" letter-spacing="3"') + text(cx, cy + 22, progress.rank.code, mobile ? 46 : 58, p.accent, 800, 'text-anchor="middle"');
  c += text(cx, cy + r + 37, progress.rank.name.toUpperCase(), 11, p.accent, 600, 'class="mono" text-anchor="middle" letter-spacing="1"');
  if (mobile) {
    const words = s.config.displayName.toUpperCase().split(' ');
    c += text(28, 104, words[0], 33, p.text, 800, 'letter-spacing="-1"') + text(28, 144, words.slice(1).join(' '), 33, p.text, 800, 'letter-spacing="-1"');
  } else c += text(28, 113, s.config.displayName.toUpperCase(), 44, p.text, 800, 'letter-spacing="-1.5"');
  c += text(28, mobile ? 181 : 147, s.config.className, mobile ? 16 : 20, p.muted, 500);
  c += text(28, mobile ? 255 : 187, s.config.tagline, mobile ? 16 : 18, p.text, 400);
  s.config.specialties.forEach((label, i) => {
    const x = 28 + i * (mobile ? 144 : 157);
    c += rect(x, mobile ? 274 : 207, mobile ? 136 : 147, 27, p.dim, 6) + text(x + (mobile ? 68 : 73.5), mobile ? 292 : 225, label, mobile ? 9.5 : 10, p.muted, 600, 'class="mono" text-anchor="middle"');
  });
  const y = mobile ? 326 : 261;
  c += line(28, y - 8, w - 28, y - 8) + text(28, y + 17, `LVL ${String(progress.level).padStart(2, '0')}`, 21, p.mint, 750, 'class="mono"');
  c += text(w - 28, y + 15, `${number(progress.xp)} XP`, 16, p.text, 600, 'class="mono" text-anchor="end"');
  c += bar(28, y + 32, w - 56, progress.progress, p.mint, 8);
  c += text(28, y + 60, `${number(progress.remaining)} XP para o próximo nível`, 12, p.muted);
  c += text(w - 28, y + 60, `${Math.floor(progress.progress * 100)}%`, 12, p.mint, 600, 'class="mono" text-anchor="end"');
  return svg(w, h, `${s.config.displayName} · DevQuest nível ${progress.level}`, `Classe ${s.config.className}. Patente ${progress.rank.name}. ${number(progress.xp)} XP acumulados. ${number(progress.remaining)} XP até o próximo nível.`, c);
}

export function renderActivity(s, theme = 'dark', mobile = false) {
  const { p, text, rect, icon, heading, svg } = painter(theme);
  const w = mobile ? 480 : 960, h = mobile ? 625 : 423;
  let c = heading('01 / ACTIVITY LOG', 'Cada contribuição conta.', w, mobile);
  const metrics = [['CONTRIBUIÇÕES', s.stats.contributions, 'bolt'], ['COMMITS', s.stats.commits, 'code'], ['PULL REQUESTS', s.stats.prs, 'merge'], ['CODE REVIEWS', s.stats.reviews, 'branch']];
  const cols = mobile ? 2 : 4, cellW = (w - 56 - (cols - 1) * 12) / cols;
  metrics.forEach(([label, value, glyph], i) => {
    const x = 28 + (i % cols) * (cellW + 12), y = 109 + Math.floor(i / cols) * 102;
    c += rect(x, y, cellW, 88) + icon(x + cellW - 34, y + 16, glyph, p.muted, 18);
    c += text(x + 16, y + 27, label, 10, p.muted, 600, 'class="mono" letter-spacing=".5"') + text(x + 16, y + 66, number(value), 32, p.text, 700);
  });
  const gy = mobile ? 374 : 263;
  c += text(28, gy - 32, mobile ? 'ÚLTIMAS 16 SEMANAS' : 'MAPA DE CONTRIBUIÇÕES · ÚLTIMOS 12 MESES', 11, p.muted, 600, 'class="mono" letter-spacing="1"');
  const dates = mobile ? s.activity.recent.map(day => ({ date: day.date, contributionCount: day.count })) : s.calendar;
  const gap = mobile ? 25 : 16;
  const size = mobile ? 21 : 12;
  const heat = theme === 'light' ? [p.dim, '#c6e8df', '#78cbb1', '#369c7d', '#087a5a'] : [p.dim, '#20493f', '#28735b', '#42af86', '#79f0c3'];
  const peak = Math.max(1, ...dates.map(day => day.contributionCount));
  const startOffset = dates.length ? new Date(`${dates[0].date}T00:00:00Z`).getUTCDay() : 0;
  dates.forEach((day, i) => {
    // Desktop uses calendar weeks; compact layout uses complete seven-day columns.
    const index = i + (mobile ? 0 : startOffset);
    const x = (mobile ? 44 : 57) + Math.floor(index / 7) * gap, y = gy + index % 7 * (mobile ? 25 : 16);
    const intensity = day.contributionCount === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(day.contributionCount / peak * 4)));
    c += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="${heat[intensity]}"><title>${day.date}: ${day.contributionCount} contribuições</title></rect>`;
  });
  if (!mobile) ['D', 'T', 'Q', 'S'].forEach((label, i) => { c += text(28, gy + i * 32 + 10, label, 10, p.muted); });
  const foot = mobile ? 580 : 395;
  c += icon(28, foot - 15, 'bolt', p.mint, 18) + text(52, foot, `${s.activity.current} dias em sequência`, mobile ? 13 : 14, p.mint, 600);
  c += text(w - 28, foot, `Recorde anual: ${s.activity.best} dias`, mobile ? 12 : 14, p.muted, 400, 'text-anchor="end"');
  c += text(28, foot + 22, `30 dias: ${number(s.activity.last30)} contribuições · ${s.activity.activeDays} dias ativos no ano`, mobile ? 11 : 12, p.muted);
  return svg(w, h, 'Atividade no GitHub nos últimos 12 meses', `${s.stats.contributions} contribuições, ${s.stats.commits} commits, ${s.stats.prs} pull requests, ${s.stats.reviews} revisões e ${s.stats.issues} issues. Sequência atual de ${s.activity.current} dias e recorde anual de ${s.activity.best} dias.`, c);
}

export function renderArsenal(s, theme = 'dark', mobile = false) {
  const { p, text, rect, bar, heading, svg } = painter(theme);
  const w = mobile ? 480 : 960, h = mobile ? 549 : 381;
  let c = heading('02 / TECH LOADOUT', 'Seu arsenal de tecnologias.', w, mobile);
  const top = s.languages.slice(0, 6), cols = mobile ? 1 : 2;
  const cellW = mobile ? 424 : 428;
  if (!top.length) c += text(28, 140, 'Seu arsenal começa no próximo projeto.', 17, p.muted);
  top.forEach((lang, i) => {
    const x = 28 + i % cols * 476, y = 123 + Math.floor(i / cols) * 51;
    c += `<circle cx="${x + 5}" cy="${y - 5}" r="4" fill="${escapeXml(lang.color)}"/>`;
    c += text(x + 18, y, lang.name, 15, p.text, 600) + text(x + cellW, y, `${lang.percent.toFixed(1).replace('.', ',')}%`, 13, p.muted, 400, 'class="mono" text-anchor="end"');
    c += bar(x, y + 13, cellW, lang.percent / 100, lang.color, 6);
  });
  const fy = mobile ? 438 : 294;
  c += text(28, fy, 'Distribuição por bytes de código em repositórios públicos originais.', mobile ? 11 : 12, p.muted);
  const values = [[s.stats.repositories, 'REPOSITÓRIOS'], [s.stats.stars, 'ESTRELAS'], [s.stats.followers, 'SEGUIDORES'], [s.stats.forks, 'FORKS']];
  values.forEach(([value, label], i) => {
    const x = 28 + i * (w - 56) / 4;
    c += rect(x, fy + 18, (w - 56) / 4 - 8, 61, p.panel, 8) + text(x + 12, fy + 46, number(value), 22, p.text, 700) + text(x + 12, fy + 65, label, mobile ? 8 : 10, p.muted, 600, 'class="mono"');
  });
  return svg(w, h, 'Arsenal de tecnologias e alcance público', `${s.languages.length} linguagens. ${s.stats.repositories} repositórios públicos originais, ${s.stats.stars} estrelas recebidas, ${s.stats.followers} seguidores e ${s.stats.forks} forks. ${top.map(lang => `${lang.name} ${lang.percent.toFixed(1)}%`).join(', ')}.`, c);
}

export function renderQuests(s, theme = 'dark', mobile = false) {
  const { p, text, rect, bar, icon, heading, svg } = painter(theme);
  const w = mobile ? 480 : 960, h = mobile ? 1065 : 632;
  let c = heading('03 / ACHIEVEMENTS & QUESTS', 'A jornada continua.', w, mobile);
  const cols = mobile ? 2 : 3, cardW = (w - 56 - (cols - 1) * 12) / cols;
  s.achievements.forEach((item, i) => {
    const x = 28 + i % cols * (cardW + 12), y = 109 + Math.floor(i / cols) * 120;
    const unlocked = Boolean(item.unlockedAt), color = unlocked ? p.gold : p.muted;
    c += rect(x, y, cardW, 108, p.panel, 10, unlocked ? p.border : 'none') + icon(x + 14, y + 14, unlocked ? item.icon : 'lock', color, 24);
    c += text(x + cardW - 12, y + 28, unlocked ? 'UNLOCKED' : `${Math.min(item.value, item.target)}/${item.target}`, 9, color, 600, 'class="mono" text-anchor="end"');
    c += text(x + 14, y + 63, item.title, mobile ? 16 : 18, unlocked ? p.text : p.muted, 650);
    c += text(x + 14, y + 88, item.description, mobile ? 10 : 12, p.muted);
  });
  const qy = mobile ? 515 : 395;
  c += text(28, qy, 'PRÓXIMAS MISSÕES', 11, p.accent, 600, 'class="mono" letter-spacing="1.5"');
  s.quests.forEach((quest, i) => {
    const x = mobile ? 28 : 28 + i * 306, y = mobile ? qy + 22 + i * 140 : qy + 22;
    const width = mobile ? 424 : 292;
    c += rect(x, y, width, 125, p.panel, 10) + text(x + 16, y + 29, quest.title, 16, p.text, 600);
    c += text(x + 16, y + 54, quest.detail, mobile ? 12 : 10.5, p.muted);
    c += bar(x + 16, y + 73, width - 32, quest.value / quest.target, p.accent, 6);
    c += text(x + 16, y + 106, `${number(quest.value)} / ${number(quest.target)}`, 12, p.accent, 600, 'class="mono"');
  });
  const foot = mobile ? 990 : 595;
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza', dateStyle: 'short' }).format(new Date(s.generatedAt));
  c += text(28, foot, `${s.achievements.filter(a => a.unlockedAt).length}/${s.achievements.length} conquistas · XP acumulado desde ${s.joinedYear}`, 12, p.muted);
  c += text(28, foot + 22, `Atualizado em ${date} · GitHub Actions`, 11, p.muted, 400, 'class="mono"');
  if (!mobile) c += text(w - 28, foot + 22, 'BUILD. LEARN. LEVEL UP.', 11, p.mint, 600, 'class="mono" text-anchor="end" letter-spacing="1"');
  return svg(w, h, 'Conquistas e próximas missões', `${s.achievements.filter(a => a.unlockedAt).length} de ${s.achievements.length} conquistas desbloqueadas. ${s.quests.map(q => `${q.title}: ${q.value} de ${q.target}`).join('. ')}. Atualizado em ${date}.`, c);
}

export const RENDERERS = { hero: renderHero, activity: renderActivity, arsenal: renderArsenal, quests: renderQuests };

// GitHub rewrites media expressions containing prefers-color-scheme. Keep the
// viewport-only source separate and let its embedded SVG inherit color-scheme.
export function renderMobileAuto(render, snapshot) {
  const colors = Object.entries(palettes.dark).map(([key, dark]) => ({ key, dark, light: palettes.light[key] }));
  colors.push(...['#20493f', '#28735b', '#42af86', '#79f0c3'].map((dark, i) => ({ key: `heat${i}`, dark, light: ['#c6e8df', '#78cbb1', '#369c7d', '#087a5a'][i] })));
  const byHex = new Map(colors.map(color => [color.dark.toLowerCase(), color.key]));
  const svg = render(snapshot, 'dark', true).replace(/#[0-9a-f]{6}/gi, hex => byHex.has(hex.toLowerCase()) ? `var(--ge-${byHex.get(hex.toLowerCase())})` : hex);
  const vars = mode => colors.map(color => `--ge-${color.key}:${color[mode]}`).join(';');
  return svg.replace('<style>', `<style>:root{${vars('dark')}}@media(prefers-color-scheme:light){:root{${vars('light')}}}`);
}

export function picture(name, repository, alt) {
  const base = `https://raw.githubusercontent.com/${repository}/main/generated/${name}`;
  return `<picture>\n  <source media="(max-width: 600px)" srcset="${base}-mobile-auto.svg">\n  <source media="(prefers-color-scheme: dark)" srcset="${base}-dark.svg">\n  <img src="${base}-light.svg" width="100%" alt="${escapeXml(alt)}">\n</picture>`;
}
