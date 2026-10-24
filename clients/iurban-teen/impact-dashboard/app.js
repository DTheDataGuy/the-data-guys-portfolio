(async function(){
/* ---------- constants ---------- */
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FAMS=['Signature Events','Summits','Industry Days & Tours','Camps, Clubs & Workshops','Environment & Service'];
const REGIONS=['WA','OR','TX','CA','Other','Not provided'];
const REGION_NAMES={WA:'Washington',OR:'Oregon',TX:'Texas',CA:'California',Other:'Other states','Not provided':'Not provided'};
const BANDS=['Under 11','11–13','14–15','16–18','19–24','25+'];
const LS={imports:'iut_imports_v1',over:'iut_overrides_v1',out:'iut_outcomes_v1'};
const STAGES=[
  {k:'checkins',n:'Programs',label:'Check-ins (attended)',hint:'From Eventbrite check-in exports'},
  {k:'unique',n:'Programs',label:'Unique students served',hint:'After matching across events'},
  {k:'graduation',n:'Graduation',label:'High school graduates',hint:'Alumni survey'},
  {k:'college',n:'College & Training',label:'Enrolled in college or training',hint:'Alumni survey'},
  {k:'credentials',n:'Credentials',label:'Credentials or scholarships earned',hint:'Records + survey'},
  {k:'careers',n:'Careers',label:'Internships or careers started',hint:'Alumni follow-up'}];

/* ---------- storage helpers ---------- */
const load=(k,d)=>d;
const save=(k,v)=>{};
let imports=load(LS.imports,[]);      // [{file, year, month, data:{cube,returning,referral,age,events}}]
let overrides=load(LS.over,{});       // {eventName: family}
let outcomes=load(LS.out,{});         // {key:{value,note}}

/* ---------- classification ---------- */
function classify(n){
  const l=n.toLowerCase();
  if(/unnamed january/.test(l))return 'Signature Events';
  if(/service day/.test(l))return 'Environment & Service';
  if(/mlk|martin luther|gala|luncheon|black history|afro-futurism|malcolm|holiday crafts|happy hour|du ?bois|refugefest/.test(l))return 'Signature Events';
  if(/summit/.test(l))return 'Summits';
  if(/microsoft|electronic arts|intel|blue origin|mechatronics|komo|opb|mighty media|stem tour|georgetown|recology|machinist|supply chain|career compass|nba|sports administration/.test(l))return 'Industry Days & Tours';
  if(/beach|cedar|earth day|farm|canoe|waterways|wildlife|leavenworth|outdoor|habitat|fish|garden/.test(l))return 'Environment & Service';
  return 'Camps, Clubs & Workshops';
}
const famOf=n=>FAMS.includes(overrides[n])?overrides[n]:classify(n);

/* ---------- base data ---------- */
const RAW=await (await fetch('data.json')).json();
const unpack=(arr,dim)=>arr.map(r=>({year:r[0],month:r[1],name:RAW.names[r[2]],role:r[3]==='V'?'Volunteer':'Participant',[dim]:r[4],n:r[5]}));
const BASE={cube:unpack(RAW.cube,'region'),returning:unpack(RAW.returning,'answer'),referral:unpack(RAW.referral,'source'),age:unpack(RAW.age,'band'),
  events:RAW.events.map(r=>({year:r[0],month:r[1],name:RAW.names[r[2]],id:r[3],n:r[4]}))};

let D; // merged data
function merge(){
  const replaced=new Set(imports.map(i=>i.year+'-'+i.month));
  const keep=r=>!replaced.has(r.year+'-'+r.month);
  D={};
  for(const t of ['cube','returning','referral','age','events']){
    D[t]=BASE[t].filter(keep);
    imports.forEach(i=>D[t].push(...i.data[t]));
  }
  D.coverage={};
  D.cube.forEach(r=>{(D.coverage[r.year]=D.coverage[r.year]||new Set()).add(r.month)});
  D.years=Object.keys(D.coverage).map(Number).sort();
  D.listings={};
  D.events.forEach(e=>{ if(e.id)(D.listings[e.year]=D.listings[e.year]||new Set()).add(e.id) });
}

/* ---------- state ---------- */
const S={year:'all',region:'all',family:'all',role:'all'};
const fmt=n=>Number(n).toLocaleString('en-US');
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const famColor=f=>css(['--c1','--c2','--c3','--c4','--c5'][FAMS.indexOf(f)]||'--c6');
const charts={};
const famSel=document.getElementById('familySel');
FAMS.forEach(f=>{const o=document.createElement('option');o.value=f;o.textContent=f;famSel.appendChild(o)});

function rebuildYearChips(){
  const el=document.getElementById('yearChips');
  const span=D.years.length>1?`${D.years[0]}–${D.years[D.years.length-1]}`:String(D.years[0]||'All');
  el.innerHTML=`<button class="chip" data-year="all">${span}</button>`+D.years.map(y=>`<button class="chip" data-year="${y}">${y}</button>`).join('');
  el.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>setFilter('year',c.dataset.year)));
  if(S.year!=='all'&&!D.years.includes(+S.year))S.year='all';
  syncControls();
}
const yrOK=r=>S.year==='all'||r.year==+S.year;
const match=(r,skip=[])=>(skip.includes('year')||yrOK(r))&&(skip.includes('region')||S.region==='all'||r.region===S.region)&&(skip.includes('family')||S.family==='all'||famOf(r.name)===S.family)&&(skip.includes('role')||S.role==='all'||r.role===S.role);
const matchNR=r=>yrOK(r)&&(S.family==='all'||famOf(r.name)===S.family)&&(S.role==='all'||r.role===S.role);
const sum=a=>a.reduce((s,r)=>s+r.n,0);
const supp=n=>n<10?'<10':fmt(n);
const yearsLabel=()=>{ if(S.year!=='all'){const c=D.coverage[S.year];return c&&c.size<12?`${S.year} (${[...c].sort((a,b)=>a-b).map(m=>MONTHS[m-1]).join(', ').replace(/^(\w+),.*,\s(\w+)$/,'$1–$2')})`:S.year;} return D.years.length>1?`${D.years[0]}–${D.years[D.years.length-1]}`:String(D.years[0]); };

