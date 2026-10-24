(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const main = $('#main');
const COLORS = ['#8B4FD8', '#D277B8', '#E8806A', '#E9A23B', '#93AE33', '#6A35B5', '#C2569E', '#D0624C', '#C88E12', '#6F8A1E', '#9C7BC9', '#E39BC9', '#F0A592', '#F2C05B'];
const CH = [
  { id: 'playing',  n: '01', t: "Who's playing — and who isn't", c: '#8B4FD8', d: 'Participation and daily activity across age, gender, income, language and place.' },
  { id: 'barriers', n: '02', t: 'What gets in the way',           c: '#D277B8', d: 'Cost, transportation, schedules and belonging — in families\' own words.' },
  { id: 'places',   n: '03', t: 'Places to play',                 c: '#E8806A', d: 'Where parks, fields and low-cost programs are — and where they aren\'t.' },
  { id: 'youth',    n: '04', t: 'Youth voice',                    c: '#C88E12', d: 'What young people mapped, photographed and told us about play.' },
  { id: 'action',   n: '05', t: 'What we do next',                c: '#6F8A1E', d: 'Recommendations with clear owners: parks, schools, funders, coaches, families.' }
];
const ICON = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  click: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9l11 4-5 2-2 5z"/><path d="M5 3v3M3 5h3M5.5 9.5 3.5 11.5M9.5 5.5l2-2"/></svg>',
  table: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/></svg>',
  globe: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#2B1838"><path d="M8 5v14l11-7z"/></svg>'
};

/* ---------------- data helpers ---------------- */
const state = { age: 'all', gender: 'all', region: 'all', income: 'all', lang: 'all' };
const keys = () => Object.keys(PE.FILTERS);
const active = (st) => keys().filter(k => st[k] !== 'all').map(k => st[k]);
const nFor = (st) => Math.round(keys().reduce((n, k) => st[k] === 'all' ? n : n * PE.SHARE[k][st[k]], PE.N_TOTAL));
const mod = (m, st) => active(st).reduce((v, f) => v * (m[f] ?? 1), 1);
const clamp = (v) => Math.max(1, Math.min(92, v));
function sports(st = state) { return PE.SPORTS.map(s => ({ k: s.k, v: Math.round(clamp(s.b * mod(s.m, st))) })).sort((a, b) => b.v - a.v); }
function barriers(st = state) { return PE.BARRIERS.map(s => ({ k: s.k, v: Math.round(clamp(s.b * mod(s.m, st))) })).sort((a, b) => b.v - a.v); }
function activity(st = state) {
  const m = active(st).reduce((v, f) => v * (PE.ACT_MOD[f] ?? 1), 1);
  return PE.ACTIVITY.map(a => ({ k: a.k, v: Math.round(clamp(a.b * m)) }));
}
const labelOf = (k, v) => PE.FILTERS[k].options.find(o => o[0] === v)[1];
const desc = (st = state) => { const a = keys().filter(k => st[k] !== 'all').map(k => labelOf(k, st[k])); return a.length ? a.join(' · ') : 'All King County youth'; };

function barsHTML(rows, max, limit, suppressed) {
  return rows.slice(0, limit).map((r, i) => `
    <div class="bar-row${suppressed ? ' suppressed' : ''}" style="--c:${COLORS[i % COLORS.length]}">
      <span>${r.k}</span>
      <span class="track" role="img" aria-label="${r.k}: ${suppressed ? 'suppressed' : r.v + '%'}"><span class="fill" data-w="${suppressed ? 0 : (r.v / max * 100)}"></span></span>
      <span class="val">${suppressed ? '—' : r.v + '%'}</span>
    </div>`).join('');
}
function animateBars(root = document) { requestAnimationFrame(() => $$('.fill', root).forEach(f => f.style.width = f.dataset.w + '%')); }

/* ---------------- views ---------------- */
const SAMPLE = '<span class="chip sample" title="Illustrative data for concept review">Sample data</span>';
const REAL = '<span class="chip real">2019 baseline · published</span>';

