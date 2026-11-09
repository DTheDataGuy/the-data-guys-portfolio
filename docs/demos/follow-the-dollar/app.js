(function(){
'use strict';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const narrow = () => window.innerWidth < 600;

/* ---------- DATA ---------- */
const EVENTS = [
  {name:'Divisional Round vs 49ers', total:'$3.8M', local:'$2.7M', visitor:'$1.1M', share:'28.95%', att:'68.8K', cards:'42.4K', perCard:'$89.62', perAtt:'$55',
   note:'The biggest spending day of the run: $3.8M on card terminals and $89.62 per cardholder. It was also the busiest downtown day of January, with 378,000 visits.'},
  {name:'NFC Championship vs Rams', total:'$3.2M', local:'$2.25M', visitor:'$947.9K', share:'29.62%', att:'68.8K', cards:'37.1K', perCard:'$86.25', perAtt:'$47',
   note:'Same 68,800-seat stadium, fewer cardholders (37.1K), and the highest visitor share of the three at 29.62%. A conference title game pulls people in from out of town.'},
  {name:'Super Bowl Parade', total:'$2.9M', local:'$2.19M', visitor:'$709.2K', share:'24.46%', att:'600K', cards:'39.9K', perCard:'$72.68', perAtt:'$4.80',
   note:'About 600,000 people, the largest crowd by far, but $4.80 per attendee and the lowest visitor share (24.46%). This was Seattle celebrating itself, and 334,000 transit boardings got it there.'}
];

const CATS = [['Lodging',83],['Retail (Misc)',59],['Clothing',37],['Parking',35],['Restaurants',27],['Fast Food',26],['Bars',25],['Transportation',24],['Grocery',19],['Fuel',15],['ATM Withdrawal',15]];

const MODES = [['All Metro',334],['Bus',319],['Link Light Rail',225],['Sounder',20],['Additional Trips',6],['Shuttle',2.7]];

const CITIES = [
  {c:'Maple Valley–Black Diamond', before:7700.95, after:12700.95, ret:'+400%', note:'4 → 4 of 4 ahead'},
  {c:'White Center', before:2060, after:2060, ret:'+322%', note:'no direct awards'},
  {c:'SeaTac', before:1317.28, after:1317.28, ret:'+81%', note:'no direct awards'},
  {c:'Skyway', before:-1577, after:1423, ret:'−98%', note:'0 → 2 of 2 ahead'},
  {c:'Federal Way', before:-11018.16, after:-6018.16, ret:'−49%', note:'2 → 6 of 13 ahead'}
];

const PILLARS = [
  {t:'Visitation', q:'Who came?', why:'Everything starts with a headcount, and then a split. A local who goes to a game instead of a movie mostly moves money around. A visitor from Portland or Tokyo brings new money in.', f:'Visitor volume = Attendance × Visitor %', items:['Attendance','Local','Regional','Out-of-state','International'], tie:'In the postseason data, visitors were 27.8% of spend.'},
  {t:'Visitor spending', q:'What did they spend?', why:'Once you know how many visitors came, you need how long they stayed and what they spent per day. This is usually the biggest line in the model.', f:'Visitors × Length of stay × Daily spend', items:['Hotels','Restaurants','Retail','Bars','Entertainment','Attractions','Transportation'], tie:'Lodging (83%) and misc. retail (59%) are the most visitor-driven categories.'},
  {t:'Lodging demand', q:'Where did they sleep?', why:'Hotel nights are the clearest signal of an overnight visitor, and they are what funds STIA. Short-term rentals matter too, which is why Airbnb and VRBO are named partners.', f:'Room nights · ADR (average daily rate) · Occupancy', items:['Hotels','Airbnb','VRBO','Extended stay'], tie:'Downtown sold 320,000+ hotel rooms in March 2026, 91% of 2019 levels.'},
  {t:'Transportation & mobility', q:'How did they move?', why:'Transit and mobility data shows scale and pressure on the system. It also catches people that card data misses, like the fan who rode light rail and paid cash for a hot dog.', f:'Boardings · trips · counts by mode', items:['Lime','Sound Transit','King County Metro','WA State Ferries','Seattle Streetcar','SDOT ped & bike counts','Micromobility','Parking'], tie:'Parade day saw 334,000 transit boardings.'},
  {t:'Tax generation', q:'What came back to the public?', why:'This is the pillar that gets a policymaker\'s attention. Visitor spending creates public revenue that pays for services, so the model tracks how much returns to the region.', f:'Sales + Lodging + Admissions + B&O taxes', items:['Sales tax','Lodging tax','Admissions tax','B&O tax','Public revenue','Return to region'], tie:'Visit Seattle reported $109M in tax revenue from the 2026 World Cup.'},
  {t:'Workforce & jobs', q:'Who got paid?', why:'Behind every event are bartenders, ushers, drivers, security and volunteers. Counting them turns "economic impact" into paychecks people can picture.', f:'Jobs · Wages · Participation', items:['Direct workforce','Seasonal workforce','Event workforce','Volunteers','Workforce development partnerships'], tie:'King County has 204.3K leisure & hospitality workers out of 1.4M in all sectors.'}
];

const STAGES = [
  {t:'Sources', d:'The raw material. Every organization collects data for its own reasons, on its own schedule, in its own format. Your first job is knowing who holds what, and building the relationships to get it.',
   here:['<b>Postseason:</b> card transactions (DSA / Datafy), foot traffic (Placer.ai), hotel demand (Visit Seattle / STR), transit (Sound Transit / King County Metro), workforce (ESD / BLS), game data (ESPN / Pro Football Reference), plus Arrivalist, Visa Insights and Streetlight Data.','<b>Chamber:</b> 36 survey responses, budgets for 8 grantees, an event list and award amounts.'],
   skills:['Partnerships','Data-sharing agreements','Domain knowledge']},
  {t:'Ingest', d:'Bring the data in without changing it. Keep a raw copy of everything so you can always trace a number back to where it came from. Automate what repeats.',
   here:['Chamber files arrived in batches on August 5, August 14 and September 30, as survey exports and spreadsheets. Each batch was loaded as-is before anything was touched.','The postseason dashboard refreshes as partners publish, and finalized event reporting typically lands 3–4 weeks after each event.'],
   skills:['Python','APIs','Cloud storage','Scheduling']},
  {t:'Clean & standardize', d:'This is where most of the time goes. People type "$350–$700", "about 2k over 3 days" or "not sure." Systems define "visitor" differently. You set rules, write them down and apply them the same way every time.',
   here:['Free-text dollar answers were converted to numbers. A figure covering several days was counted once. Where someone gave a range, the upper bound was used, and the report shows the low-end result too.','Every activation was matched to the Chamber\'s own list and its award, and every place the records disagreed was flagged.'],
   skills:['SQL','Data quality rules','Documentation']},
  {t:'Model', d:'Join the sources, apply formulas and produce the numbers people will quote. Every metric needs a definition a stranger could reproduce.',
   here:['Spend per attendee = total card spend ÷ attendance ($3.8M ÷ 68.8K ≈ $55).','Net business result = gross sales − business spending, using only the 26 businesses that reported both.','The $16.6M impact is a modeled estimate layered on top of the $9.9M observed spend, and it is labeled that way.'],
   skills:['SQL','Statistics','Economic modeling','dbt']},
  {t:'Dashboards', d:'Put the answer in front of the people who need it, in a form they can use in five minutes. A good dashboard tells a story in order: what happened, compared to what, and why it matters.',
   here:['The postseason dashboard has six pages: Executive Overview, Event Comparison, Event Impact & Downtown, Visitor Impact, Category Insights and Mobility + Scale.','The Chamber work was delivered as an interactive dashboard plus a written report.'],
   skills:['Looker Studio','Tableau','Power BI','Design']},
  {t:'Decisions', d:'The whole point. If nobody spends money, writes a policy or changes a program because of your work, the pipeline isn\'t finished.',
   here:['<b>Sports Commission:</b> an evidence-based STIA allocation request and a repeatable annual report.','<b>Chamber:</b> 13 recommendations, starting with making the host-venue model the default and giving businesses 8–12 weeks\' notice.'],
   skills:['Storytelling','Public finance','Presenting']}
];

const RECS = [
  {g:'Activation design', items:[
    ['Make the host-venue model the default','Fund existing licensed venues to host viewings in their own space, rather than gathering vendors at a central site.','Maple Valley–Black Diamond +400% with 0 of 4 unprofitable; Federal Way −49% with 12 of 13 unprofitable, still −$6,018 after $5,000 in stipends.'],
    ['Publish booth placement, cuisine mix and voucher eligibility before vendors commit','Where a central format is used, tell vendors their position, which cuisines will be there and who gets attendee vouchers before they pay.','Federal Way vendors reported being placed behind the stage, uneven voucher access and overlapping cuisines.'],
    ['Give 8–12 weeks\' notice','Announce awards early enough for businesses to market and order stock.','18 of 28 named low attendance as their top challenge. The Skyway Coalition had one to two weeks\' notice.']]},
  {g:'Funding strategy', items:[
    ['Remove or reimburse up-front booth and participation fees','Cover fixed vendor costs from the grant, or switch flat fees to a percentage of sales so costs scale with traffic.','11 of 28 businesses paid booth or venue fees before earning anything. 21 of 28 asked for funding or reimbursement.'],
    ['Fund district-level marketing and a shared equipment pool','Pay for promotion once, centrally. Pool reusable tents, displays and signage.','14 businesses paid separately for marketing and 20 asked for marketing support.'],
    ['Track actual spending against every award','Ask each grantee for a one-page actuals report with receipts, and publish cost per attendee alongside results.','No receipts were collected. Cost per attendee ranged from about $2 to $100.']]},
  {g:'Survey improvements', items:[
    ['Replace free-text dollar answers with structured fields','Numeric fields for sales and costs, one per event date, with event name and ZIP code required.','Ranges, multi-day totals and "not sure" answers required interpretation. No ZIP or corridor data exists.'],
    ['Add a short attendee intercept survey and simple counts','Ask attendees their home ZIP, spending and whether they visited nearby businesses. Count at the entrance.','Visitor movement, attendee spending and spillover could not be measured this cycle.'],
    ['Collect a baseline and a 30-day follow-up','Ask for sales on a comparable normal day before the event, and check in 30 days after.','The agreement calls for pre-event, baseline and 30-day comparisons, but none were collected.']]},
  {g:'Business support', items:[
    ['Offer readiness help before the event, not after','Vendor matchmaking, permitting guidance and simple sales-tracking templates as part of the award.','13 businesses asked for matchmaking. Four organizers named impact tracking as a challenge.'],
    ['Turn willing participants into a spotlight series now','Follow up while interest is high to build the qualitative record the next funding request will need.','14 businesses agreed to an interview or spotlight, and 19 want information on future funding.']]},
  {g:'Economic development reporting', items:[
    ['Make a common reporting template a condition of award','Attendance, vendor count, vendor sales, budget and receipts within 14 days of the event.','Only 4 of 8 organizers reported vendor sales. Kent and Burien produced no business-level responses.'],
    ['Report outcomes by evidence type','Keep self-reports, measured counts and published regional estimates in separate lines. Never add them together.','This is what lets funders trust the numbers they cite.']]}
];

const QS = [
  ['The parade drew about nine times the stadium crowd but produced about $4.80 per person versus $55. Should the city put less money into parades?','Not necessarily. Spend per attendee is one metric, and a parade has different goals: civic pride, a shared moment and transit at scale (334,000 boardings). The data skill is choosing the metric that matches the goal, and saying out loud which one you picked.'],
  ['Card data saw $9.9M. Name three kinds of spending it can\'t see.','Cash purchases, spending outside the measured geography, and money that re-circulates afterward through local payrolls and suppliers. Bookings made before the trip can also land elsewhere. That gap is why a modeled estimate ($16.6M) exists, and why it has to be labeled as a model.'],
  ['Why would you present the minimum defensible number instead of the biggest one?','Because the biggest number gets challenged and the defensible one gets funded. Look at the World Cup: forecasts moved from $929M to $846M before the measured $889M. If you lead with a conservative baseline and build it the same way every year, people start to trust your trend line.'],
  ['Federal Way\'s vendors finished $11,018 behind. Was the program a failure there?','Financially, for those vendors, it underperformed. But 20 of 28 businesses would return, community connection was the top benefit, and the data explains why: the vendor model front-loads costs. Good analysis doesn\'t just grade a program. It tells the funder what to change next time.'],
  ['If you could add one new data source to the Sports Commission model, what would it be, and who would you need to call?','There are many good answers. Short-term rental data (Airbnb / VRBO) would sharpen lodging. Tax collections (WA Department of Revenue) would make the public-return pillar concrete. Every new source means a partnership, a data-sharing agreement and a cleaning rulebook.'],
  ['A council member asks: "How many of the 1.3M World Cup visitors were new to the region?" What do you say?','Say what the data supports. KNKX reported 45% came from outside Seattle, but "outside Seattle" isn\'t the same as "outside the region," and the 1.3M includes residents. Then offer a fix: an attendee intercept survey with home ZIP codes. Saying "here\'s what we know, and here\'s how we\'d find out" builds more trust than a guess.']
];

/* ---------- NAV / PROGRESS ---------- */
const bar = $('#progressBar');
const onScroll = () => {
  const h = document.documentElement;
  const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
  bar.style.width = (p*100).toFixed(2) + '%';
};
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

const navLinks = $$('.chapters a');
const chIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){
      navLinks.forEach(a => a.classList.toggle('on', a.dataset.ch === e.target.id));
      const on = navLinks.find(a => a.dataset.ch === e.target.id);
      if (on && on.scrollIntoView && window.innerWidth < 1080){
        const nav = $('.chapters');
        nav.scrollTo({left: on.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth'});
      }
    }
  });
}, {rootMargin:'-45% 0px -50% 0px'});
$$('section.chapter[id]').forEach(s => chIO.observe(s));

