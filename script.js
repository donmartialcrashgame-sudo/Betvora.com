const API_BASE = 'https://football-backend-s094.onrender.com';

const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

menuBtn?.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? '×' : '☰';
});

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = '☰';
  });
});

const logoIds = {
  'Arsenal': 9825,
  'Aston Villa': 10252,
  'Bournemouth': 8678,
  'Brentford': 9937,
  'Brighton and Hove Albion': 10204,
  'Brighton & Hove Albion': 10204,
  'Chelsea': 8455,
  'Crystal Palace': 9826,
  'Everton': 8668,
  'Fulham': 9879,
  'Leeds United': 8463,
  'Liverpool': 8650,
  'Manchester City': 8456,
  'Manchester United': 10260,
  'Newcastle United': 10261,
  'Nottingham Forest': 10203,
  'Sunderland': 8472,
  'Tottenham Hotspur': 8586,
  'Tottenham': 8586,
  'West Ham United': 8654,
  'Wolverhampton Wanderers': 8602,
  'Real Madrid': 8633,
  'Barcelona': 8634,
  'Atletico Madrid': 8639,
  'Atlético Madrid': 8639,
  'Bayern Munich': 9823,
  'Borussia Dortmund': 9789,
  'Inter Milan': 8636,
  'Inter': 8636,
  'AC Milan': 8564,
  'Juventus': 9885,
  'Paris Saint-Germain': 9847,
  'PSG': 9847
};

function teamLogoUrl(team) {
  const id = logoIds[team];
  return id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png` : '';
}

function teamBadge(team) {
  const initials = String(team || '?')
    .replace(/\b(fc|cf|afc|united|city|club)\b/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';
  const src = teamLogoUrl(team);
  return src
    ? `<span class="team-badge"><img src="${src}" alt="${escapeHtml(team)} logo" loading="lazy" onerror="this.parentElement.innerHTML='<span>${initials}</span>'"></span>`
    : `<span class="team-badge"><span>${initials}</span></span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatKickoff(iso) {
  if (!iso) return 'TBA';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso));
}

function isLiveEvent(event) {
  return event?.commence_time && new Date(event.commence_time).getTime() <= Date.now() && !event.completed;
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const data = await response.json();
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || 'Unable to load football data');
  }
  return data;
}

async function getFootballLeagues() {
  return getJson('/api/odds/football/leagues');
}

function matchCard(event, live = false) {
  const home = escapeHtml(event.home_team || 'Home');
  const away = escapeHtml(event.away_team || 'Away');
  const score = event.scores && Array.isArray(event.scores)
    ? `${event.scores[0]?.score ?? 0} - ${event.scores[1]?.score ?? 0}`
    : '—';
  const status = live ? 'LIVE' : formatKickoff(event.commence_time);

  return `<article class="live-match-card ${live ? 'is-live' : ''}">
    <div class="match-top"><span class="competition-label">${escapeHtml(event.sport_title || event.sport_key || 'Football')}</span><span class="match-status">${status}</span></div>
    <div class="teams-row">
      <div class="team-side">${teamBadge(event.home_team)}<strong>${home}</strong></div>
      <div class="match-score">${score}</div>
      <div class="team-side away">${teamBadge(event.away_team)}<strong>${away}</strong></div>
    </div>
    <div class="match-bottom"><span>${live ? 'Live match' : 'Upcoming fixture'}</span><b>Betvora odds coming via WebSocket</b></div>
  </article>`;
}

async function loadFootballPage() {
  const leagueSelect = document.getElementById('footballLeagueSelect');
  const leagueGrid = document.getElementById('footballLeagueGrid');
  const matchesGrid = document.getElementById('footballMatches');
  const message = document.getElementById('footballDataMessage');
  if (!matchesGrid) return;

  try {
    const leagues = await getFootballLeagues();
    const featured = leagues.filter((league) => league.active).slice(0, 8);

    if (leagueSelect) {
      leagueSelect.innerHTML = '<option value="all">All active football</option>' + featured
        .map((league) => `<option value="${escapeHtml(league.key)}">${escapeHtml(league.title)}</option>`).join('');
      leagueSelect.addEventListener('change', () => loadFootballMatches(leagueSelect.value));
    }

    if (leagueGrid) {
      leagueGrid.innerHTML = featured.slice(0, 6).map((league, index) => `<article class="info-card league-card">
        <div class="league-logo">${String(index + 1).padStart(2, '0')}</div>
        <h3>${escapeHtml(league.title)}</h3>
        <p>${escapeHtml(league.description || 'Football competition')}</p>
        <small>${escapeHtml(league.key)}</small>
      </article>`).join('');
    }

    await loadFootballMatches('all');
    if (message) message.textContent = 'Live football data connected. Matches below are coming from Betvora’s football backend.';
  } catch (error) {
    if (message) message.textContent = `Football data is temporarily unavailable: ${error.message}`;
    matchesGrid.innerHTML = '<div class="data-empty">Unable to load matches right now. Please refresh in a moment.</div>';
  }
}

async function loadFootballMatches(sport) {
  const matchesGrid = document.getElementById('footballMatches');
  if (!matchesGrid) return;
  matchesGrid.innerHTML = '<div class="data-loading">Loading football matches…</div>';

  try {
    const leagues = await getFootballLeagues();
    const active = leagues.filter((league) => league.active);
    const selected = sport === 'all' ? active.slice(0, 8) : active.filter((league) => league.key === sport);
    const responses = await Promise.all(selected.map((league) => getJson(`/api/odds/football?sport=${encodeURIComponent(league.key)}`)));
    const events = responses.flat().sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time)).slice(0, 24);

    matchesGrid.innerHTML = events.length
      ? events.map((event) => matchCard(event)).join('')
      : '<div class="data-empty">No football fixtures are currently listed.</div>';
  } catch (error) {
    matchesGrid.innerHTML = `<div class="data-empty">${escapeHtml(error.message)}</div>`;
  }
}

async function loadLivePage() {
  const liveGrid = document.getElementById('liveFootballMatches');
  const upcomingGrid = document.getElementById('liveUpcomingMatches');
  const message = document.getElementById('liveDataMessage');
  if (!liveGrid) return;

  try {
    const leagues = (await getFootballLeagues()).filter((league) => league.active).slice(0, 8);
    const responses = await Promise.all(leagues.map((league) => getJson(`/api/odds/football/scores?sport=${encodeURIComponent(league.key)}&daysFrom=1`)));
    const events = responses.flat();
    const live = events.filter(isLiveEvent).slice(0, 12);
    const upcoming = events.filter((event) => !isLiveEvent(event) && !event.completed)
      .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time)).slice(0, 12);

    liveGrid.innerHTML = live.length
      ? live.map((event) => matchCard(event, true)).join('')
      : '<div class="data-empty">No football matches are live right now.</div>';
    upcomingGrid.innerHTML = upcoming.length
      ? upcoming.map((event) => matchCard(event)).join('')
      : '<div class="data-empty">No upcoming football fixtures found.</div>';
    if (message) message.textContent = 'Live football data is connected to Betvora.';
  } catch (error) {
    liveGrid.innerHTML = `<div class="data-empty">${escapeHtml(error.message)}</div>`;
    upcomingGrid.innerHTML = '';
    if (message) message.textContent = 'The live football feed could not be loaded right now.';
  }
}

loadFootballPage();
loadLivePage();