function countTo(el,to){
  const from=+(el.dataset.v||0);el.dataset.v=to;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=fmt(to);return}
  const t0=performance.now(),dur=700;
  const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(p<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}
function baseOpts(extra={}){
  const grid=css('--border-2'),tick=css('--muted');
  return Object.assign({responsive:true,maintainAspectRatio:false,animation:{duration:650},
    plugins:{legend:{display:false},tooltip:{backgroundColor:css('--navy'),titleFont:{family:'Satoshi',weight:'700'},bodyFont:{family:'Satoshi'},padding:10,cornerRadius:8,
      callbacks:{label:c=>` ${c.dataset.label?c.dataset.label+': ':''}${fmt(c.parsed.y??c.parsed.x??c.parsed)}`}}},
    scales:{x:{grid:{display:false},ticks:{color:tick,font:{family:'Satoshi',size:12}},border:{display:false}},
            y:{grid:{color:grid},ticks:{color:tick,font:{family:'Satoshi',size:12},precision:0},border:{display:false},beginAtZero:true}}},extra);
}
const legendTop=()=>({display:true,position:'top',align:'end',labels:{boxWidth:10,boxHeight:10,color:css('--muted'),font:{family:'Satoshi'}}});
const hbarScales=()=>({x:{grid:{color:css('--border-2')},ticks:{color:css('--muted'),font:{family:'Satoshi'}},border:{display:false}},y:{grid:{display:false},ticks:{color:css('--text'),font:{family:'Satoshi',size:13,weight:'500'}},border:{display:false}}});
function upsert(id,cfg){ if(charts[id]){charts[id].data=cfg.data;charts[id].options=cfg.options;charts[id].update()} else charts[id]=new Chart(document.getElementById(id),cfg) }
const YC=['--c1','--c2','--c3','--c4'];