function viewHome() {
  const top = sports({ age: 'all', gender: 'all', region: 'all', income: 'all', lang: 'all' });
  return `
  <section class="hero" id="t-hero">
    <div class="hero-deco" aria-hidden="true"></div>
    <div class="wrap hero-grid">
      <div>
        <span class="eyebrow">King County Play Equity Report · 2027</span>
        <h1>Every kid deserves <span class="g">a place to play.</span></h1>
        <p class="lead">What King County families, youth and coaches told us about sport, play and physical activity — and what we can do about it together.</p>
        <div class="ctas" id="t-ctas">
          <a class="btn btn-ink" href="#/report">Read the report ${ICON.arrow}</a>
          <a class="btn btn-ghost" href="#/explore">Explore the data</a>
          <a class="btn btn-ghost" href="#/download">${ICON.dl} Download PDF</a>
        </div>
        <p class="meta">Research by the University of Washington Center for Leadership in Athletics · Guided by the Community Advisory Board</p>
      </div>
      <div class="hero-art"><img src="img/hero.jpg" alt="Illustration of kids and families playing basketball, soccer, skateboarding and on a playground in a King County park with Mount Rainier in the distance"><span class="tag"><i></i>Parents · youth · coaches · community leaders</span></div>
    </div>
  </section>

  <section class="sec" style="padding-top:clamp(1.5rem,3vw,2.5rem)">
    <div class="wrap">
      <div class="sec-head reveal"><div><span class="eyebrow">Where we started</span><h2>In 2019, King County earned a D for getting kids active.</h2></div><p>The first <em>State of Play</em> set the baseline. This report shows what has changed since — and what hasn't. ${REAL}</p></div>
      <div class="stats reveal" id="t-stats">${PE.BASELINE.map(b => `<div class="stat"><div class="v">${b.value}</div><p>${b.label}</p><a href="${b.url}" target="_blank" rel="noopener">${b.src} ↗</a></div>`).join('')}</div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head reveal"><div><span class="eyebrow">The report at a glance</span><h2>Five chapters. One story about play.</h2></div><p>Read straight through, or jump to what matters to you. Every chapter links to the data behind it.</p></div>
      <div class="chapters reveal">${CH.map(c => `<a class="ch" href="#/report/${c.id}" style="--c:${c.c}"><span class="n">${c.n}</span><h3>${c.t}</h3><p>${c.d}</p><span class="go">Read chapter →</span></a>`).join('')}</div>
    </div>
  </section>

  <section class="sec" style="background:var(--paper-2)">
    <div class="wrap feature">
      <div class="reveal">
        <span class="eyebrow">What kids are playing</span>
        <h2 style="font-size:var(--t-xl);margin-bottom:1rem">The top five sports in King County.</h2>
        <p class="lead" style="font-size:var(--t-base)">The report shows the headline. The website lets you go deeper — see the full top ten and filter by age, gender, region, household income and language spoken at home.</p>
        <ul class="ticks"><li>Every chart in the PDF has a matching interactive view here.</li><li>Filters update instantly and the link can be shared.</li><li>Every view has a data table and CSV download.</li></ul>
      </div>
      <div class="panel reveal" id="t-top5">
        <div class="panel-head"><div><h3>Sports youth played in the past year</h3><span class="muted" style="font-size:.85rem">Share of King County youth ages 5–18</span></div>${SAMPLE}</div>
        <div class="bars">${barsHTML(top, top[0].v, 5)}</div>
        <a class="click-through" href="#/explore?tab=sports">See the top 10 and filter by age, region and income <span style="display:inline-flex;width:20px">${ICON.arrow}</span></a>
        <p class="note">Sample values shown to demonstrate the experience. Final figures will come from the UW parent and youth surveys.</p>
      </div>
    </div>
  </section>

  <section class="sec voices">
    <div class="wrap">
      <div class="sec-head reveal"><div><span class="eyebrow">In their words</span><h2>Behind every number is a family making a choice.</h2></div></div>
      <div class="voice-grid reveal">
        <figure class="voice" style="margin:0"><blockquote>“Instead of paying $1,500 to $2,000 for one season, I can buy a $300–$400 Xbox and a PlayStation, and my kid will be at home safe.”</blockquote><cite>Parent, State of Play focus group · via <a href="https://www.kcplayequity.org/resources/can-screens-and-physical-activity-co-exist" target="_blank" rel="noopener">KCPEC</a></cite></figure>
        <figure class="voice" style="margin:0"><blockquote>“We mapped every court within a mile of school. Half had no nets.”</blockquote><cite>Youth Action Mapping team member · <span class="chip sample">Sample quote</span></cite></figure>
        <figure class="voice" style="margin:0"><blockquote>“Coaches are the front door to sport. Train us and the door stays open.”</blockquote><cite>Youth coach, stakeholder interview · <span class="chip sample">Sample quote</span></cite></figure>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap split">
      <div class="split-img reveal"><img src="img/mapping.jpg" alt="Illustration of teens marking a large neighborhood map with pins while another photographs a cracked basketball court"></div>
      <div class="reveal" id="t-youth">
        <span class="eyebrow">Youth Action Mapping</span>
        <h2>Young people mapped their own neighborhoods.</h2>
        <p class="muted" style="font-size:var(--t-base)">Teams of youth walked, photographed and rated the places they play — then brought their findings to decision-makers. Their work is a centerpiece of this report.</p>
        <ul class="ticks"><li>Interactive map of youth observations</li><li>Photo stories and team findings</li><li>Youth-written recommendations</li></ul>
        <a class="btn btn-ink" href="#/youth-mapping">See the youth map ${ICON.arrow}</a>
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap split rev">
      <div class="split-img reveal"><img src="img/cab.jpg" alt="Illustration of a community advisory board meeting in a circle while one member records a short video"></div>
      <div class="reveal">
        <span class="eyebrow">Community Advisory Board</span>
        <h2>The people who guided this work, in their own voices.</h2>
        <p class="muted" style="font-size:var(--t-base)">Short videos from Community Advisory Board members on why they joined, what they learned, and what they want leaders to do next. Captioned and transcribed.</p>
        <a class="btn btn-ink" href="#/advisory-board">Watch the videos ${ICON.arrow}</a>
      </div>
    </div>
  </section>

  <section class="sec" style="background:var(--paper-2)" id="t-dl-home">
    <div class="wrap">
      <div class="sec-head reveal"><div><span class="eyebrow">Take it with you</span><h2>Read it your way.</h2></div><p>Print it for a board meeting, click through it on a laptop, or pull the data for your own grant application.</p></div>
      ${downloadsGrid()}
    </div>
  </section>`;
}

function downloadsGrid() {
  return `<div class="dl-grid reveal">
    <a class="dl" href="downloads/kc-play-equity-report-SAMPLE-print.pdf" target="_blank" rel="noopener" style="--bg:#EFE4FB"><span class="ico">${ICON.book}</span><h3>Print report (PDF)</h3><p>Designed for printing and sharing at meetings. QR codes link to the interactive charts.</p><span class="go">Download sample →</span></a>
    <a class="dl" href="downloads/kc-play-equity-report-SAMPLE-interactive.pdf" target="_blank" rel="noopener" style="--bg:#FBE3EF"><span class="ico">${ICON.click}</span><h3>Interactive PDF</h3><p>Clickable table of contents, chapter navigation and buttons that open each live dashboard.</p><span class="go">Download sample →</span></a>
    <a class="dl" href="#/explore" style="--bg:#FDE9D0"><span class="ico">${ICON.table}</span><h3>Data tables (CSV)</h3><p>Every chart's numbers, de-identified and ready for your own analysis or grant writing.</p><span class="go">Open the data →</span></a>
    <a class="dl" href="#/download" style="--bg:#EAF2D2"><span class="ico">${ICON.globe}</span><h3>Summary in 5 languages</h3><p>Plain-language summary in English, Spanish, Somali, Vietnamese and Chinese.</p><span class="go">Planned for launch →</span></a>
  </div>`;
}