/* ---------- REVEAL + COUNT UP ---------- */
const fmt = (v, dec) => v.toLocaleString('en-US', {minimumFractionDigits:dec, maximumFractionDigits:dec});
function countUp(el){
  const target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec||'0',10);
  const pre = el.dataset.prefix||'', suf = el.dataset.suffix||'';
  if (reduce){ el.textContent = pre + fmt(target,dec) + suf; return; }
  const dur = 1300, t0 = performance.now();
  const step = t => {
    const k = Math.min(1,(t-t0)/dur), e = 1 - Math.pow(1-k,3);
    el.textContent = pre + fmt(target*e, dec) + suf;
    if (k<1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const revealTargets = $$('.kpi, .chart-card, .callout, .insight, .mini, .compare, .context-band, .q, .stia, .prose, .formula, .calc, .attr-step, .panel, .pg, .loop li, .fl, .vs, .evd, .role, .steps, .split-bar-wrap, .pillar-panel, .pipe-panel, .event-panel');
revealTargets.forEach(el => el.classList.add('reveal'));
const rIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    $$('[data-count]', el).forEach(c => { if(!c.dataset.done){ c.dataset.done = 1; countUp(c); } });
    $$('.split-bar', el).forEach(b => b.classList.add('in'));
    rIO.unobserve(el);
  });
}, {threshold:.15});
revealTargets.forEach(el => rIO.observe(el));