/* ---------- render ---------- */
function render(){
  const rows=D.cube.filter(r=>match(r));
  const total=sum(rows);
  const yrs=S.year==='all'?D.years:[+S.year];

  countTo(document.getElementById('heroNum'),total);
  document.getElementById('heroLabel').textContent=`${S.role==='Volunteer'?'volunteer ':S.role==='Participant'?'participant ':''}registrations, ${yearsLabel()}`+(S.region!=='all'?` · ${REGION_NAMES[S.region]}`:'')+(S.family!=='all'?` · ${S.family}`:'');

  const listings=yrs.reduce((a,y)=>a+(D.listings[y]?D.listings[y].size:0),0);
  const vol=sum(rows.filter(r=>r.role==='Volunteer'));
  const statesKnown=new Set(rows.filter(r=>['WA','OR','TX','CA'].includes(r.region)&&r.n>0).map(r=>r.region)).size;
  const retYes=sum(D.returning.filter(r=>matchNR(r)&&r.answer==='Yes'));
  const kpis=[
    {l:'Event listings',v:listings,s:yrs.map(y=>`${D.listings[y]?D.listings[y].size:0} in ${y}`).join(' · '),c:'--c1'},
    {l:'Volunteer registrations',v:vol,s:'Event or ticket labeled volunteer',c:'--c2'},
    {l:'Core states reached',v:statesKnown,s:'Washington · Oregon · Texas · California',c:'--c3'},
    {l:'Marked returning',v:retYes,s:'Self-reported · all regions',c:'--c4'}];
  const kEl=document.getElementById('kpis');
  if(!kEl.children.length)kEl.innerHTML=kpis.map((k,i)=>`<div class="kpi" style="--kc:var(${k.c})"><div class="kpi-l">${k.l}</div><div class="kpi-v" id="k${i}">0</div><div class="kpi-s" id="ks${i}"></div></div>`).join('');
  kpis.forEach((k,i)=>{countTo(document.getElementById('k'+i),k.v);document.getElementById('ks'+i).textContent=k.s});

  // trend
  const ds=yrs.map((y,i)=>({label:String(y),data:MONTHS.map((m,mi)=>D.coverage[y]&&D.coverage[y].has(mi+1)?sum(rows.filter(r=>r.year===y&&r.month===mi+1)):null),backgroundColor:css(yrs.length>1?YC[i%4]:'--c2'),borderRadius:6,maxBarThickness:26}));
  upsert('trendChart',{type:'bar',data:{labels:MONTHS,datasets:ds},options:baseOpts({plugins:{...baseOpts().plugins,legend:yrs.length>1?legendTop():{display:false}}})});

  const famTotals=FAMS.map(f=>sum(rows.filter(r=>famOf(r.name)===f)));
  upsert('mixChart',{type:'doughnut',data:{labels:FAMS,datasets:[{data:famTotals,backgroundColor:FAMS.map(famColor),borderColor:css('--surface'),borderWidth:3,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',animation:{duration:650},
      plugins:{legend:{position:'bottom',labels:{boxWidth:10,boxHeight:10,usePointStyle:true,color:css('--muted'),font:{family:'Satoshi',size:12},padding:12}},
        tooltip:{callbacks:{label:c=>` ${c.label}: ${fmt(c.parsed)} (${total?Math.round(c.parsed/total*100):0}%)`}}},
      onClick:(e,els)=>{if(els.length)setFilter('family',FAMS[els[0].index])}}});

  // journey
  const ov=k=>{const o=outcomes[k];return o&&o.value!==''&&o.value!=null?Number(o.value):null};
  const progVal=ov('unique')??ov('checkins');
  const jd=[
    {n:'Interest',v:fmt(total),note:'Registrations',cls:'live'},
    {n:'Programs',v:progVal!=null?fmt(progVal):'Next',note:ov('unique')!=null?'Unique students (entered)':ov('checkins')!=null?'Check-ins (entered)':'Check-ins & unique students',cls:progVal!=null?'live':'progress'},
    ...['graduation','college','credentials','careers'].map((k,i)=>{const v=ov(k);return {n:['Graduation','College & Training','Credentials','Careers'][i],v:v!=null?fmt(v):'Phase 2',note:v!=null?'Entered by team':['Alumni survey','Alumni survey','Scholarship & alumni records','Alumni follow-up'][i],cls:v!=null?'live':''}})];
  const icons=['M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 21h6','M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M21 20v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8','M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5','M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6','M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1','M4 7h16v13H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'];
  document.getElementById('journeyMini').innerHTML=jd.map((s,i)=>`<div class="jstep ${s.cls}"><div class="jdot"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[i]}"/></svg></div><div class="jname">${esc(s.n)}</div><div class="jval">${esc(s.v)}</div><div class="jnote">${esc(s.note)}</div></div>`).join('');
  const st=[
    {i:'01',n:'Interest',big:fmt(total),p:'Young people and families registering for iUrban Teen experiences.',t:'measured',tl:'Measured',live:1},
    {i:'02',n:'Programs',big:progVal!=null?fmt(progVal):'Next',p:ov('unique')!=null?'Unique students served, entered by the team.':ov('checkins')!=null?'Check-ins, entered by the team.':'Check-ins and unique students, matched across events and years.',t:progVal!=null?'self':'next',tl:progVal!=null?'Entered by team':'Connecting next',live:progVal!=null},
    ...['graduation','college','credentials','careers'].map((k,i)=>{const v=ov(k);return {i:'0'+(i+3),n:['Graduation','College & Training','Credentials','Careers'][i],big:v!=null?fmt(v):'Phase 2',
      p:v!=null&&outcomes[k].note?outcomes[k].note:['High school graduation reported through alumni follow-up.','Enrollment in college, trades and training programs.','Degrees, certifications and scholarships earned.','Internships, jobs and careers in STEM and beyond.'][i],
      t:v!=null?'self':'next',tl:v!=null?'Entered by team':['Alumni survey','Alumni survey','Records + survey','Alumni follow-up'][i],live:v!=null}})];
  document.getElementById('stages').innerHTML=st.map(s=>`<div class="stage ${s.live?'live':''}"><span class="stage-i">${s.i}</span><h3>${s.n}</h3><div class="big">${s.big}</div><p>${esc(s.p)}</p><span class="tag ${s.t}">${s.tl}</span></div>`).join('');

  // programs
  const famRows=D.cube.filter(r=>match(r,['family']));
  const famAll=FAMS.map(f=>sum(famRows.filter(r=>famOf(r.name)===f)));
  upsert('famChart',{type:'bar',data:{labels:FAMS.map(f=>f.replace(', Clubs & Workshops',' & Clubs')),datasets:[{data:famAll,backgroundColor:FAMS.map(f=>S.family==='all'||S.family===f?famColor(f):famColor(f)+'40'),borderRadius:8,maxBarThickness:34}]},
    options:baseOpts({indexAxis:'y',onClick:(e,els)=>{if(els.length){const f=FAMS[els[0].index];setFilter('family',S.family===f?'all':f)}},scales:hbarScales()})});
  const fyRows=D.cube.filter(r=>match(r,['year','family']));
  upsert('famYearChart',{type:'bar',data:{labels:FAMS.map(f=>f.replace(', Clubs & Workshops',' & Clubs').replace(' & Tours','')),datasets:D.years.map((y,i)=>({label:String(y),data:FAMS.map(f=>sum(fyRows.filter(r=>r.year===y&&famOf(r.name)===f))),backgroundColor:css(YC[i%4]),borderRadius:6,maxBarThickness:28}))},
    options:baseOpts({plugins:{...baseOpts().plugins,legend:legendTop()}})});
  document.getElementById('famYearSub')&&(document.getElementById('famYearSub').textContent=D.years.map(y=>`${y}: ${D.coverage[y].size} months`).join(' · '));
  renderTable();

  // reach
  const regRows=D.cube.filter(r=>match(r,['region']));
  const regVals=REGIONS.map(g=>sum(regRows.filter(r=>r.region===g)));
  upsert('regionChart',{type:'bar',data:{labels:REGIONS.map(g=>REGION_NAMES[g]),datasets:[{data:regVals,backgroundColor:REGIONS.map((g,i)=>(S.region==='all'||S.region===g)?(i<4?css('--c3'):css('--faint')):css('--c3')+'40'),borderRadius:8,maxBarThickness:44}]},
    options:baseOpts({onClick:(e,els)=>{if(els.length){const g=REGIONS[els[0].index];setFilter('region',S.region===g?'all':g)}}})});
  const refRows=D.referral.filter(matchNR);
  const srcs=[...new Set(refRows.map(r=>r.source))].filter(s=>s!=='Not answered');
  const refVals=srcs.map(s=>({s,n:sum(refRows.filter(r=>r.source===s))})).filter(r=>r.n>=10).sort((a,b)=>b.n-a.n).slice(0,8);
  upsert('refChart',{type:'bar',data:{labels:refVals.map(r=>r.s),datasets:[{data:refVals.map(r=>r.n),backgroundColor:css('--c4'),borderRadius:8,maxBarThickness:30}]},options:baseOpts({indexAxis:'y',scales:hbarScales()})});

  const rr=D.returning.filter(matchNR);
  const ry=yrs.map(y=>{const q=rr.filter(r=>r.year===y);return {y,yes:sum(q.filter(r=>r.answer==='Yes')),no:sum(q.filter(r=>r.answer==='No')),na:sum(q.filter(r=>r.answer==='Not answered'))}});
  const totYes=ry.reduce((a,r)=>a+r.yes,0);
  document.getElementById('retBlock').innerHTML=`<div class="ret-callout"><b>${supp(totYes)}</b> registrations marked returning, ${yearsLabel()}.</div>`+
    ry.map(r=>{const t=r.yes+r.no+r.na||1;const seg=(n,c,l)=>`<div style="flex:${n};background:${c}" title="${l}: ${supp(n)}">${n/t>.09?supp(n):''}</div>`;
      return `<div class="ret-row"><div class="ret-y">${r.y}</div><div class="ret-bar">${seg(r.yes,css('--c3'),'Returning')}${seg(r.no,css('--c1'),'First time')}${seg(r.na,css('--faint'),'Not answered')}</div></div>`}).join('')+
    `<div class="ret-legend"><span><i style="background:var(--c3)"></i>Returning</span><span><i style="background:var(--c1)"></i>First time</span><span><i style="background:var(--faint)"></i>Not answered</span></div>`;

  const ar=D.age.filter(matchNR);const av=BANDS.map(b=>sum(ar.filter(r=>r.band===b)));
  upsert('ageChart',{type:'bar',data:{labels:BANDS,datasets:[{data:av.map(n=>n<10?0:n),backgroundColor:BANDS.map((b,i)=>i>=1&&i<=3?css('--c2'):css('--c2')+'70'),borderRadius:8,maxBarThickness:44}]},
    options:baseOpts({plugins:{...baseOpts().plugins,tooltip:{...baseOpts().plugins.tooltip,callbacks:{label:c=>' '+supp(av[c.dataIndex])}}}})});

  document.getElementById('coverage').innerHTML=D.years.map(y=>`<div class="cov-row"><b>${y}</b>${MONTHS.map((m,i)=>`<div class="cov-c ${D.coverage[y].has(i+1)?'on':''}" title="${m} ${y}">${m[0]}</div>`).join('')}</div>`).join('');
  document.getElementById('footSrc').textContent=`Source: Eventbrite registration exports, ${D.years.map(y=>`${y} (${D.coverage[y].size} months)`).join(' and ')}${imports.length?` · includes ${imports.length} imported file${imports.length>1?'s':''}`:''}.`;
  renderMap();
  renderHighlights();
  renderImpact();
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));


function renderHighlights(){
  const ev=eventRollup().filter(e=>yrOK(e)&&!e.vol&&!/^Unnamed/.test(e.name)&&(S.family==='all'||e.family===S.family));
  const byName=new Map();ev.forEach(e=>{const key=e.name.toLowerCase().replace(/\s+/g,' ').trim();const o=byName.get(key)||{name:e.name,family:e.family,n:0,years:new Set()};o.n+=e.n;o.years.add(e.year);byName.set(key,o)});
  const list=[...byName.values()];
  document.getElementById('breadth').innerHTML=FAMS.map(f=>{const l=list.filter(e=>e.family===f).sort((a,b)=>b.n-a.n);return `<div class="bcol" style="--bc:${famColor(f)}"><h3>${f}</h3><div class="bn">${l.length}</div><div class="bl">distinct experiences · ${fmt(l.reduce((a,e)=>a+e.n,0))} registrations</div><ul>${l.slice(0,4).map(e=>`<li>${esc(e.name)}</li>`).join('')}</ul></div>`}).join('');
  document.getElementById('breadthSub').textContent=`${list.length} distinct experiences, ${yearsLabel()}, excluding volunteer listings`;
  const top=list.sort((a,b)=>b.n-a.n).slice(0,10);const mx=Math.max(1,...top.map(e=>e.n));
  document.getElementById('top10').innerHTML=top.map(e=>`<li><div>${esc(e.name)}<div class="tb" style="width:${Math.round(e.n/mx*100)}%;background:${famColor(e.family)}"></div></div><small>${fmt(e.n)}</small></li>`).join('');
  document.getElementById('topSub').textContent=`Top 10 by registrations, ${yearsLabel()}`;
  const rows=D.cube.filter(r=>match(r,['family']));
  const cells=FAMS.map(f=>MONTHS.map((m,mi)=>sum(rows.filter(r=>r.month===mi+1&&famOf(r.name)===f))));
  const hm=Math.max(1,...cells.flat());
  document.getElementById('heat').innerHTML=`<div class="hrow hh"><span></span>${MONTHS.map(m=>`<i>${m[0]}</i>`).join('')}</div>`+FAMS.map((f,fi)=>`<div class="hrow"><span>${f.replace(', Clubs & Workshops',' & Clubs').replace(' & Tours','')}</span>${cells[fi].map((v,mi)=>`<i title="${f}, ${MONTHS[mi]}: ${supp(v)}" style="background:${v?famColor(f):'transparent'};opacity:${v?(.18+.82*v/hm).toFixed(2):1}"></i>`).join('')}</div>`).join('');
}


function renderImpact(){
  const yrs=S.year==='all'?D.years:[+S.year];
  const rows=D.cube.filter(r=>match(r,['year']));
  const bars=(labels,sets,extra={})=>({type:'bar',data:{labels,datasets:sets.map((s,i)=>({borderRadius:6,maxBarThickness:36,backgroundColor:css(YC[i%4]),...s}))},options:baseOpts({plugins:{...baseOpts().plugins,legend:sets.length>1?legendTop():{display:false}},...extra})});
  const tot=y=>sum(rows.filter(r=>r.year===y));
  const pm=yrs.map(y=>Math.round(tot(y)/(D.coverage[y]?D.coverage[y].size:1)));
  const pl=yrs.map(y=>+(tot(y)/((D.listings[y]&&D.listings[y].size)||1)).toFixed(1));
  const rr=D.returning.filter(r=>(S.family==='all'||famOf(r.name)===S.family)&&(S.role==='all'||r.role===S.role));
  const rs=yrs.map(y=>{const q=rr.filter(r=>r.year===y);const Y=sum(q.filter(r=>r.answer==='Yes')),N=sum(q.filter(r=>r.answer==='No'));return Y+N?Math.round(Y/(Y+N)*100):0});
  const k=document.getElementById('impKpis');
  k.innerHTML=yrs.map((y,i)=>`<div class="kpi" style="--kc:var(${YC[i%4]})"><div class="kpi-l">${y} · ${D.coverage[y].size} months</div><div class="kpi-v">${fmt(tot(y))}</div><div class="kpi-s">${pm[i]} per month · ${pl[i]} per listing · ${rs[i]}% returning (answered)</div></div>`).join('');
  upsert('impPerMonth',bars(yrs.map(String),[{data:pm,backgroundColor:yrs.map((y,i)=>css(YC[i%4]))}]));
  upsert('impPerListing',bars(yrs.map(String),[{data:pl,backgroundColor:yrs.map((y,i)=>css(YC[i%4]))}]));
  upsert('impRet',bars(yrs.map(String),[{data:rs,backgroundColor:yrs.map((y,i)=>css(YC[i%4]))}],{scales:{...baseOpts().scales,y:{...baseOpts().scales.y,max:100,ticks:{...baseOpts().scales.y.ticks,callback:v=>v+'%'}}}}));
  const vr=D.cube.filter(r=>r.role==='Volunteer'&&(S.region==='all'||r.region===S.region));
  const sf=FAMS.map(f=>f.replace(', Clubs & Workshops',' & Clubs').replace(' & Tours',''));
  upsert('impVol',bars(sf,yrs.map(y=>({label:String(y),data:FAMS.map(f=>sum(vr.filter(r=>r.year===y&&famOf(r.name)===f)))}))));
  const ar=D.age.filter(r=>(S.family==='all'||famOf(r.name)===S.family)&&(S.role==='all'||r.role===S.role));
  upsert('impAge',bars(BANDS,yrs.map(y=>({label:String(y),data:BANDS.map(b=>{const v=sum(ar.filter(r=>r.year===y&&r.band===b));return v<10?0:v})}))));
  const fr=D.referral.filter(r=>r.source!=='Not answered'&&(S.family==='all'||famOf(r.name)===S.family)&&(S.role==='all'||r.role===S.role));
  const srcs=[...new Set(fr.map(r=>r.source))];
  upsert('impRef',bars(srcs,yrs.map(y=>({label:String(y),data:srcs.map(s=>{const v=sum(fr.filter(r=>r.year===y&&r.source===s));return v<10?0:v})}))));
  const sr=D.cube.filter(r=>match(r,['year','region']));
  upsert('impState',bars(REGIONS.map(g=>REGION_NAMES[g]),yrs.map(y=>({label:String(y),data:REGIONS.map(g=>sum(sr.filter(r=>r.year===y&&r.region===g)))}))));
  const labs=[],cum=[];let run=0;yrs.forEach(y=>[...D.coverage[y]].sort((a,b)=>a-b).forEach(m=>{run+=sum(rows.filter(r=>r.year===y&&r.month===m));labs.push(MONTHS[m-1]+' '+String(y).slice(2));cum.push(run)}));
  upsert('impCum',{type:'line',data:{labels:labs,datasets:[{data:cum,borderColor:css('--c2'),backgroundColor:css('--c2')+'30',fill:true,tension:.3,pointRadius:3}]},options:baseOpts()});

  // outcomes & engagement
  const ov=k=>{const o=outcomes[k];return o&&o.value!==''&&o.value!=null?Number(o.value):null};
  const fl=[{l:'Registrations',v:sum(rows.filter(r=>yrs.includes(r.year)))},...STAGES.map(s=>({l:s.label,v:ov(s.k)}))];
  upsert('impFunnel',{type:'bar',data:{labels:fl.map(f=>f.v==null?f.l+' (add in Data Studio)':f.l),datasets:[{data:fl.map(f=>f.v||0),backgroundColor:fl.map((f,i)=>i?css('--c4'):css('--c1')),borderRadius:6,maxBarThickness:26}]},options:baseOpts({indexAxis:'y',scales:hbarScales()})});
  const rf=D.returning.filter(r=>S.role==='all'||r.role===S.role);
  upsert('impRetFam',bars(sf,yrs.map(y=>({label:String(y),data:FAMS.map(f=>{const q=rf.filter(r=>r.year===y&&famOf(r.name)===f);const Y=sum(q.filter(r=>r.answer==='Yes')),N=sum(q.filter(r=>r.answer==='No'));return Y+N>=10?Math.round(Y/(Y+N)*100):0})})),{scales:{...baseOpts().scales,y:{...baseOpts().scales.y,max:100,ticks:{...baseOpts().scales.y.ticks,callback:v=>v+'%'}}}}));
  const vc=D.cube.filter(r=>match(r,['year','role']));
  upsert('impVolRatio',bars(yrs.map(String),[{data:yrs.map(y=>{const v=sum(vc.filter(r=>r.year===y&&r.role==='Volunteer')),p=sum(vc.filter(r=>r.year===y&&r.role==='Participant'));return p?+(v/p*100).toFixed(1):0}),backgroundColor:yrs.map((y,i)=>css(YC[i%4]))}]));
  const B=[['1–9',1,9],['10–24',10,24],['25–49',25,49],['50–99',50,99],['100+',100,1e9]];
  const er=eventRollup().filter(e=>(S.family==='all'||e.family===S.family)&&!/^Unnamed/.test(e.name));
  upsert('impSize',bars(B.map(b=>b[0]),yrs.map(y=>({label:String(y),data:B.map(b=>er.filter(e=>e.year===y&&e.n>=b[1]&&e.n<=b[2]).length)}))));
  const fcube=D.cube.filter(r=>match(r,['year','family']));
  const mk=[];yrs.forEach(y=>[...D.coverage[y]].sort((a,b)=>a-b).forEach(m=>mk.push([y,m])));
  upsert('impFamTrend',{type:'line',data:{labels:mk.map(([y,m])=>MONTHS[m-1]+' '+String(y).slice(2)),datasets:FAMS.map(f=>({label:f.replace(', Clubs & Workshops',' & Clubs'),data:mk.map(([y,m])=>sum(fcube.filter(r=>r.year===y&&r.month===m&&famOf(r.name)===f))),borderColor:famColor(f),backgroundColor:famColor(f),tension:.3,pointRadius:2}))},options:baseOpts({plugins:{...baseOpts().plugins,legend:legendTop()}})});
  const rfam=D.referral.filter(r=>yrs.includes(r.year)&&r.source!=='Not answered'&&(S.role==='all'||r.role===S.role));
  const ss=[...new Set(rfam.map(r=>r.source))];
  upsert('impRefFam',{type:'bar',data:{labels:sf,datasets:ss.map((s,i)=>({label:s,data:FAMS.map(f=>sum(rfam.filter(r=>r.source===s&&famOf(r.name)===f))),backgroundColor:css(['--c1','--c2','--c3','--c4','--c5','--c6'][i%6]),borderRadius:4}))},options:baseOpts({plugins:{...baseOpts().plugins,legend:legendTop()},scales:{x:{...baseOpts().scales.x,stacked:true},y:{...baseOpts().scales.y,stacked:true}}})});

  // funder view (published data)
  const F=RAW.funder;const fy=yrs.filter(y=>F.contacts[y]);
  const fsum=(arr,y,f)=>arr.filter(r=>r[0]===y&&(!f||r[1]===f)).reduce((s,r)=>s+r[2],0);
  const freeN=fy.reduce((s,y)=>s+fsum(F.free,y),0),paidN=fy.reduce((s,y)=>s+fsum(F.paid,y),0),revN=fy.reduce((s,y)=>s+fsum(F.rev,y),0);
  const multi=fy.reduce((s,y)=>s+F.freq[y]['2']+F.freq[y]['3']+F.freq[y]['4+'],0);
  const money=v=>'$'+Math.round(v).toLocaleString('en-US');
  document.getElementById('funKpis').innerHTML=[
    {l:'Free to families',v:(freeN+paidN?Math.round(freeN/(freeN+paidN)*100):0)+'%',s:`${fmt(freeN)} of ${fmt(freeN+paidN)} participant registrations`,c:'--c3'},
    {l:'Ticket revenue',v:money(revN),s:'Mostly Signature Events',c:'--c2'},
    {l:'Came back for 2+ events',v:fmt(multi),s:'Registration contacts in the same year',c:'--c1'},
    {l:'Engaged both years',v:S.year==='all'?fmt(F.bothYears):'—',s:'Contacts registered in 2024 and 2025',c:'--c4'}]
    .map(k=>`<div class="kpi" style="--kc:var(${k.c})"><div class="kpi-l">${k.l}</div><div class="kpi-v">${k.v}</div><div class="kpi-s">${k.s}</div></div>`).join('');
  upsert('funFree',{type:'bar',data:{labels:sf,datasets:[{label:'Free',data:FAMS.map(f=>fy.reduce((s,y)=>s+fsum(F.free,y,f),0)),backgroundColor:css('--c3'),borderRadius:4},{label:'Paid',data:FAMS.map(f=>fy.reduce((s,y)=>s+fsum(F.paid,y,f),0)),backgroundColor:css('--c2'),borderRadius:4}]},options:baseOpts({plugins:{...baseOpts().plugins,legend:legendTop()},scales:{x:{...baseOpts().scales.x,stacked:true},y:{...baseOpts().scales.y,stacked:true}}})});
  upsert('funRev',bars(sf,fy.map(y=>({label:String(y),data:FAMS.map(f=>Math.round(fsum(F.rev,y,f)))})),{plugins:{...baseOpts().plugins,legend:fy.length>1?legendTop():{display:false},tooltip:{...baseOpts().plugins.tooltip,callbacks:{label:c=>' '+money(c.parsed.y)}}}}));
  upsert('funDepth',bars(['1 event','2 events','3 events','4+ events'],fy.map(y=>({label:String(y),data:['1','2','3','4+'].map(k=>F.freq[y][k])}))));
  upsert('funShare',bars(fy.map(String),[{data:fy.map(y=>{const fr=fsum(F.free,y),pd=fsum(F.paid,y);return Math.round(fr/(fr+pd)*100)}),backgroundColor:fy.map((y,i)=>css(YC[i%4]))}],{scales:{...baseOpts().scales,y:{...baseOpts().scales.y,max:100,ticks:{...baseOpts().scales.y.ticks,callback:v=>v+'%'}}}}));
}

/* ---------- events table ---------- */
let sortKey='n',sortDir=-1;
function eventRollup(){
  const m=new Map();
  D.events.forEach(e=>{const k=e.year+'|'+e.name;const o=m.get(k)||{year:e.year,name:e.name,n:0};o.n+=e.n;m.set(k,o)});
  const reg=new Map();
  D.cube.forEach(r=>{if(['WA','OR','TX','CA'].includes(r.region)){const k=r.year+'|'+r.name;const o=reg.get(k)||{};o[r.region]=(o[r.region]||0)+r.n;reg.set(k,o)}});
  return [...m.values()].map(e=>{const o=reg.get(e.year+'|'+e.name)||{};const top=Object.entries(o).sort((a,b)=>b[1]-a[1])[0];return {...e,family:famOf(e.name),topRegion:top?top[0]:'—',vol:/volunteer/i.test(e.name)}});
}
function renderTable(){
  const q=(document.getElementById('eventSearch').value||'').toLowerCase();
  let ev=eventRollup().filter(e=>yrOK(e)&&(S.family==='all'||e.family===S.family)&&(S.role==='all'||(S.role==='Volunteer')===e.vol)&&e.name.toLowerCase().includes(q));
  ev.sort((a,b)=>(a[sortKey]>b[sortKey]?1:a[sortKey]<b[sortKey]?-1:0)*sortDir);
  const max=Math.max(1,...ev.map(e=>e.n));
  document.getElementById('eventSub').textContent=`${ev.length} events · ${fmt(ev.reduce((a,e)=>a+e.n,0))} registrations`;
  document.querySelector('#eventTable tbody').innerHTML=ev.map(e=>`<tr><td>${esc(e.name)}</td><td class="num">${esc(e.year)}</td><td><span class="fam-dot" style="background:${famColor(e.family)}"></span>${esc(e.family)}</td><td>${esc(REGION_NAMES[e.topRegion]||e.topRegion)}</td><td class="num"><div class="barcell"><span class="b" style="width:${Math.round(e.n/max*80)}px"></span>${supp(e.n)}</div></td></tr>`).join('');
}
document.querySelectorAll('#eventTable th').forEach(th=>th.addEventListener('click',()=>{
  const k=th.dataset.sort;if(sortKey===k)sortDir*=-1;else{sortKey=k;sortDir=k==='n'||k==='year'?-1:1}
  document.querySelectorAll('#eventTable th').forEach(t=>t.classList.remove('sorted-asc','sorted-desc'));th.classList.add(sortDir<0?'sorted-desc':'sorted-asc');renderTable()}));
document.getElementById('eventSearch').addEventListener('input',renderTable);

/* ---------- groupings editor ---------- */
function renderMap(){
  const q=(document.getElementById('mapSearch').value||'').toLowerCase();
  const m=new Map();
  D.events.forEach(e=>{const o=m.get(e.name)||{name:e.name,years:new Set(),n:0};o.years.add(e.year);o.n+=e.n;m.set(e.name,o)});
  const list=[...m.values()].filter(e=>e.name.toLowerCase().includes(q)).sort((a,b)=>b.n-a.n);
  document.querySelector('#mapTable tbody').innerHTML=list.map(e=>`<tr><td>${esc(e.name)}${overrides[e.name]?' <span class="entered">· edited</span>':''}</td><td>${[...e.years].sort().join(', ')}</td><td class="num">${supp(e.n)}</td><td><select data-ev="${esc(e.name)}">${FAMS.map(f=>`<option ${famOf(e.name)===f?'selected':''}>${f}</option>`).join('')}</select></td></tr>`).join('');
}
document.getElementById('mapSearch').addEventListener('input',renderMap);
document.getElementById('mapTable').addEventListener('change',e=>{
  const s=e.target.closest('select');if(!s)return;const n=s.dataset.ev;
  if(s.value===classify(n))delete overrides[n];else overrides[n]=s.value;
  save(LS.over,overrides);status(`"${n}" moved to ${s.value}.`);render();
});

/* ---------- outcomes form ---------- */
function renderOutcomeForm(){
  document.getElementById('outcomeForm').innerHTML=STAGES.map(s=>{const o=outcomes[s.k]||{};return `<div class="orow"><label>${s.label}<small>${s.hint}</small></label><input type="number" min="0" inputmode="numeric" placeholder="Number" data-k="${s.k}" data-f="value" value="${esc(o.value??'')}"><input type="text" placeholder="Source or note (optional)" data-k="${s.k}" data-f="note" value="${esc(o.note??'')}"></div>`}).join('');
}
document.getElementById('outcomeForm').addEventListener('input',e=>{
  const i=e.target;if(!i.dataset.k)return;const o=outcomes[i.dataset.k]||{};o[i.dataset.f]=i.value;
  if((o.value??'')===''&&(o.note??'')==='')delete outcomes[i.dataset.k];else outcomes[i.dataset.k]=o;
  save(LS.out,outcomes);render();
});

/* ---------- CSV import ---------- */
const clean=v=>{const t=document.createElement('textarea');t.innerHTML=String(v??'');return t.value.trim()};
function band(a){const x=parseInt(a,10);if(isNaN(x))return 'Not provided';return x<11?'Under 11':x<=13?'11–13':x<=15?'14–15':x<=18?'16–18':x<=24?'19–24':'25+'}
function referralLabel(v){
  const s=String(v??'').trim().toLowerCase();
  if(!s||s==='not answered')return 'Not answered';
  if(/social|facebook|instagram|(^|[^a-z])fb([^a-z]|$)/.test(s))return 'Social Media';
  if(/friend|family|sister|parent|mom|son/.test(s))return 'Family / Friend';
  if(/staff|urban teen/.test(s))return 'iUrban Staff';
  if(/community|school|counsel|social worker|mentor|organization/.test(s))return 'Community / School Event';
  return 'Other';
}
function detectPeriod(fname,rows,h){
  const m=fname.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[^0-9]*(\d{4})/i);
  if(m)return {month:MONTHS.findIndex(x=>x.toLowerCase()===m[1].toLowerCase().slice(0,3))+1,year:+m[2],how:'file name'};
  const oi=h.indexOf('Order Date');const c={};
  if(oi>=0)rows.forEach(r=>{const d=new Date(r[oi]);if(!isNaN(d)){const k=d.getFullYear()+'-'+(d.getMonth()+1);c[k]=(c[k]||0)+1}});
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
  if(top){const [y,mo]=top[0].split('-').map(Number);return {year:y,month:mo,how:'order dates, please confirm'}}
  const d=new Date();return {year:d.getFullYear(),month:d.getMonth()+1,how:'not detected, please set'};
}
function parseFile(file){
  return new Promise(res=>Papa.parse(file,{skipEmptyLines:'greedy',complete:out=>{
    const all=out.data;const h=(all[0]||[]).map(clean);const rows=all.slice(1).filter(r=>r.some(c=>String(c).trim()));
    const col=k=>h.indexOf(k);
    const need=['Event Name','Attendee Status'];const missing=need.filter(k=>col(k)<0);
    const p=detectPeriod(file.name,rows,h);
    res({file:file.name,h,rows,missing,year:p.year,month:p.month,how:p.how});
  }}));
}
function aggregate(pf){
  const {h,rows,year,month}=pf;const col=k=>h.indexOf(k);
  const retCols=h.map((x,i)=>/returning/i.test(x)?i:-1).filter(i=>i>=0);
  const hearCols=h.map((x,i)=>/hear about/i.test(x)?i:-1).filter(i=>i>=0);
  const C={cube:{},returning:{},referral:{},age:{},events:{}};
  const add=(t,k,obj)=>{(C[t][k]=C[t][k]||{...obj,n:0}).n++};
  rows.forEach(r=>{
    const g=k=>col(k)>=0?clean(r[col(k)]):'';
    let name=g('Event Name'),id=g('Event ID');
    if(!name||/^\d+$/.test(name)){name=`Unnamed ${MONTHS[month-1]} ${year} event`;id=''}
    const role=/volunteer/i.test(name+' '+g('Ticket Type'))?'Volunteer':'Participant';
    const st=g('Home State');const region=['WA','OR','TX','CA'].includes(st)?st:(st?'Other':'Not provided');
    const b={year,month,name,role};
    add('cube',[name,role,region].join('|'),{...b,region});
    add('events',[name,id].join('|'),{year,month,name,id});
    const rv=new Set(retCols.map(i=>clean(r[i])).filter(Boolean));
    const ans=rv.size===1&&rv.has('Yes')?'Yes':rv.size===1&&rv.has('No')?'No':'Not answered';
    add('returning',[name,role,ans].join('|'),{...b,answer:ans});
    const parts=new Set();
    hearCols.forEach(i=>clean(r[i]).split('|').forEach(p=>parts.add(referralLabel(p))));
    if(!parts.size)parts.add('Not answered');
    parts.forEach(p=>add('referral',[name,role,p].join('|'),{...b,source:p}));
    const ab=band(g('Student Age'));add('age',[name,role,ab].join('|'),{...b,band:ab});
  });
  const o={};for(const t in C)o[t]=Object.values(C[t]);return o;
}
let pending=[];
async function handleFiles(files){
  const list=[...files].filter(f=>/\.csv$/i.test(f.name));
  if(!list.length){status('Please choose CSV files exported from Eventbrite.');return}
  pending=await Promise.all(list.map(parseFile));
  renderPreview();
}
function renderPreview(){
  const el=document.getElementById('importPreview');
  if(!pending.length){el.innerHTML='';return}
  const yrOpts=y=>{const now=new Date().getFullYear();let s='';for(let v=2018;v<=now+1;v++)s+=`<option ${v==y?'selected':''}>${v}</option>`;return s};
  el.innerHTML=`<div class="prev"><div class="prev-row head"><div>File</div><div>Registrations</div><div>Month</div><div>Year</div><div>Status</div></div>`+
    pending.map((p,i)=>{const clash=D.coverage[p.year]&&D.coverage[p.year].has(p.month);const evs=new Set(p.rows.map(r=>clean(r[p.h.indexOf('Event Name')]))).size;
      return `<div class="prev-row"><div><b>${esc(p.file)}</b><div class="sub">${evs} event names · month from ${p.how}</div></div><div>${fmt(p.rows.length)}</div>
      <div><select data-i="${i}" data-f="month">${MONTHS.map((m,mi)=>`<option value="${mi+1}" ${mi+1==p.month?'selected':''}>${m}</option>`).join('')}</select></div>
      <div><select data-i="${i}" data-f="year">${yrOpts(p.year)}</select></div>
      <div>${p.missing.length?`<span class="warn">Missing column: ${p.missing.join(', ')}</span>`:clash?`<span class="warn">Replaces current ${MONTHS[p.month-1]} ${p.year} data</span>`:'<span class="tag measured">Ready</span>'}</div></div>`}).join('')+
    `<div class="prev-actions"><button class="btn ghost" id="cancelImport">Cancel</button><button class="btn accent" id="applyImport">Add ${pending.length} file${pending.length>1?'s':''} to dashboard</button></div></div>`;
  el.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{pending[s.dataset.i][s.dataset.f]=+s.value;renderPreview()}));
  document.getElementById('cancelImport').onclick=()=>{pending=[];renderPreview()};
  document.getElementById('applyImport').onclick=()=>{
    const ok=pending.filter(p=>!p.missing.length);
    ok.forEach(p=>{imports=imports.filter(i=>!(i.year===p.year&&i.month===p.month));imports.push({file:p.file,year:p.year,month:p.month,rows:p.rows.length,data:aggregate(p)})});
    save(LS.imports,imports);
    const n=ok.reduce((a,p)=>a+p.rows.length,0);
    pending=[];renderPreview();refreshAll();status(`Added ${ok.length} file${ok.length!==1?'s':''} · ${fmt(n)} registrations. Every view is updated.`);
  };
}
function renderImported(){
  const el=document.getElementById('importedList');
  el.innerHTML=imports.length?`<div class="chips-list">${imports.sort((a,b)=>a.year-b.year||a.month-b.month).map((i,x)=>`<span class="fchip">${MONTHS[i.month-1]} ${i.year} · ${fmt(i.rows)} rows<button data-x="${i.year}-${i.month}" aria-label="Remove">×</button></span>`).join('')}</div>`:'';
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{imports=imports.filter(i=>i.year+'-'+i.month!==b.dataset.x);save(LS.imports,imports);refreshAll();status('Import removed.')});
}
const drop=document.getElementById('drop');
document.getElementById('fileInput').addEventListener('change',e=>{handleFiles(e.target.files);e.target.value=''});
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));