function viewReport(sub) {
  return `
  <section class="page-hero"><div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / The Report</div>
    <span class="eyebrow">Read online</span>
    <h1>The 2027 King County Play Equity Report</h1>
    <p class="lead">Read the full report as a scrolling story. Charts are live — hover for detail, or open any of them in the data explorer.</p>
  </div></section>
  <section style="padding-bottom:4rem"><div class="wrap reader">
    <nav class="toc" aria-label="Chapters"><span class="lbl">Chapters</span>${CH.map(c => `<a href="#/report/${c.id}" data-ch="${c.id}" style="--c:${c.c}"><span class="n">${c.n}</span>${c.t}</a>`).join('')}<div class="progress"><i id="readProg"></i></div></nav>
    <div>
      <article class="chapter" id="ch-playing" style="--c:${CH[0].c}">
        <span class="k">Chapter 01</span><h2>${CH[0].t}</h2>
        <div class="prose">
          <p>In 2019, only about one in five King County youth got the hour of daily physical activity the CDC recommends. Girls, youth of color, youth with disabilities, and young people who don't speak English at home were less active still.</p>
          <p>This chapter asks what has changed. Using a new parent survey and youth survey, it tracks participation across age, gender, income, language and region — and shows where activity drops off as kids get older.</p>
        </div>
        <div class="panel inline-viz">
          <div class="panel-head"><div><h3>Youth meeting 60 minutes of activity a day, by age</h3><span class="muted" style="font-size:.85rem">Dashed line: 2019 King County baseline (19%)</span></div>${SAMPLE}</div>
          <div class="chart-box"><canvas id="cActivity" aria-label="Bar chart of the share of youth meeting the activity guideline by age group, sample data" role="img"></canvas></div>
          <a class="click-through" href="#/explore?tab=activity">Filter this chart by gender, income, region and language ${ICON.arrow.replace('<svg', '<svg width="20" height="20"')}</a>
        </div>
        <div class="pull">The drop-off is steepest between middle school and high school — exactly when sport costs and travel demands rise.<cite>Sample callout · final language from the UW research team</cite></div>
      </article>

      <article class="chapter" id="ch-barriers" style="--c:${CH[1].c}">
        <span class="k">Chapter 02</span><h2>${CH[1].t}</h2>
        <div class="chapter-art"><img src="img/barriers.jpg" alt="Illustration of a child watching a game from outside a fenced field near a bus stop"></div>
        <div class="prose">
          <p>Families named the same barriers again and again: cost, getting there, schedules that don't fit working parents, and not feeling like a program was meant for them. Published research from the 2019 data found low-affluence families were far more likely to report many of these barriers.</p>
        </div>
        <div class="panel inline-viz">
          <div class="panel-head"><div><h3>Top reasons youth don't play, by household income</h3><span class="muted" style="font-size:.85rem">Share of parents naming each barrier</span></div>${SAMPLE}</div>
          <div class="chart-box" style="height:380px"><canvas id="cBarriers" role="img" aria-label="Grouped bar chart comparing barriers for lower and higher income households, sample data"></canvas></div>
          <a class="click-through" href="#/explore?tab=barriers">Explore barriers by every group ${ICON.arrow.replace('<svg', '<svg width="20" height="20"')}</a>
        </div>
        <div class="pull">“Instead of paying $1,500 to $2,000 for one season, I can buy a $300–$400 Xbox and a PlayStation, and my kid will be at home safe.”<cite>Parent, State of Play focus group (published by KCPEC)</cite></div>
      </article>

      <article class="chapter" id="ch-places" style="--c:${CH[2].c}">
        <span class="k">Chapter 03</span><h2>${CH[2].t}</h2>
        <div class="prose"><p>King County has world-class outdoor space, but it isn't evenly shared. Fields are booked by travel teams, and some neighborhoods — especially in South King County and rural areas — have fewer low-cost programs per child.</p></div>
        <div class="panel inline-viz"><div class="panel-head"><div><h3>Access to places to play, by area</h3><span class="muted" style="font-size:.85rem">Tap an area to see its numbers</span></div>${SAMPLE}</div>${hexMapHTML('park', 'mini')}</div>
      </article>

      <article class="chapter" id="ch-youth" style="--c:${CH[3].c}">
        <span class="k">Chapter 04</span><h2>${CH[3].t}</h2>
        <div class="prose"><p>Young people told us the best part of sport is having fun with friends. Through Youth Action Mapping, they also showed us — block by block — what helps and what gets in the way.</p></div>
        <div class="split" style="margin-top:1.5rem"><div class="split-img"><img src="img/mapping.jpg" alt="Youth mapping illustration"></div><div><ul class="ticks"><li>5 youth teams · 4 regions <span class="chip sample">Sample</span></li><li>Photos, ratings and notes on parks, courts, fields and pools</li><li>Youth-written recommendations presented to leaders</li></ul><a class="btn btn-ink" href="#/youth-mapping">Open the youth map ${ICON.arrow}</a></div></div>
      </article>

      <article class="chapter" id="ch-action" style="--c:${CH[4].c}">
        <span class="k">Chapter 05</span><h2>${CH[4].t}</h2>
        <div class="prose"><p>Each recommendation names who can act. Use the tags to find the ones that belong to you.</p></div>
        <div class="recs">
          ${[
            ['Make the first season free', 'Fund no-cost entry programs for ages 5–13 in the areas with the fewest options.', ['Funders', 'Parks']],
            ['Open the gates', 'Reserve weekday hours on public fields and courts for free, unscheduled youth play.', ['Parks', 'Schools']],
            ['Get kids there', 'Pair programs with transit passes, carpools and school-site scheduling.', ['Transit', 'Schools']],
            ['Train every coach for belonging', 'Make inclusion and trauma-informed coaching a funding condition.', ['Coaches', 'Funders']],
            ['Speak families\' languages', 'Publish schedules and sign-ups in the county\'s top five languages.', ['Parks', 'Community orgs']],
            ['Keep listening to youth', 'Fund Youth Action Mapping every two years as a standing feedback loop.', ['Coalition', 'Youth']]
          ].map(([h, p, w]) => `<div class="rec"><h3>${h}</h3><p>${p}</p><div class="who">${w.map(x => `<span class="chip violet">${x}</span>`).join('')}</div></div>`).join('')}
        </div>
        <p class="note">Sample recommendations to show layout — final recommendations come from the Coalition and UW research team.</p>
      </article>
    </div>
  </div></section>`;
}