/* ---------- CHART DEFAULTS ---------- */
const C = {green:'#69BE28', grey:'#A5ACAF', blue:'#3FA9F5', gold:'#F2C14E', red:'#F07167', text:'#E9EEF3', muted:'#A9B4C2', grid:'rgba(165,172,175,.12)', orange:'#FFB37A', violet:'#B69CF7'};
Chart.defaults.color = C.muted;
Chart.defaults.font.family = "'Satoshi', system-ui, sans-serif";
Chart.defaults.font.size = 13;
Chart.defaults.borderColor = C.grid;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.boxHeight = 12;
Chart.defaults.plugins.legend.labels.color = C.text;
Chart.defaults.plugins.tooltip.backgroundColor = '#0A1A33';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(105,190,40,.5)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleFont = {weight:'700', size:14};
Chart.defaults.animation.duration = reduce ? 0 : 900;
Chart.defaults.maintainAspectRatio = false;

/* label plugin: draws value labels on bars */
const valueLabels = {
  id:'valueLabels',
  afterDatasetsDraw(chart, args, opts){
    if (!opts || !opts.fmt) return;
    const {ctx} = chart;
    ctx.save();
    ctx.font = "700 13px 'Satoshi', system-ui, sans-serif";
    chart.data.datasets.forEach((ds, di) => {
      if (opts.only !== undefined && opts.only !== di) return;
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      meta.data.forEach((el, i) => {
        const v = ds.data[i]; if (v === null || v === undefined) return;
        const label = opts.fmt(v, i, di);
        const horiz = chart.options.indexAxis === 'y';
        ctx.fillStyle = opts.color || C.text;
        if (horiz){
          const neg = v < 0;
          ctx.textBaseline = 'middle';
          if (neg && narrow()){ ctx.textAlign = 'left'; ctx.fillText(label, el.base + 6, el.y); }
          else { ctx.textAlign = neg ? 'right' : 'left'; ctx.fillText(label, el.x + (neg ? -8 : 8), el.y); }
        } else {
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(label, el.x, el.y - 6);
        }
      });
    });
    ctx.restore();
  }
};
Chart.register(valueLabels);

