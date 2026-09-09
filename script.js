const API_BASE = 'https://football-backend-s094.onrender.com';
const BETVORA_LOGO = 'favicon.svg';

const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
menuBtn?.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? '×' : '☰';
});
document.querySelectorAll('.mobile-nav a').forEach((link) => link.addEventListener('click', () => {
  mobileNav?.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
  if (menuBtn) menuBtn.textContent = '☰';
}));

const leagueImages = [
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=900&q=80'
];

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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBA';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function formatDateOnly(iso) {
  if (!iso) return 'TBA';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBA';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: '2-digit', month: 'short'
  }).format(date);
}

function apiFootballFixtureStatus(fixture) {
  const status = fixture?.fixture?.status || {};
  if (status.short === 'HT') return 'HALF TIME';
  if (status.short === 'PST') return 'POSTPONED';
  if (status.short === 'CANC') return 'CANCELLED';
  if (status.short === 'ABD') return 'ABANDONED';
  if (status.short === 'FT' || status.short === 'AET' || status.short === 'PEN') return 'FINISHED';
  if (status.elapsed) return `LIVE ${status.elapsed}'`;
  return formatKickoff(fixture?.fixture?.date);
}

function isLiveFixture(fixture) {
  const short = fixture?.fixture?.status?.short;
  return Boolean(fixture?.fixture?.status?.elapsed) || ['1H', '2H', 'ET', 'P', 'LIVE', 'HT'].includes(short);
}

function teamLogoUrl(team) {
  return team?.logo || BETVORA_LOGO;
}

function teamBadge(team) {
  const name = String(team?.name || team || 'Unknown team');
  const src = team?.logo || BETVORA_LOGO;
  return `<span class="team-badge"><img src="${escapeHtml(src)}" alt="${escapeHtml(name)} logo" loading="lazy" onerror="this.onerror=null;this.src='${BETVORA_LOGO}'"></span>`;
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  let data = null;
  try { data = await response.json(); } catch (_) {}
  if (!response.ok || data?.ok === false) {
    const providerMessage = data?.provider?.message || data?.provider?.error || '';
    throw new Error(providerMessage || data?.error || `Request failed (${response.status})`);
  }
  return data;
}

function normalizeLeague(item) {
  const league = item?.league || item;
  const country = item?.country || {};
  const seasons = Array.isArray(item?.seasons) ? item.seasons : [];
  const currentSeason = seasons.find((season) => season.current) || seasons[0];
  return {
    id: league?.id,
    name: league?.name || 'Football competition',
    type: league?.type || 'League',
    logo: league?.logo || BETVORA_LOGO,
    country: country?.name || 'International',
    code: country?.code || '',
    season: currentSeason?.year || new Date().getFullYear()
  };
}

async function getFootballLeagues() {
  const data = await getJson('/api/football/leagues');
  return (data?.response || []).map(normalizeLeague);
}

function leagueCard(league, index = 0) {
  const image = leagueImages[index % leagueImages.length];
  const logo = league.logo || BETVORA_LOGO;
  return `<article class="league-photo-card">
    <div class="league-photo">
      <img src="${image}" alt="${escapeHtml(league.name)} football" loading="lazy">
      <span>${escapeHtml(league.type || 'FOOTBALL')}</span>
    </div>
    <div class="league-photo-info">
      <div class="league-title-row">
        <img class="league-mini-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(league.name)} logo" onerror="this.onerror=null;this.src='${BETVORA_LOGO}'">
        <div><strong>${escapeHtml(league.name)}</strong><small>${escapeHtml(league.country)} · ${escapeHtml(String(league.season))}</small></div>
      </div>
      <span class="league-dot"></span>
    </div>
  </article>`;
}

function matchCard(fixture, live = false) {
  const home = fixture?.teams?.home || {};
  const away = fixture?.teams?.away || {};
  const goals = fixture?.goals || {};
  const league = fixture?.league || {};
  const scoreAvailable = goals.home !== null && goals.home !== undefined && goals.away !== null && goals.away !== undefined;
  const score = scoreAvailable ? `${goals.home} - ${goals.away}` : '—';
  const status = live ? apiFootballFixtureStatus(fixture) : formatKickoff(fixture?.fixture?.date);
  const fixtureId = fixture?.fixture?.id || '';
  const competition = league.name || 'Football';

  return `<article class="live-match-card ${live ? 'is-live' : ''}" data-fixture-id="${escapeHtml(fixtureId)}">
    <div class="match-top">
      <span class="competition-label">${escapeHtml(competition)}</span>
      <span class="match-status">${escapeHtml(status)}</span>
    </div>
    <div class="teams-row">
      <div class="team-side">${teamBadge(home)}<strong>${escapeHtml(home.name || 'Home')}</strong></div>
      <div class="match-score">${escapeHtml(score)}</div>
      <div class="team-side away">${teamBadge(away)}<strong>${escapeHtml(away.name || 'Away')}</strong></div>
    </div>
    <div class="match-bottom">
      <span>${live ? `${escapeHtml(league.country || 'Football')} · Live` : formatDateOnly(fixture?.fixture?.date)}</span>
      <b>Betvora odds via WebSocket</b>
    </div>
  </article>`;
}

function setLoading(element, text = 'Loading football data…') {
  if (element) element.innerHTML = `<div class="data-loading">${escapeHtml(text)}</div>`;
}