function viewExplore(params) {
  const tab = params.get('tab') || 'sports';
  keys().forEach(k => { const v = params.get(k); state[k] = v && PE.FILTERS[k].options.some(o => o[0] === v) ? v : 'all'; });
  return `
  <section class="page-hero" style="padding-bottom:1.5rem"><div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / Explore the Data</div>
    <span class="eyebrow">Data explorer</span>
    <h1>Explore the data behind the report.</h1>
    <p class="lead">Filter by age, gender, region, household income and language at home. Small groups are protected automatically. ${SAMPLE}</p>
  </div></section>
  <section style="padding-bottom:5rem"><div class="wrap explorer">
    <aside class="filters" id="t-filters" aria-label="Filters">
      <h3>Filters <button type="button" id="resetF">Reset</button></h3>
      ${keys().map(k => `<div class="field"><label for="f-${k}">${PE.FILTERS[k].label}</label><select id="f-${k}" data-k="${k}">${PE.FILTERS[k].options.map(([v, l]) => `<option value="${v}"${state[k] === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`).join('')}
      <div class="n-box" id="nBox"></div>
    </aside>
    <div>
      <div class="tabs" role="tablist">${[['sports', 'Sports'], ['barriers', 'Barriers'], ['activity', 'Daily activity'], ['places', 'Places to play']].map(([v, l]) => `<button class="tab" role="tab" data-tab="${v}" aria-selected="${v === tab}">${l}</button>`).join('')}</div>
      <div id="exBody" data-tab="${tab}"></div>
    </div>
  </div></section>`;
}

function renderExplore() {
  const body = $('#exBody'); if (!body) return;
  const tab = body.dataset.tab;
  const n = nFor(state); const sup = n < PE.SUPPRESS_BELOW;
  $('#nBox').innerHTML = `Showing <b>${desc()}</b><br>Sample size: <b>${sup ? 'fewer than ' + PE.SUPPRESS_BELOW : 'n = ' + n.toLocaleString()}</b>`;
  const qs = new URLSearchParams({ tab, ...Object.fromEntries(keys().filter(k => state[k] !== 'all').map(k => [k, state[k]])) });
  history.replaceState(null, '', '#/explore?' + qs.toString());
  const supBox = sup ? `<div class="supp" role="status"><strong>Protected.</strong> Fewer than ${PE.SUPPRESS_BELOW} respondents match these filters, so results are hidden to protect privacy. Try removing a filter.</div>` : '';
  const tools = `<div class="toolrow"><button type="button" data-act="table">Show data table</button><button type="button" data-act="csv">Download CSV</button><button type="button" data-act="link">Copy link to this view</button><button type="button" data-act="png">Save chart image</button></div>`;
  let html = '', rows = [];
  if (tab === 'sports') {
    rows = sports();
    html = `${kpis([['Most played', sup ? '—' : rows[0].k, sup ? '' : rows[0].v + '% of youth'], ['Sports with 10%+', sup ? '—' : rows.filter(r => r.v >= 10).length, 'out of 14 tracked'], ['Respondents', sup ? '<10' : n.toLocaleString(), 'parents & youth']])}
      <div class="panel">${supBox}<div class="panel-head"><div><h3>Top 10 sports youth played in the past year</h3><span class="muted" style="font-size:.85rem">${desc()}</span></div>${SAMPLE}</div>
      <div class="bars" id="chartTarget">${barsHTML(rows, Math.max(...rows.map(r => r.v)), 10, sup)}</div>${tools}<div id="tbl"></div>
      <p class="note">Sample data for concept review. Final values: UW parent survey (statewide, King County subsample) and youth survey, weighted.</p></div>`;
  } else if (tab === 'barriers') {
    rows = barriers();
    html = `${kpis([['#1 barrier', sup ? '—' : rows[0].k, sup ? '' : rows[0].v + '% of parents'], ['Cost-related', sup ? '—' : rows.find(r => r.k === 'Costs too much').v + '%', 'name cost as a barrier'], ['Respondents', sup ? '<10' : n.toLocaleString(), 'parents']])}
      <div class="panel">${supBox}<div class="panel-head"><div><h3>Reasons youth don't play or stopped playing</h3><span class="muted" style="font-size:.85rem">${desc()}</span></div>${SAMPLE}</div>
      <div class="bars" id="chartTarget">${barsHTML(rows, Math.max(...rows.map(r => r.v)), 8, sup)}</div>${tools}<div id="tbl"></div>
      <p class="note">2019 published comparison (low-affluence families): don't want to get hurt 35%, don't feel welcome 27%, too expensive 27%, no transportation 18% — <a href="https://www.mdpi.com/1660-4601/18/13/6946" target="_blank" rel="noopener">IJERPH, 2021</a>.</p></div>`;
  } else if (tab === 'activity') {
    rows = activity();
    html = `${kpis([['Ages 5–9', sup ? '—' : rows[0].v + '%', 'meet 60 min/day'], ['Ages 14–18', sup ? '—' : rows[2].v + '%', 'meet 60 min/day'], ['2019 baseline', '19%', 'all King County youth']])}
      <div class="panel">${supBox}<div class="panel-head"><div><h3>Youth meeting 60 minutes of activity a day</h3><span class="muted" style="font-size:.85rem">${desc()}</span></div>${SAMPLE}</div>
      <div class="chart-box" id="chartTarget"><canvas id="cAct2" role="img" aria-label="Bar chart of share meeting activity guideline by age"></canvas></div>${tools}<div id="tbl"></div>
      <p class="note">Baseline: <a href="https://www.seattle.gov/Documents/Departments/ParksAndRecreation/PoliciesPlanning/SPR_Strategic_Plan.03.27.2020.pdf" target="_blank" rel="noopener">19% of King County youth (State of Play 2019)</a>. Bars are sample values.</p></div>`;
  } else {
    html = `<div class="panel"><div class="panel-head"><div><h3>Access to places to play, by area</h3><span class="muted" style="font-size:.85rem">Region filters highlight areas · tap any hexagon</span></div>${SAMPLE}</div>${hexMapHTML('park', 'full')}</div>`;
  }
  body.innerHTML = html;
  animateBars(body);
  if (tab === 'activity') drawActivity('cAct2', rows, sup);
  if (tab === 'places') bindHex(body);
  body._rows = rows;
  $$('.toolrow button', body).forEach(b => b.onclick = () => toolAction(b, b.dataset.act, rows, tab, sup));
}
function kpis(list) { return `<div class="kpis">${list.map(([l, v, s]) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join('')}</div>`; }
function toolAction(btn, act, rows, tab, sup) {
  if (act === 'table') {
    const t = $('#tbl'); const open = t.innerHTML;
    t.innerHTML = open ? '' : `<table class="data"><caption class="sr-only">Data table</caption><thead><tr><th>${tab === 'activity' ? 'Age group' : tab === 'barriers' ? 'Barrier' : 'Sport'}</th><th>Share (%)</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.k}</td><td>${sup ? 'suppressed' : r.v}</td></tr>`).join('')}</tbody></table>`;
    btn.textContent = open ? 'Show data table' : 'Hide data table';
  } else if (act === 'csv') {
    const csv = 'group_filters,item,share_pct,note\n' + rows.map(r => `"${desc()}","${r.k}",${sup ? '' : r.v},SAMPLE DATA`).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `play-equity-${tab}-SAMPLE.csv`; a.click();
  } else if (act === 'link') {
    navigator.clipboard?.writeText(location.href).then(() => { btn.textContent = 'Link copied ✓'; setTimeout(() => btn.textContent = 'Copy link to this view', 1800); });
  } else if (act === 'png') {
    const c = $('#exBody canvas');
    if (c) { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `play-equity-${tab}.png`; a.click(); }
    else { btn.textContent = 'Image export available for chart views'; setTimeout(() => btn.textContent = 'Save chart image', 1800); }
  }
}