const charts = {};
function lazy(id, build){
  const el = document.getElementById(id); if (!el) return;
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting){ charts[id] = build(el); io.disconnect(); } }, {threshold:.2});
  io.observe(el);
}
const money = v => '$' + (v>=1 ? v.toFixed(2).replace(/\.?0+$/,'') + 'M' : Math.round(v*1000) + 'K');

/* ---------- EVENT SWITCHER ---------- */
const evShort = window.innerWidth < 600 ? [['Divisional','Jan 17'],['NFC Champ.','Jan 25'],['Parade','Feb 11']] : ['Divisional · Jan 17','NFC Champ. · Jan 25','Parade · Feb 11'];
function setEvent(i){
  const e = EVENTS[i];
  $$('.sw').forEach((b,j) => { b.classList.toggle('active', j===i); b.setAttribute('aria-selected', j===i); });
  const map = {evTotal:e.total, evLocal:e.local, evVisitor:e.visitor, evShare:e.share, evAtt:e.att, evCards:e.cards, evPerCard:e.perCard, evPerAtt:e.perAtt};
  Object.entries(map).forEach(([id,v]) => {
    const el = document.getElementById(id);
    el.classList.add('fade');
    setTimeout(() => { el.textContent = v; el.classList.remove('fade'); }, reduce ? 0 : 160);
  });
  $('#evNote').textContent = e.note;
  ['chEventSplit','chPerAtt'].forEach(id => {
    const ch = charts[id]; if (!ch) return;
    ch.data.datasets.forEach((ds, di) => {
      ds.backgroundColor = ds._base.map((c, j) => j===i ? c : c + '55');
    });
    ch.update();
  });
  window._ev = i;
}
$$('.sw').forEach(b => b.addEventListener('click', () => setEvent(+b.dataset.ev)));
setEvent(0);