async function loadFootballPage() {
  const leagueSelect = document.getElementById('footballLeagueSelect');
  const leagueGrid = document.getElementById('footballLeagueGrid');
  const matchesGrid = document.getElementById('footballMatches');
  const message = document.getElementById('footballDataMessage');
  if (!matchesGrid) return;

  setLoading(leagueGrid, 'Loading football competitions…');
  setLoading(matchesGrid, 'Loading fixtures…');

  try {
    const leagues = await getFootballLeagues();
    const featured = leagues.filter((league) => league.id).slice(0, 24);

    if (leagueSelect) {
      leagueSelect.innerHTML = '<option value="all">All upcoming football</option>' + featured.map((league) =>
        `<option value="${escapeHtml(league.id)}">${escapeHtml(league.name)} · ${escapeHtml(league.country)}</option>`
      ).join('');
      leagueSelect.onchange = () => loadFootballMatches(leagueSelect.value);
    }

    if (leagueGrid) {
      leagueGrid.innerHTML = featured.length
        ? featured.map((league, index) => leagueCard(league, index)).join('')
        : '<div class="data-empty">No football competitions found.</div>';
    }

    await loadFootballMatches('all');
    if (message) message.textContent = `API-Football is connected. ${leagues.length} football competitions are available to Betvora.`;
  } catch (error) {
    if (message) message.textContent = `Football data is temporarily unavailable: ${error.message}`;
    matchesGrid.innerHTML = `<div class="data-empty">Unable to load football data right now. ${escapeHtml(error.message)}</div>`;
  }
}

async function loadFootballMatches(leagueId = 'all') {
  const matchesGrid = document.getElementById('footballMatches');
  if (!matchesGrid) return;
  setLoading(matchesGrid, 'Loading fixtures from API-Football…');

  try {
    let path;
    if (leagueId !== 'all') {
      const leagues = await getFootballLeagues();
      const selected = leagues.find((league) => String(league.id) === String(leagueId));
      const season = selected?.season || new Date().getFullYear();
      path = `/api/football/fixtures?league=${encodeURIComponent(leagueId)}&season=${encodeURIComponent(season)}`;
    } else {
      path = '/api/football/fixtures?next=50';
    }

    const data = await getJson(path);
    const fixtures = Array.isArray(data?.response) ? data.response : [];
    const upcoming = fixtures
      .filter((fixture) => !isLiveFixture(fixture))
      .sort((a, b) => new Date(a?.fixture?.date || 0) - new Date(b?.fixture?.date || 0))
      .slice(0, 50);

    matchesGrid.innerHTML = upcoming.length
      ? upcoming.map((fixture) => matchCard(fixture)).join('')
      : '<div class="data-empty">No upcoming fixtures are currently available.</div>';
  } catch (error) {
    matchesGrid.innerHTML = `<div class="data-empty">${escapeHtml(error.message)}</div>`;
  }
}

async function loadLivePage() {
  const hero = document.getElementById('liveHeroMatches');
  const liveGrid = document.getElementById('liveFootballMatches');
  const upcomingGrid = document.getElementById('liveUpcomingMatches');
  const message = document.getElementById('liveDataMessage');
  const leagueGrid = document.getElementById('liveLeagueGrid');
  if (!liveGrid) return;

  setLoading(liveGrid, 'Loading live football…');
  setLoading(upcomingGrid, 'Loading upcoming fixtures…');
  setLoading(leagueGrid, 'Loading competitions…');

  try {
    const leagues = await getFootballLeagues();
    const featured = leagues.slice(0, 24);
    if (leagueGrid) leagueGrid.innerHTML = featured.map((league, index) => leagueCard(league, index)).join('');

    const liveData = await getJson('/api/football/live');
    const liveFixtures = Array.isArray(liveData?.response) ? liveData.response : [];
    const live = liveFixtures.filter(isLiveFixture);

    liveGrid.innerHTML = live.length
      ? live.slice(0, 50).map((fixture) => matchCard(fixture, true)).join('')
      : '<div class="data-empty">No football matches are live right now.</div>';

    if (hero) {
      hero.innerHTML = live.slice(0, 5).map((fixture) => {
        const home = fixture?.teams?.home || {};
        const away = fixture?.teams?.away || {};
        const goals = fixture?.goals || {};
        const score = goals.home !== null && goals.home !== undefined && goals.away !== null && goals.away !== undefined
          ? `${goals.home}:${goals.away}` : 'LIVE';
        return `<div class="page-list-row">
          <div>${teamBadge(home)}<strong>${escapeHtml(home.name || 'Home')}</strong><small>${escapeHtml(fixture?.league?.name || 'Football')}</small></div>
          <span class="page-score">${escapeHtml(score)}</span>
          <div>${teamBadge(away)}<strong>${escapeHtml(away.name || 'Away')}</strong></div>
        </div>`;
      }).join('') || '<div class="page-list-row"><div><strong>No live football</strong><small>Live matches will appear here automatically</small></div><span>—</span></div>';
    }

    const upcomingData = await getJson('/api/football/fixtures?next=30');
    const upcoming = (upcomingData?.response || [])
      .filter((fixture) => !isLiveFixture(fixture))
      .sort((a, b) => new Date(a?.fixture?.date || 0) - new Date(b?.fixture?.date || 0))
      .slice(0, 30);

    upcomingGrid.innerHTML = upcoming.length
      ? upcoming.map((fixture) => matchCard(fixture)).join('')
      : '<div class="data-empty">No upcoming football fixtures found.</div>';

    if (message) message.textContent = `Live football is connected to API-Football. ${live.length} matches are currently live.`;
  } catch (error) {
    liveGrid.innerHTML = `<div class="data-empty">${escapeHtml(error.message)}</div>`;
    upcomingGrid.innerHTML = '<div class="data-empty">Unable to load upcoming fixtures.</div>';
    if (message) message.textContent = `The live football feed could not be loaded: ${error.message}`;
  }
}

loadFootballPage();
loadLivePage();