function hexMapHTML(metric, size) {
  const R = 34, W = Math.sqrt(3) * R;
  const pts = (cx, cy) => [...Array(6)].map((_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const hexes = PE.AREAS.map((a, i) => {
    const cx = 40 + a.c * W + (a.r % 2 ? W / 2 : 0), cy = 40 + a.r * R * 1.5;
    return `<g class="hex" data-i="${i}" tabindex="0" role="button" aria-label="${a.n}"><path d="M${pts(cx, cy)}Z" stroke="#fff" stroke-width="2"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="800" font-family="Poppins" fill="#fff" pointer-events="none">${a.n.split(/[ /&]/)[0].slice(0, 9)}</text></g>`;
  }).join('');
  return `<div class="hexmap" data-metric="${metric}">
    <div><svg viewBox="0 0 ${40 + 6.5 * W} ${40 + 6 * R * 1.5}" role="group" aria-label="Hexagon map of King County areas">${hexes}</svg>
      <div class="legend"><span>Less access</span><span class="ramp" style="background:linear-gradient(90deg,#F4D6C6,#E8806A,#8B4FD8,#4B2486)"></span><span>More access</span></div></div>
    <div><div class="metric-pick">${Object.entries(PE.AREA_METRICS).map(([k, m]) => `<label><input type="radio" name="metric-${size}" value="${k}"${k === metric ? ' checked' : ''}> ${m.label}</label>`).join('')}</div>
      <div class="area-card" aria-live="polite"><span class="muted" style="font-size:.85rem;font-weight:700">Select an area on the map</span></div></div>
  </div>`;
}
function bindHex(root) {
  $$('.hexmap', root).forEach(h => {
    const paint = () => {
      const m = h.dataset.metric, def = PE.AREA_METRICS[m];
      const vals = PE.AREAS.map(a => a[m]); const mn = Math.min(...vals), mx = Math.max(...vals);
      const ramp = ['#F4D6C6', '#EFA98F', '#E8806A', '#C066A8', '#8B4FD8', '#4B2486'];
      $$('.hex', h).forEach(g => {
        const a = PE.AREAS[g.dataset.i]; let t = (a[m] - mn) / (mx - mn); if (!def.higherIsBetter) t = 1 - t;
        g.querySelector('path').setAttribute('fill', ramp[Math.min(5, Math.floor(t * 6))]);
        g.style.opacity = state.region !== 'all' && a.reg !== state.region ? .25 : 1;
        const tx = g.querySelector('text'); tx.setAttribute('fill', t < .35 ? '#2B1838' : '#fff');
      });
    };
    const show = (i) => {
      const a = PE.AREAS[i], m = h.dataset.metric, def = PE.AREA_METRICS[m];
      $$('.hex', h).forEach(g => g.classList.toggle('sel', +g.dataset.i === i));
      const avg = (PE.AREAS.reduce((s, x) => s + x[m], 0) / PE.AREAS.length);
      $('.area-card', h).innerHTML = `<span class="chip">${labelOf('region', a.reg)}</span><h4 style="margin-top:.6rem">${a.n}</h4><div class="big">${a[m]}${def.unit}</div><p class="muted" style="font-size:.88rem;margin:.2rem 0 .6rem">${def.label}</p><p style="font-size:.88rem;margin:0">County average: <b>${avg.toFixed(m === 'prog' ? 1 : 0)}${def.unit}</b> · ${(def.higherIsBetter ? a[m] >= avg : a[m] <= avg) ? 'better than average' : 'below average'}</p>`;
    };
    $$('input', h).forEach(r => r.onchange = () => { h.dataset.metric = r.value; paint(); const s = $('.hex.sel', h); if (s) show(+s.dataset.i); });
    $$('.hex', h).forEach(g => { g.onclick = () => show(+g.dataset.i); g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(+g.dataset.i); } }; });
    paint(); show(16);
  });
}