lazy('chEventSplit', el => {
  const base = (c) => [c,c,c];
  const ch = new Chart(el, {type:'bar', data:{labels:evShort, datasets:[
    {label:'Local', data:[2.7,2.25,2.19], backgroundColor:base(C.grey), _base:base(C.grey), borderRadius:4, stack:'s'},
    {label:'Visitor', data:[1.1,0.9479,0.7092], backgroundColor:base(C.green), _base:base(C.green), borderRadius:4, stack:'s'}
  ]}, options:{
    plugins:{legend:{position:'top', align:'end'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${money(c.raw)}`, footer:items => 'Total: ' + money(items.reduce((a,b)=>a+b.raw,0))}}, valueLabels:{}},
    scales:{x:{grid:{display:false}, stacked:true, ticks:{color:C.text, maxRotation:0}}, y:{stacked:true, beginAtZero:true, max:4.5, ticks:{stepSize:0.5, callback:v => '$'+v+'M'}}}
  }, plugins:[{id:'totals', afterDatasetsDraw(chart){
    const {ctx} = chart; const meta = chart.getDatasetMeta(1);
    const tots = ['$3.8M','$3.2M','$2.9M'];
    ctx.save(); ctx.font = "800 15px 'Cabinet Grotesk', system-ui"; ctx.fillStyle = C.text; ctx.textAlign='center'; ctx.textBaseline='bottom';
    meta.data.forEach((b,i) => ctx.fillText(tots[i], b.x, b.y - 6)); ctx.restore();
  }}]});
  ch.data.datasets.forEach(ds => ds.backgroundColor = ds._base.map((c,j) => j===(window._ev||0) ? c : c+'55')); ch.update('none');
  return ch;
});

lazy('chPerAtt', el => {
  const b = [C.green, C.green, C.blue];
  const ch = new Chart(el, {type:'bar', data:{labels:evShort, datasets:[{label:'Spend per attendee', data:[55,47,4.8], backgroundColor:b.slice(), _base:b, borderRadius:6}]},
    options:{plugins:{legend:{display:false}, tooltip:{callbacks:{label:c => ` $${c.raw.toFixed(2)} per attendee`}}, valueLabels:{fmt:v => '$'+(v<10 ? v.toFixed(2) : v)}},
      scales:{x:{grid:{display:false}, ticks:{color:C.text, maxRotation:0}}, y:{beginAtZero:true, max:60, ticks:{stepSize:10, callback:v => '$'+v}}}}});
  ch.data.datasets[0].backgroundColor = b.map((c,j) => j===(window._ev||0) ? c : c+'55'); ch.update('none');
  return ch;
});

lazy('chEventDays', el => new Chart(el, {type:'bar', data:{
  labels:narrow() ? [['Jan 17','Divisional'],['Jan 25','NFC Champ.'],['Feb 11','Parade']] : ['Sat, Jan 17 · Divisional','Sun, Jan 25 · NFC Championship','Wed, Feb 11 · Parade'],
  datasets:[
    {label:'Local spend', data:[2.7,2.25,2.19], backgroundColor:C.grey, borderRadius:6},
    {label:'Visitor spend', data:[1.1,0.9479,0.7092], backgroundColor:C.green, borderRadius:6}
  ]}, options:{plugins:{legend:{position:'top', align:'end'}, tooltip:{callbacks:{label:c => ` ${c.dataset.label}: ${money(c.raw)}`}}, valueLabels:{fmt:v => money(v)}},
  scales:{x:{grid:{display:false}, ticks:{color:C.text}}, y:{beginAtZero:true, max:3, ticks:{stepSize:0.5, callback:v => '$'+v+'M'}}}}}));

/* ---------- CATEGORIES ---------- */
let catView = 'visitor';
lazy('chCat', el => new Chart(el, {type:'bar', data:{labels:CATS.map(c=>c[0]), datasets:[
  {label:'Visitor %', data:CATS.map(c=>c[1]), backgroundColor:CATS.map(c => c[1]>=50 ? C.green : c[1]>=25 ? '#69BE28B3' : '#69BE2866'), borderRadius:5, stack:'s'},
  {label:'Local %', data:CATS.map(c=>100-c[1]), backgroundColor:'#A5ACAF', borderRadius:5, stack:'s', hidden:true}
]}, options:{indexAxis:'y',
  plugins:{legend:{display:false}, tooltip:{callbacks:{label:c => ` ${c.dataset.label.replace(' %','')}: ${c.raw}%`}}, valueLabels:{fmt:v => v+'%', only:0}},
  scales:{x:{beginAtZero:true, max:100, stacked:true, ticks:{callback:v=>v+'%'}}, y:{stacked:true, grid:{display:false}, ticks:{color:C.text, font:{size:14, weight:'500'}}}}}}));
$$('[data-view]').forEach(b => b.addEventListener('click', () => {
  catView = b.dataset.view;
  $$('[data-view]').forEach(x => { x.classList.toggle('active', x===b); x.setAttribute('aria-pressed', x===b); });
  const ch = charts.chCat; if (!ch) return;
  const stack = catView === 'stack';
  ch.data.datasets[1].hidden = !stack;
  ch.options.plugins.legend.display = stack;
  ch.options.plugins.valueLabels = stack ? {} : {fmt:v => v+'%', only:0};
  ch.data.datasets[0].backgroundColor = stack ? C.green : CATS.map(c => c[1]>=50 ? C.green : c[1]>=25 ? '#69BE28B3' : '#69BE2866');
  $('#catTitle').textContent = stack ? 'Every category is mostly local except lodging and misc. retail.' : 'Lodging is 83% visitor-driven. Grocery is 19%.';
  ch.update();
}));

/* ---------- MODES ---------- */
lazy('chMode', el => new Chart(el, {type:'bar', data:{labels:MODES.map(m=>m[0]), datasets:[{label:'Boardings', data:MODES.map(m=>m[1]),
  backgroundColor:[C.blue,'#3FA9F5B3',C.green,'#69BE28B3','#A5ACAF','#A5ACAF'], borderRadius:6}]},
  options:{indexAxis:'y', plugins:{legend:{display:false}, tooltip:{callbacks:{label:c => ` ${c.raw}K boardings`}}, valueLabels:{fmt:v => v+'K'}},
  scales:{x:{beginAtZero:true, max:400, ticks:{callback:v=>v+'K'}}, y:{grid:{display:false}, ticks:{color:C.text, font:{size:14}}}}}}));

/* ---------- PILLARS ---------- */
function setPillar(i){
  const p = PILLARS[i];
  $$('.pl').forEach((b,j) => { b.classList.toggle('active', j===i); b.setAttribute('aria-selected', j===i); });
  $('#pillarPanel').innerHTML = `
    <div><p class="pp-q">Pillar ${i+1} · ${p.q}</p><h4>${p.t}</h4><p class="pp-why">${p.why}</p><p class="pp-f">${p.f}</p></div>
    <div><p class="pp-k">What it measures</p><ul class="pp-list">${p.items.map(x=>`<li>${x}</li>`).join('')}</ul>
    <p class="small" style="margin-top:16px;color:#CFF2B5"><b>In the Seattle data:</b> ${p.tie}</p></div>`;
}
$$('.pl').forEach(b => b.addEventListener('click', () => setPillar(+b.dataset.p)));
setPillar(0);

/* ---------- CALCULATOR ---------- */
const inp = id => document.getElementById(id);
function calc(){
  const a = +inp('iAtt').value, p = +inp('iPct').value, s = +inp('iStay').value, d = +inp('iSpend').value;
  const vis = a * p / 100, days = vis * s, sp = days * d;
  inp('vAtt').textContent = a.toLocaleString();
  inp('vPct').textContent = p + '%';
  inp('vStay').textContent = s;
  inp('vSpend').textContent = '$' + d;
  inp('oVis').textContent = Math.round(vis).toLocaleString();
  inp('oDays').textContent = Math.round(days).toLocaleString();
  inp('oSpend').textContent = '$' + Math.round(sp).toLocaleString();
}
['iAtt','iPct','iStay','iSpend'].forEach(id => inp(id).addEventListener('input', calc));
calc();

/* ---------- CHAMBER ---------- */
let netMode = 'before';
const netColors = arr => arr.map(v => v >= 0 ? C.green : C.red);
lazy('chNet', el => {
  const d = CITIES.map(c => c.before);
  return new Chart(el, {type:'bar', data:{labels:CITIES.map(c => narrow() && c.c.includes('–') ? ['Maple Valley–','Black Diamond'] : c.c), datasets:[{label:'Net result', data:d, backgroundColor:netColors(d), borderRadius:6}]},
    options:{indexAxis:'y', layout:{padding:{left:8, right:narrow() ? 46 : 16}},
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c => {
        const city = CITIES[c.dataIndex]; const v = c.raw;
        return [` Net: ${v<0?'−':'+'}$${Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2})}`, netMode==='before' ? ` Return: ${city.ret}` : ` ${city.note}`];
      }}}, valueLabels:{fmt:v => (v<0?'−':'+') + '$' + (narrow() ? (Math.abs(v)/1000).toFixed(1)+'K' : Math.abs(v).toLocaleString('en-US',{maximumFractionDigits:0}))}},
      scales:{x:{min:narrow() ? -18000 : -14000, max:narrow() ? 18000 : 16000, ticks:{callback:v => (v<0?'−':'') + '$' + Math.abs(v/1000) + 'K'}, grid:{color:c => c.tick.value===0 ? 'rgba(233,238,243,.5)' : C.grid}},
        y:{grid:{display:false}, ticks:{color:C.text, font:{size:14, weight:'500'}}}}}});
});
$$('[data-net]').forEach(b => b.addEventListener('click', () => {
  netMode = b.dataset.net;
  $$('[data-net]').forEach(x => { x.classList.toggle('active', x===b); x.setAttribute('aria-pressed', x===b); });
  const ch = charts.chNet; if (!ch) return;
  const d = CITIES.map(c => netMode==='before' ? c.before : c.after);
  ch.data.datasets[0].data = d; ch.data.datasets[0].backgroundColor = netColors(d); ch.update();
  $('#netTitle').textContent = netMode==='before' ? 'Same fund, very different results by city' : 'After $13,000 in direct awards, 17 of 26 businesses finished ahead';
}));

lazy('chWhy', el => new Chart(el, {type:'bar', data:{labels:['Community',['New','customers'],'Sales'], datasets:[
  {label:'Why they joined', data:[23,22,17], backgroundColor:C.blue, borderRadius:6},
  {label:'What they reported getting', data:[18,9,5], backgroundColor:C.green, borderRadius:6}
]}, options:{plugins:{legend:{position:'top', align:'end'}, tooltip:{callbacks:{
  title:i => ['Community: "promote to the community" vs "community connection"','New customers: "reach new customers" vs "new customers"','Sales: "increase sales" vs "increased sales"'][i[0].dataIndex],
  label:c => ` ${c.dataset.label}: ${c.raw} of 28`}}, valueLabels:{fmt:v => v}},
  scales:{x:{grid:{display:false}, ticks:{color:C.text, font:{size:14}, maxRotation:0}}, y:{beginAtZero:true, max:28, ticks:{stepSize:7}}}}}));

lazy('chBudget', el => new Chart(el, {type:'bar', data:{labels:narrow() ? [['Planning &','management'],['Paid to','businesses'],['Venue, screen,','permits'],['Giveaways &','food tickets'],'Marketing',['Artists, music,','photo'],'Contingency','Not itemized'] : ['Planning & management','Paid to businesses','Venue, screen, permits','Giveaways & food tickets','Marketing','Artists, music, photo','Contingency','Not itemized'],
  datasets:[{label:'Budget', data:[24276,13000,12350,10770,8200,7179,2825,400], backgroundColor:[C.grey,C.green,'#3FA9F5','#3FA9F5','#3FA9F5','#3FA9F5','#A5ACAF88','#A5ACAF55'], borderRadius:5}]},
  options:{indexAxis:'y', layout:{padding:{right:20}}, plugins:{legend:{display:false}, tooltip:{callbacks:{label:c => ` $${c.raw.toLocaleString()} (${(c.raw/790).toFixed(1)}%)`}}, valueLabels:{fmt:v => '$'+(v>=1000 ? (v/1000).toFixed(1)+'K' : v)}},
  scales:{x:{beginAtZero:true, max:30000, ticks:{callback:v => '$'+v/1000+'K'}}, y:{grid:{display:false}, ticks:{color:C.text, font:{size:narrow()?12:13}}}}}}));

/* recommendations */
let n = 0;
$('#recs').innerHTML = RECS.map(g => `<div class="rec-group"><h4>${g.g}</h4>${g.items.map(it => { n++; return `
  <div class="rec"><button aria-expanded="false"><span class="rn">${String(n).padStart(2,'0')}</span><span class="rt">${it[0]}</span><span class="chev" aria-hidden="true">+</span></button>
  <div class="rb"><p>${it[1]}</p><p class="ev"><b>Evidence:</b> ${it[2]}</p></div></div>`; }).join('')}</div>`).join('');
$$('.rec button').forEach(b => b.addEventListener('click', () => {
  const r = b.parentElement; const open = !r.classList.contains('open');
  r.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
}));
const firstRec = $('.rec'); if (firstRec){ firstRec.classList.add('open'); firstRec.querySelector('button').setAttribute('aria-expanded','true'); }

/* ---------- PIPELINE ---------- */
function setStage(i){
  const s = STAGES[i];
  $$('.ps').forEach((b,j) => { b.classList.toggle('active', j===i); b.setAttribute('aria-selected', j===i); });
  $('#pipePanel').innerHTML = `<div><p class="pp-q" style="font-size:14px;color:var(--green);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Stage ${i+1} of 6</p><h4>${s.t}</h4><p>${s.d}</p>
    <p class="pp-k" style="margin-top:18px">Skills you use here</p><div class="skill">${s.skills.map(x=>`<span>${x}</span>`).join('')}</div></div>
    <div class="here"><p class="pp-k">In this project</p>${s.here.map(h=>`<p>${h}</p>`).join('')}</div>`;
}
$$('.ps').forEach(b => b.addEventListener('click', () => setStage(+b.dataset.s)));
setStage(0);

/* ---------- QUESTION CARDS ---------- */
$('#qcards').innerHTML = QS.map((q,i) => `<button class="qc" aria-pressed="false" aria-label="Question ${i+1}. ${q[0].replace(/"/g,'&quot;')} Tap to reveal a response.">
  <div class="qc-in"><div class="qc-f"><p class="qc-n">QUESTION ${String(i+1).padStart(2,'0')}</p><p class="qc-q">${q[0]}</p><p class="qc-hint">Tap to reveal one way to think about it ↻</p></div>
  <div class="qc-b"><p class="qc-n">ONE ANSWER</p><p>${q[1]}</p></div></div></button>`).join('');
$$('.qc').forEach(c => c.addEventListener('click', () => { const f = !c.classList.contains('flip'); c.classList.toggle('flip', f); c.setAttribute('aria-pressed', f); }));

/* bars inside compare/workforce */
const barIO = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); barIO.unobserve(e.target);} }), {threshold:.3});
$$('.compare, .workforce').forEach(el => barIO.observe(el));
})();