/* ---------- settings ---------- */
function status(m){const s=document.getElementById('studioStatus');s.textContent=m;clearTimeout(status.t);status.t=setTimeout(()=>s.textContent='',6000)}
document.getElementById('exportBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify({app:'iut-impact',version:1,exported:new Date().toISOString(),imports,overrides,outcomes})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='iurban-teen-dashboard-settings.json';a.click();status('Settings file downloaded. It contains totals only, no personal details.');
};
document.getElementById('settingsInput').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const j=JSON.parse(await f.text());if(j.app!=='iut-impact')throw 0;imports=j.imports||[];overrides=j.overrides||{};outcomes=j.outcomes||{};
    save(LS.imports,imports);save(LS.over,overrides);save(LS.out,outcomes);refreshAll();renderOutcomeForm();status('Settings loaded.')}
  catch(_){status('That file is not a dashboard settings file.')}
  e.target.value='';
});
document.getElementById('clearBtn').onclick=()=>{
  if(!confirm('Remove all imports, grouping edits and entered outcomes from this session?'))return;
  imports=[];overrides={};outcomes={};refreshAll();renderOutcomeForm();status('Back to the published data.');
};

/* ---------- filters, tabs, theme ---------- */
function syncControls(){
  document.querySelectorAll('#yearChips .chip').forEach(c=>c.classList.toggle('active',c.dataset.year===S.year));
  document.querySelectorAll('#roleChips .chip').forEach(c=>c.classList.toggle('active',c.dataset.role===S.role));
  document.getElementById('regionSel').value=S.region;famSel.value=S.family;
}
function setFilter(k,v){S[k]=v;syncControls();render()}
document.querySelectorAll('#roleChips .chip').forEach(c=>c.addEventListener('click',()=>setFilter('role',c.dataset.role)));
document.getElementById('regionSel').addEventListener('change',e=>setFilter('region',e.target.value));
famSel.addEventListener('change',e=>setFilter('family',e.target.value));
document.getElementById('resetBtn').addEventListener('click',()=>{Object.assign(S,{year:'all',region:'all',family:'all',role:'all'});syncControls();render()});
function go(v){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===v));
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));
  document.querySelector('.filters').style.display=v==='studio'||v==='about'?'none':'';
  window.scrollTo({top:0,behavior:'smooth'});Object.values(charts).forEach(c=>c.resize());
  history.replaceState(null,'','#'+v);
}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>go(t.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.goto)));
document.getElementById('themeBtn').addEventListener('click',()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark';Object.keys(charts).forEach(k=>{charts[k].destroy();delete charts[k]});render()});

function refreshAll(){merge();rebuildYearChips();renderImported();render()}
refreshAll();renderOutcomeForm();
const h=location.hash.slice(1);if(h&&document.getElementById('view-'+h))go(h);
})();