function viewYouth() {
  return `
  <section class="page-hero"><div class="wrap split" style="align-items:end">
    <div><div class="crumbs"><a href="#/">Home</a> / Youth Action Mapping</div><span class="eyebrow">Youth Action Mapping</span><h1>Youth mapped the places they play.</h1><p class="lead">Teams of young people audited parks, courts, fields and pools in their neighborhoods — then told leaders what they found.</p></div>
    <div class="split-img"><img src="img/mapping.jpg" alt="Teens mapping their neighborhood"></div>
  </div></section>
  <section class="sec" style="padding-top:1rem"><div class="wrap">
    <div class="steps reveal">
      <div class="step"><h3>Train</h3><p>Youth learn mapping, photo-voice and interviewing with Coalition mentors.</p></div>
      <div class="step"><h3>Map</h3><p>Teams walk their neighborhoods and rate places to play on safety, condition and welcome.</p></div>
      <div class="step"><h3>Make sense</h3><p>Youth sort what they saw into themes and choose what matters most.</p></div>
      <div class="step"><h3>Speak up</h3><p>Teams present findings and recommendations to parks, schools and funders.</p></div>
    </div>
  </div></section>
  <section class="sec" style="padding-top:0;background:linear-gradient(var(--paper),var(--paper-2))"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">The youth map</span><h2>Tap a pin to read what youth found.</h2></div><p>${SAMPLE} Pins and notes shown to demonstrate the format; the live map will use the youth teams' real observations and photos.</p></div>
    <div class="pin-layout">
      <div class="pinboard"><img src="img/places.jpg" alt="Illustrated bird's-eye map of neighborhoods with parks, fields, a lake and a light rail line">${PE.PINS.map((p, i) => `<button class="pin" style="left:${p.x}%;top:${p.y}%" data-i="${i}" aria-label="Observation ${i + 1}: ${p.title}"><span><i>${i + 1}</i></span></button>`).join('')}</div>
      <aside class="obs" id="obs" aria-live="polite"></aside>
    </div>
  </div></section>`;
}
function bindPins() {
  const show = (i) => {
    const p = PE.PINS[i];
    $$('.pin').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    $('#obs').innerHTML = `<span class="chip violet">${p.tag}</span><h3>${p.title}</h3><div class="who">${p.who} · <span class="chip sample">Sample</span></div><p style="margin-top:.8rem;color:var(--ink-2)">${p.note}</p>
      <div class="obs-list">${PE.PINS.map((q, j) => `<button type="button" data-j="${j}" class="${j === i ? 'on' : ''}"><b>${j + 1}</b>${q.title}</button>`).join('')}</div>`;
    $$('.obs-list button').forEach(b => b.onclick = () => show(+b.dataset.j));
  };
  $$('.pin').forEach(b => b.onclick = () => show(+b.dataset.i));
  show(0);
}

function viewCAB() {
  return `
  <section class="page-hero"><div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / Community Advisory Board</div><span class="eyebrow">Community Advisory Board</span>
    <h1>Guided by the community it's about.</h1>
    <p class="lead">The Community Advisory Board shaped the questions, reviewed the findings and pushed for action. Hear from members directly — every video is captioned with a full transcript.</p>
  </div></section>
  <section style="padding-bottom:5rem"><div class="wrap">
    <div class="videos reveal">${PE.CAB.map((v, i) => `<button class="vid" type="button" data-i="${i}" aria-label="Play video: ${v.name}"><div class="poster" style="background-image:url(img/cab.jpg);--pos:${v.pos}"><span class="play">${ICON.play}</span><span class="cc">CC</span><span class="len">${v.len}</span></div><div class="body"><p>${v.q}</p><span>${v.name}</span></div></button>`).join('')}</div>
    <p class="note" style="margin-top:1.4rem">Video cards show the planned format. Members' real videos (YouTube or Vimeo, recorded by the Coalition) drop into these slots with captions, transcripts and consent on file. Quotes shown are samples.</p>
    <div class="split" style="margin-top:3.5rem">
      <div class="split-img"><img src="img/cab.jpg" alt="Advisory board illustration"></div>
      <div><span class="eyebrow">Why it matters</span><h2>From advisory board to coalition.</h2><p class="muted">After the 2019 <em>State of Play</em>, the community advisory board that steered the research chose to become a formal coalition to act on its findings. This report continues that work. Source: <a href="https://www.seattleparksfoundation.org/king-county-play-equity-coalition-centering-youth-access-to-the-outdoors/" target="_blank" rel="noopener">Seattle Parks Foundation</a>.</p><a class="btn btn-ghost" href="https://www.kcplayequity.org" target="_blank" rel="noopener">Visit the Coalition ↗</a></div>
    </div>
  </div></section>`;
}
function bindVideos() {
  $$('.vid').forEach(b => b.onclick = () => {
    const v = PE.CAB[b.dataset.i];
    $('#modalVid').style.backgroundImage = 'url(img/cab.jpg)';
    $('#modalTitle').textContent = v.name;
    $('#modalText').textContent = `Video player goes here (${v.len}). In the live site this embeds the member's captioned video from YouTube or Vimeo, with a transcript link below.`;
    $('#modal').classList.add('open'); $('#modalClose').focus();
  });
}

function viewMethods() {
  return `
  <section class="page-hero"><div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / Methods</div><span class="eyebrow">How we did this</span>
    <h1>Four ways of listening.</h1>
    <p class="lead">The report combines survey data with interviews, focus groups and youth-led research, so the numbers and the stories explain each other.</p>
  </div></section>
  <section style="padding-bottom:3rem"><div class="wrap">
    <div class="methods reveal">
      <div class="m-card" style="--c:#8B4FD8"><div class="big">Parents</div><h3>Statewide parent survey</h3><p>A statewide survey of parents, with a King County sample analyzed for this report.</p></div>
      <div class="m-card" style="--c:#D277B8"><div class="big">35</div><h3>Stakeholder interviews</h3><p>Conversations with leaders across parks, schools, community organizations and sport.</p></div>
      <div class="m-card" style="--c:#E8806A"><div class="big">Groups</div><h3>Focus groups</h3><p>Small-group conversations with families and community members about what helps and what gets in the way.</p></div>
      <div class="m-card" style="--c:#C88E12"><div class="big">Youth</div><h3>Youth survey &amp; mapping</h3><p>A youth survey plus Youth Action Mapping teams researching their own neighborhoods.</p></div>
    </div>
  </div></section>
  <section class="sec" style="padding-top:2rem"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Timeline</span><h2>From 2019 baseline to 2027 report.</h2></div></div>
    <div class="timeline">
      <div class="tl done"><b>2019</b><span>State of Play baseline published</span></div>
      <div class="tl done"><b>2025–26</b><span>Parent survey, 35 interviews, focus groups</span></div>
      <div class="tl"><b>Fall 2026</b><span>Youth survey &amp; Youth Action Mapping · design begins</span></div>
      <div class="tl"><b>Winter 2027</b><span>Analysis, writing, report &amp; site build</span></div>
      <div class="tl"><b>Spring 2027</b><span>Launch — then the library keeps growing</span></div>
    </div>
    <p class="note">Timeline dates are placeholders for the subcommittee to confirm.</p>
  </div></section>
  <section class="sec" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Privacy &amp; ethics</span><h2>Protecting the people who shared their stories.</h2></div></div>
    <div class="privacy">
      <div><h4>De-identified only</h4><p>The site receives only aggregated, de-identified results from the UW research team — never individual responses.</p></div>
      <div><h4>Small groups protected</h4><p>Any result based on fewer than 10 people is hidden automatically, so no one can be singled out by combining filters.</p></div>
      <div><h4>Consent for every voice</h4><p>Quotes, photos and videos appear only with documented consent; youth content follows parent/guardian consent.</p></div>
    </div>
    <div class="panel" style="margin-top:1.5rem"><h3 style="font-size:1rem;margin-bottom:.5rem">How to cite this report</h3><p style="margin:0;font-size:.92rem;color:var(--ink-2)">King County Play Equity Coalition &amp; University of Washington Center for Leadership in Athletics. (2027). <em>King County Play Equity Report</em>. [URL to be confirmed]</p></div>
  </div></section>`;
}

function viewLibrary() {
  const topics = ['All', ...new Set(PE.LIBRARY.map(d => d.topic))];
  return `
  <section class="page-hero"><div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / Library</div><span class="eyebrow">Living library</span>
    <h1>The report keeps growing.</h1>
    <p class="lead">Supplemental briefs, youth reports and data stories are added here over time — so the report stays useful long after launch day.</p>
  </div></section>
  <section style="padding-bottom:5rem"><div class="wrap">
    <div class="lib-tools"><input type="search" id="libQ" placeholder="Search the library" aria-label="Search the library">${topics.map((t, i) => `<button class="pill" data-t="${t}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div>
    <div class="lib" id="libList"></div>
  </div></section>`;
}
function bindLibrary() {
  let topic = 'All';
  const draw = () => {
    const q = ($('#libQ').value || '').toLowerCase();
    const list = PE.LIBRARY.filter(d => (topic === 'All' || d.topic === topic) && (d.t + d.d).toLowerCase().includes(q));
    $('#libList').innerHTML = list.length ? list.map(d => `<${d.url ? `a href="${d.url}" target="_blank" rel="noopener"` : 'div'} class="doc"><span class="cov" aria-hidden="true"></span><div><h3>${d.t}</h3><p>${d.d}</p><div class="meta"><span class="chip">${d.fmt}</span><span class="chip ${d.status === 'Published' ? 'real' : 'sample'}">${d.status}</span><span class="chip violet">${d.topic}</span></div></div></${d.url ? 'a' : 'div'}>`).join('') : `<p class="muted">No items match. Try a different search.</p>`;
  };
  $$('.pill').forEach(p => p.onclick = () => { topic = p.dataset.t; $$('.pill').forEach(x => x.setAttribute('aria-pressed', x === p)); draw(); });
  $('#libQ').oninput = draw; draw();
}

function viewDownload() {
  return `
  <section class="page-hero"><div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / Download</div><span class="eyebrow">Download the report</span>
    <h1>One report, every format.</h1>
    <p class="lead">The print edition, the interactive PDF and this website share one design system, so the report looks and reads the same wherever people find it.</p>
  </div></section>
  <section style="padding-bottom:3rem" id="t-dl"><div class="wrap">${downloadsGrid()}</div></section>
  <section class="sec" style="padding-top:2rem"><div class="wrap split">
    <div><span class="eyebrow">Print vs. interactive</span><h2>Built to work together.</h2>
      <ul class="ticks"><li><b>Print PDF:</b> designed for paper and meetings, with a QR code beside each chart that opens its live version.</li><li><b>Interactive PDF:</b> clickable table of contents, chapter tabs, and “Explore this data” buttons that open the matching dashboard.</li><li><b>Website:</b> the full experience — filters, maps, videos and the growing library.</li><li><b>Accessible by design:</b> WCAG 2.1 AA target, alt text, data tables for every chart, captioned video.</li></ul></div>
    <div class="split-img"><img src="img/places.jpg" alt="Illustrated map of neighborhoods" style="object-position:center 30%"></div>
  </div></section>`;
}

/* ---------------- charts ---------------- */
let charts = [];
function killCharts() { charts.forEach(c => c.destroy()); charts = []; }
Chart.defaults.font.family = "'Nunito Sans', system-ui, sans-serif";
Chart.defaults.font.weight = 700;
Chart.defaults.color = '#5A4866';
const baselinePlugin = { id: 'baseline', beforeDatasetsDraw(c, _a, o) { if (!o.y) return; const { ctx, chartArea: a, scales: { y } } = c; const py = y.getPixelForValue(o.y); ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#2B1838'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); } };
function drawActivity(id, rows, sup) {
  const el = document.getElementById(id); if (!el) return;
  charts.push(new Chart(el, {
    type: 'bar', plugins: [baselinePlugin],
    data: { labels: rows.map(r => r.k), datasets: [{ data: sup ? rows.map(() => 0) : rows.map(r => r.v), backgroundColor: ['#8B4FD8', '#D277B8', '#E8806A'], borderRadius: 10, maxBarThickness: 110 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, baseline: { y: 19 }, tooltip: { callbacks: { label: c => ` ${c.raw}% meet the guideline` } } }, scales: { y: { beginAtZero: true, max: 50, ticks: { callback: v => v + '%' }, grid: { color: '#EFE6D8' } }, x: { grid: { display: false } } } }
  }));
}
function drawBarriersCompare() {
  const el = $('#cBarriers'); if (!el) return;
  const lo = barriers({ ...state, income: 'low' }), hi = barriers({ ...state, income: 'high' });
  const labels = lo.map(r => r.k);
  charts.push(new Chart(el, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Under $50K', data: labels.map(l => lo.find(r => r.k === l).v), backgroundColor: '#D277B8', borderRadius: 6 }, { label: '$100K+', data: labels.map(l => hi.find(r => r.k === l).v), backgroundColor: '#E8D9F6', borderRadius: 6 }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'rectRounded' } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.raw}%` } } }, scales: { x: { beginAtZero: true, ticks: { callback: v => v + '%' }, grid: { color: '#EFE6D8' } }, y: { grid: { display: false } } } }
  }));
}

/* ---------------- router ---------------- */
function route() {
  killCharts();
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, q] = raw.split('?');
  const params = new URLSearchParams(q || '');
  const parts = path.split('/').filter(Boolean);
  const page = parts[0] || '';
  const views = { '': viewHome, report: () => viewReport(parts[1]), explore: () => viewExplore(params), 'youth-mapping': viewYouth, 'advisory-board': viewCAB, methods: viewMethods, library: viewLibrary, download: viewDownload };
  if (!views[page]) { location.hash = '#/'; return; }
  if (main.dataset.page === 'explore' && page === 'explore' && $('#exBody')) { return; }
  main.innerHTML = views[page]();
  main.dataset.page = page;
  $$('.nav a').forEach(a => { if (a.getAttribute('href') === '#/' + page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#nav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  document.title = ({ '': 'Play Equity Report 2027', report: 'The Report', explore: 'Explore the Data', 'youth-mapping': 'Youth Action Mapping', 'advisory-board': 'Community Advisory Board', methods: 'Methods', library: 'Library', download: 'Download' })[page] + ' — King County Play Equity Report (Concept)';
  if (page === 'report') {
    drawActivity('cActivity', activity({ age: 'all', gender: 'all', region: 'all', income: 'all', lang: 'all' }), false); drawBarriersCompare(); bindHex(main); bindToc();
    if (parts[1]) setTimeout(() => document.getElementById('ch-' + parts[1])?.scrollIntoView({ behavior: 'instant', block: 'start' }), 30); else window.scrollTo(0, 0);
  } else window.scrollTo(0, 0);
  if (page === 'explore') bindExplore();
  if (page === 'youth-mapping') bindPins();
  if (page === 'advisory-board') bindVideos();
  if (page === 'library') bindLibrary();
  animateBars(main); observeReveal();
}
function bindExplore() {
  $$('.filters select').forEach(s => s.onchange = () => { state[s.dataset.k] = s.value; renderExplore(); });
  $('#resetF').onclick = () => { keys().forEach(k => state[k] = 'all'); $$('.filters select').forEach(s => s.value = 'all'); renderExplore(); };
  $$('.tab').forEach(t => t.onclick = () => { $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t)); $('#exBody').dataset.tab = t.dataset.tab; killCharts(); renderExplore(); });
  renderExplore();
}
function bindToc() {
  const links = $$('.toc a');
  links.forEach(a => a.onclick = (e) => { e.preventDefault(); document.getElementById('ch-' + a.dataset.ch).scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', a.getAttribute('href')); });
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', 'ch-' + a.dataset.ch === en.target.id)); }), { rootMargin: '-35% 0px -60% 0px' });
  $$('.chapter').forEach(c => io.observe(c));
}
window.addEventListener('scroll', () => { const p = $('#readProg'); if (!p) return; const r = $('.reader').getBoundingClientRect(); const t = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); p.style.width = (t * 100) + '%'; }, { passive: true });
function observeReveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));
}
window.addEventListener('hashchange', () => { main.dataset.page = ''; route(); });
$('#menuBtn').onclick = () => { const o = $('#nav').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); };
$('#modalClose').onclick = () => $('#modal').classList.remove('open');
$('#modal').onclick = e => { if (e.target.id === 'modal') $('#modal').classList.remove('open'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#modal').classList.remove('open'); endTour(); } });

/* ---------------- guided tour ---------------- */
const TOUR = [
  { h: '#/', sel: '#t-ctas', k: 'Start here', t: 'One front door', p: 'The landing page is the report\'s home. Visitors can read online, explore the data, or download the PDF in one click.' },
  { h: '#/', sel: '#t-stats', k: 'Context', t: 'Anchored in the 2019 baseline', p: 'Real State of Play figures, each linked to its source, set up the "what changed?" story.' },
  { h: '#/', sel: '#t-top5', k: 'Julie\'s example', t: 'Top 5 in the report → top 10 online', p: 'The report shows the top five sports. One click opens the full list with filters for age, gender, region, income and language.' },
  { h: '#/explore?tab=sports', sel: '#t-filters', k: 'Data explorer', t: 'Filter it yourself', p: 'Change any filter and the charts update. If a group is too small, results hide automatically to protect privacy.' },
  { h: '#/youth-mapping', sel: '.pin-layout', k: 'Youth voice', t: 'Youth Action Mapping', p: 'An interactive map of what youth teams found, with their photos and notes on every pin.' },
  { h: '#/advisory-board', sel: '.videos', k: 'Multimedia', t: 'Community Advisory Board videos', p: 'Captioned member videos drop into these cards. That\'s the multimedia piece the subcommittee asked about.' },
  { h: '#/library', sel: '#libList', k: 'Living report', t: 'A library that keeps growing', p: 'New briefs and youth reports can be added after launch without a redesign.' },
  { h: '#/download', sel: '#t-dl', k: 'Every format', t: 'Print PDF + interactive PDF', p: 'Both PDFs share the website\'s design. The interactive PDF links straight into the live dashboards.' }
];
let ti = -1, ring, pop;
function startTour() { ti = -1; ring = document.createElement('div'); ring.className = 'tour-ring'; pop = document.createElement('div'); pop.className = 'tour-pop'; pop.setAttribute('role', 'dialog'); document.body.append(ring, pop); nextTour(); }
function endTour() { ring?.remove(); pop?.remove(); ring = pop = null; ti = -1; }
function nextTour() {
  ti++; if (ti >= TOUR.length) return endTour();
  const s = TOUR[ti];
  const go = () => {
    const el = $(s.sel); if (!el) return setTimeout(go, 120);
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      Object.assign(ring.style, { left: (r.left + scrollX - 8) + 'px', top: (r.top + scrollY - 8) + 'px', width: (r.width + 16) + 'px', height: (r.height + 16) + 'px' });
      pop.innerHTML = `<span class="k">${ti + 1} of ${TOUR.length} · ${s.k}</span><h4>${s.t}</h4><p>${s.p}</p><div class="row"><div class="dots">${TOUR.map((_, j) => `<i class="${j === ti ? 'on' : ''}"></i>`).join('')}</div><div style="display:flex;gap:.4rem"><button class="sk" type="button">End tour</button><button class="nx" type="button">${ti === TOUR.length - 1 ? 'Finish' : 'Next →'}</button></div></div>`;
      $('.nx', pop).onclick = nextTour; $('.sk', pop).onclick = endTour; $('.nx', pop).focus();
    }, 60);
  };
  const target = s.h; const cur = location.hash || '#/';
  if (cur.split('?')[0] !== target.split('?')[0] || (target.includes('?') && !cur.includes('tab='))) { location.hash = target; setTimeout(go, 250); } else go();
}
$('#tourBtn').onclick = startTour;
window.addEventListener('resize', () => { if (ti >= 0) { ti--; nextTour(); } });

route();
})();
