/* Ticket Desk — Cascade Civil Project Engineering. Trucking ticket intake, review and approval. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const M = s => { if (s === null || s === undefined || s === '') return null; const n = Number(String(s).replace(/,/g, '')); return Number.isFinite(n) ? Math.round(n * 1000) : null; };
const LB = m => m == null ? '—' : Math.round(m / 1000).toLocaleString('en-US');
const F = (m, dp = 2) => m == null ? '—' : (m / 1000).toFixed(dp);
const nowISO = () => new Date().toISOString();
const fmtDT = iso => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }); };
const fmtD = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); return new Date(Date.UTC(+y, +m - 1, +d, 12)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
const daysSince = iso => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
let ME = 'Jordan';

/* ---------- reference data ---------- */
const PW = 850, PH = 1100;
const PROJECTS = {
  'TC-2507': { id: 'TC-2507', name: 'Riverside Park', jobNo: '2507', aliases: ['2507', 'TC2507', 'TC 2507', '#2507', 'Riverside Park', 'Riverside', 'Riverside P.'] }
};
const VENDORS = {
  'V-MORGAN': { id: 'V-MORGAN', name: 'Kai Morgan Trucking LLC', short: 'Kai Morgan', aliases: ['Morgan', 'Kai Morgan', 'K Morgan Trucking'] },
  'V-BIRCH': { id: 'V-BIRCH', name: 'Birch Trucking Inc.', short: 'Birch', aliases: ['Birch'] },
  'V-RIDGE': { id: 'V-RIDGE', name: 'Ridgeline Hauling Trucking LLC', short: 'Ridgeline Hauling', aliases: ['Ridgeline', 'Ridgeline Bros'] },
  'V-FOOTHILL': { id: 'V-FOOTHILL', name: 'Foothill Trucking', short: 'Foothill', aliases: ['Foothill', 'Foothill Inc.'] },
  'V-HARBOR': { id: 'V-HARBOR', name: 'Harbor Trucking', short: 'Harbor', aliases: ['Harbor', 'Pat Harbor'] },
  'V-FASTLANE': { id: 'V-FASTLANE', name: 'Fast Lane Trucking LLC', short: 'Fast Lane', aliases: ['Fast Lane', 'FL Trucking'] },
  'V-CASCADE CIVIL': { id: 'V-CASCADE CIVIL', name: 'Regional Heavy-Civil Contractor (own trucks)', short: 'Cascade Civil', aliases: ['Cascade Civil', 'CCC'] }
};
let CODES = {
  'TC-2507': [['8000017', 'Description needed (written on Harbor 7632)']]
};
const MATERIALS = ['CSBC', '1-1/4" minus CSBC', 'Gravel borrow', 'Type 17', 'Type 22', '3/4" washed rock', 'Dirt', 'Rock', 'Other (keep raw)'];
const MAT_ALIAS = { 'CSBC': 'CSBC', '1-1/4 min CSBC': '1-1/4" minus CSBC', '1 1/4': '1-1/4" minus CSBC', 'Gravel Borrow': 'Gravel borrow', 'Type 17': 'Type 17', 'TYPE 22': 'Type 22', '3/4 Washed Rock Borrow': '3/4" washed rock', 'Dirt': 'Dirt', 'Rock': 'Rock' };
const SOURCES = ['Cedar Ridge Mine', 'Kenmore Cal Portland', 'Onsite'];
const UNITS = { short_ton: 'tons', loads: 'loads', cubic_yard: 'cu yd', hours: 'hours' };
const BASES = { delivered: 'Delivered', hauled: 'Hauled', placed: 'Placed', removed: 'Removed', weighed: 'Weighed', unknown: 'Unknown' };
const PEOPLE = ['Jordan', 'Casey', 'Morgan', 'Alex'];
const ORIGIN = {
  extracted: ['On ticket', 't'], inherited: ['Inherited from batch', 'i'], mapping: ['Matched to reference list', 'i'], profile: ['From vendor layout', 'i'],
  derived: ['Derived by formula', 'g'], manual: ['Entered by reviewer', 'ok'], none: ['Not on ticket', 'g']
};
const LABELS = {
  vendor: 'Vendor / carrier', ticketNumber: 'Ticket No.', project: 'Project', customer: 'Customer (as written)', jobName: 'Job name (as written)', jobNumber: 'Job number (as written)', jobLocation: 'Job location (as written)',
  serviceDate: 'Service date', truckNumber: 'Truck #', trailerNumber: 'Trailer #', truckType: 'Truck type', driverName: 'Driver name', rate: 'Rate (as written)', odoStart: 'Mileage / odometer start',
  start: 'Start / first in', end: 'Stop / last out', rollover: 'Ends next day (overnight)', breakHrs: 'Lunch / down time (hrs)', onsiteHours: 'Onsite hours (as written)', totalHours: 'Total hours (as written)',
  gross: 'Gross weight', tare: 'Tare weight', net: 'Net weight (printed)', foremanNote: 'Foreman / CC note (handwritten)', remarks: 'Remarks (as written)',
  signature: 'Driver signature (observation)', repSig: 'Authorized rep. signature (observation)', injury: 'Job injury box (as marked)'
};
const FIELD_KEYS = Object.keys(LABELS);

/* Each vendor layout: where things sit on the ticket and how quantities are counted. */
const LAYOUTS = {
  'V-MORGAN': { name: 'Kai Morgan Trucking — pink/yellow 3-part invoice', copies: 'Pink and yellow copies seen', qty: 'Loads, written as tally marks or numerals in NO. LOADS. Tons only appear when scale-ticket weights are written in the FROM column.', time: 'Start / Stop / Lunch / Downtime row under the customer block. Usually only Start is filled.', id: 'Printed red No. at top right (4 digits).', where: ['Date, Truck No., Type: top-right block', 'Customer, Job Location, Job #: middle band', 'MATERIAL / FROM / TO / NO. LOADS / HOURS table', 'Remarks line may repeat the load total (e.g. "3 loads")', 'Driver and Auth. Co. Rep. signatures at the bottom'], quirks: ['Loads are often tally marks (/ //) — confirm the count', 'Scale tickets may be listed as "Ticket #127064 – 13.89 Tons" under one material', 'A circled number in the loads column is the day total, not another line', 'Job location written as "Seattle" even though Riverside Park is in Shoreline'] },
  'V-BIRCH': { name: 'Birch Trucking — pink invoice', copies: 'Pink copy seen', qty: 'Loads in No. Loads; truck hours written as "9h" and repeated, circled, in the Hours column.', time: 'Start / Stop row; Start Odo / Stop Odo at the bottom.', id: 'Faint red No. at top right (5 digits).', where: ['Date, Truck No., Truck Type (Solo / Truck Trailer / Transfer / Other), Truck Hours, Driver Hours: top block', 'Customer, Job Location, Job Number', 'Material / From / To / No. Loads / Hours table', 'Start Odo / Stop Odo / Total Miles row', 'Driver and Author. Co. Rep. signatures'], quirks: ['Hours are written across the Truck Hours / Driver Hours boxes', 'Extra handwriting such as "R-11" can sit in the last material row', 'Truck type box often left unmarked'] },
  'V-RIDGE': { name: 'Ridgeline Hauling Trucking — Rental Ticket', copies: 'Pink (customer) copy seen; white office, yellow driver', qty: 'One column "TONS / #LOADS" — tally marks mean loads; a decimal would mean tons.', time: 'START (AM/PM), JOB START, JOB END, END, DOWN TIME.', id: 'Printed No. under "RENTAL TICKET" (4 digits).', where: ['Driver name, Date, Truck No., Truck Type checkboxes (Solo / T&T / Super / SD): top-left box', 'Customer, Job Name, Job Location / Address, Job No.', 'Material / From / To / Tons-#Loads table', 'Driver and Customer signatures'], quirks: ['Same column holds tons or loads — decide from what is written', 'Job number written "TC2507"', 'Handwriting is light; date and address need a close look'] },
  'V-FOOTHILL': { name: 'Foothill Trucking — yellow invoice', copies: 'Yellow copy seen', qty: 'Both a Tons column and a No. Loads column on each run line.', time: 'Start (AM/PM circled), Stop, Lunch, Downtime.', id: 'Printed No. at top right (5 digits).', where: ['Date, Truck No., Truck Type / Truck Rate / Truck Hours grid: top-right', 'Customer, Job Location, Job Number', 'Time / Material / Tons / From / To / Miscellaneous / No. Loads table', 'Driver and Author. Co. Rep. signatures'], quirks: ['A rate (e.g. 200) can be written in the Solo column — that marks both rate and truck type', 'Driver or owner name can be written inside Truck No.', 'Tons with several loads: confirm if it is the total or per load'] },
  'V-HARBOR': { name: 'Harbor Trucking — yellow invoice', copies: 'Yellow copy seen', qty: 'Loads as tally marks in NO. LOADS.', time: 'Start / Stop / Lunch / Downtime row.', id: 'Printed No. at top right (4 digits).', where: ['Date, Truck No., Type, T&T / Solo / Super Solo / Sweeper / Transfer rate grid: top-right', 'Customer, Job Location, Job #', 'MATERIAL / FROM / TO / NO. LOADS / HOURS table', 'Driver and Auth. Co. Rep. signatures'], quirks: ['Foreman writes the cost code on the line with an arrow (e.g. "Cost code 8000017")', '"6 axle" written in the Solo rate box', 'Job number written "TC 2507"'] },
  'V-FASTLANE': { name: 'Fast Lane Trucking — full-page run log', copies: 'Yellow copy seen', qty: 'One line per run with tons in TOTAL; LOAD COUNT is the running load number (1, 2, 3), not a quantity.', time: 'Arrive / Leave times at both pickup and drop for every run; Start Time, Lunch In/Out, Time Out, Total Hours.', id: 'Faint stamped number at top right (4 digits).', where: ['Job # (with job name), Date, Customer Name, Job Location', 'Truck #, Rate, Driver Name, Truck Type (T&T / Solo / Side Dump / Super Solo)', 'Start Time, Lunch, Time Out, Total Hours, Mileage Start / End', 'MATERIAL / FROM / ARRIVE / LEAVE / TO / ARRIVE / LEAVE / LOAD COUNT / TOTAL table', 'Authorized Rep. signature and TOTAL at the bottom'], quirks: ['Ditto marks ( " ) mean "same as above"', 'A run can be cancelled — e.g. "SOLD OUT OF TYPE 22" with the load crossed out', 'Time Out has no AM/PM'] },
  'V-CASCADE CIVIL': { name: 'Cascade Civil Delivery / Tonnage Ticket', copies: 'Pink copy seen', qty: 'TONS per line; the scale-ticket number may be written above the tons.', time: 'Pre Trip / Post Trip, Leave Yard / Back to Yard, Down Time / Reason, Onsite Hours (first in – last out), Travel Hours, Total Daily Hours.', id: 'Printed red No. at top right (5 digits).', where: ['Date, Truck #, Trailer #, Truck Type (Super Solo / Side Dump / T&T / Solo / Other)', 'Customer, Job Name, Job Number; Any on the job injury? Yes / No', 'MATERIAL / FROM / IN-OUT / HAULED TO / IN-OUT / COST CODE / TONS table', 'Driver and Authorized Rep. signatures'], quirks: ['Onsite Hours and Total Daily Hours can disagree — confirm which is worked time', 'Cost Code column is often blank', 'Scale-ticket number written in the Tons column'] }
};

/* ---------- state ---------- */
let S;
function f(value, raw, origin, ev, extra) { return Object.assign({ value: value ?? null, raw: raw ?? null, origin: origin || (value == null ? 'none' : 'extracted'), ev: ev || null, confidence: null, uncertain: false, note: null }, extra || {}); }
function blankFields() { const o = {}; FIELD_KEYS.forEach(k => o[k] = f(null)); o.rollover = f(false, null, 'none'); return o; }
function seed() {
  S = {
    tickets: {}, order: [], receipts: [], docs: {}, pages: {}, invoices: [], tasks: [], audit: [], deliveries: {}, ledger: [], intakeLog: [], codes: CODES,
    settings: {},
    profile: {
      project: { capture: false, approve: true, daily: true, invoice: true }, vendor: { capture: false, approve: true, daily: true, invoice: true },
      ticketNumber: { capture: false, approve: true, daily: true, invoice: true }, serviceDate: { capture: false, approve: true, daily: true, invoice: true },
      truckNumber: { capture: false, approve: false, daily: false, invoice: false }, quantity: { capture: false, approve: true, daily: true, invoice: true },
      unit: { capture: false, approve: true, daily: true, invoice: true }, basis: { capture: false, approve: true, daily: true, invoice: false },
      costCode: { capture: false, approve: false, daily: true, invoice: false }
    },
    ui: { scope: 'all', inbox: { tile: null, tab: 'tickets', oldest: false, q: '' }, reg: { q: '', status: 'all', unit: 'all', basis: 'all', sFrom: '', sTo: '', rFrom: '', rTo: '' }, out: { project: 'TC-2507', date: '' }, exc: { type: 'all', owner: 'all' }, settingsTab: 'int', helpTab: 'layouts' },
    done: {}, nextT: 1009, nextR: 1002
  };
  const K = 850 / 1333, K2 = 850 / 943;
  const H0 = (x, y, w, h) => [x * K, y * K, w * K, h * K];            // top half of a page (two tickets per page)
  const H1 = (x, y, w, h) => [x * K, y * K + 550, w * K, h * K];      // bottom half
  const FP = (x, y, w, h) => [x * K2, y * K2, w * K2, h * K2];        // full-page Cascade Civil form
  const RID = 'R-1001', REC_AT = '2026-10-12T16:00:00Z', DOC = 'D-1001';
  const pages = [1, 2, 3, 4, 5].map(n => ({ id: 'PG-1001-' + n, n, kind: 'scan', url: `tickets/example-p${n}.jpg`, w: 850, h: 1100, regions: [] }));
  S.docs[DOC] = { id: DOC, name: 'Example-Trucking-Tickets.pdf', pages: pages.map(p => p.id), receipts: [RID], sha: null };
  pages.forEach(p => S.pages[p.id] = Object.assign({ docId: DOC }, p));
  S.receipts.push({ id: RID, channel: 'upload', mode: 'local', receivedAt: REC_AT, sender: 'Jordan — example ticket set', subject: 'Example trucking tickets, Job 2507 Riverside Park (5 pages, 8 tickets)', messageKey: null, defaults: { project: null, serviceDate: null }, attachments: [{ key: 'ATT-1001-1', name: 'Example-Trucking-Tickets.pdf', bytes: 689388, status: 'saved', docId: DOC }], provenance: [] });
  const P = 'TC-2507';
  const mk = (o) => {
    const t = Object.assign({ version: 1, status: 'needs_review', approved: null, approvedSnap: null, assigned: null, ack: {}, versions: [], lines: [], classification: 'Trucking ticket', receiptId: RID, docId: DOC, receivedAt: REC_AT }, o);
    const fl = blankFields(); Object.assign(fl, o.f || {}); t.f = fl;
    t.lines = (o.lines || []).map((l, i) => Object.assign({ id: t.id + '-L' + (i + 1), material_raw: null, material: 'Other (keep raw)', material_origin: 'mapping', from: '', to: '', loads: null, quantity: null, unit: '', basis: 'unknown', cost_code_raw: null, cost_code: null, allocations: [], times: '', scale: '', ev: null }, l));
    t.versions.push({ v: 1, at: t.receivedAt, by: 'Intake', reason: 'Ticket keyed from the scanned page. Check every value against the source before approving.', changes: [] });
    S.tickets[t.id] = t; S.order.push(t.id);
    t.pages.forEach(pid => { const pg = S.pages[pid]; if (!pg.regions.find(r => r.t === t.id)) pg.regions.push({ t: t.id, y0: t.region[0], h: t.region[1] }); });
    return t;
  };
  const E = (page, box) => ({ page, box });
  const LE = (page, boxes) => ({ page, boxes });
  const proj = (raw, ev) => f(P, raw, 'mapping', ev);
  const ven = (id, raw, ev) => f(id, raw, 'mapping', ev);

  /* Page 1 top — Kai Morgan No. 5908 */
  let pg = 'PG-1001-1', B = H0;
  mk({ id: 'TD-1001', pages: [pg], region: [0, 550], vendorLayout: 'V-MORGAN', copy: 'Pink',
    f: { vendor: ven('V-MORGAN', 'KAI MORGAN TRUCKING LLC', E(pg, B(120, 55, 440, 170))), ticketNumber: f('5908', '5908', 'extracted', E(pg, B(1020, 35, 220, 55))),
      project: proj('Riverside Park · Job # 2507', E(pg, B(880, 340, 420, 36))), customer: f('Cascade Civil', 'Cascade Civil', 'extracted', E(pg, B(15, 300, 640, 40))), jobLocation: f('Riverside Park, Seattle', 'Riverside Park   Seattle', 'extracted', E(pg, B(15, 338, 860, 38))), jobNumber: f('2507', '2507', 'extracted', E(pg, B(880, 340, 420, 36))),
      serviceDate: f('2026-08-05', '8/5/26', 'extracted', E(pg, B(660, 50, 310, 45))), truckNumber: f('2', '2', 'extracted', E(pg, B(660, 92, 240, 38))), truckType: f('Solo', 'So… (partly written)', 'extracted', E(pg, B(900, 92, 78, 38)), { uncertain: true, note: 'Type box is only partly written. Reads like "Solo".' }),
      start: f('05:00', '5:00', 'extracted', E(pg, B(15, 376, 160, 36)), { note: 'AM/PM not marked.' }), remarks: f('3 loads', '3 loads', 'extracted', E(pg, B(1000, 705, 300, 45)), { note: 'Matches 1 Dirt + 2 Rock below.' }),
      signature: f('Present', 'signature seen', 'extracted', E(pg, B(15, 745, 640, 42))), repSig: f('Present', 'signature seen', 'extracted', E(pg, B(657, 745, 645, 42))) },
    lines: [
      { material_raw: 'Dirt', material: 'Dirt', from: 'Onsite', to: 'Onsite', loads: '1', loads_uncertain: true, loads_note: 'One tally mark ( / ).', quantity: '1', unit: 'loads', basis: 'hauled', basis_origin: 'profile', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: B(15, 448, 130, 36), from: B(147, 448, 510, 36), to: B(657, 448, 445, 36), loads: B(1103, 448, 118, 36), quantity: B(1103, 448, 118, 36) }) },
      { material_raw: 'Rock', material: 'Rock', from: 'Onsite', to: 'Onsite', loads: '2', loads_uncertain: true, loads_note: 'Two tally marks ( // ).', quantity: '2', unit: 'loads', basis: 'hauled', basis_origin: 'profile', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: B(15, 548, 130, 38), from: B(147, 548, 510, 38), to: B(657, 548, 445, 38), loads: B(1103, 548, 118, 38), quantity: B(1103, 548, 118, 38) }) }
    ] });

  /* Page 1 bottom — Birch No. 84345 */
  B = H1;
  mk({ id: 'TD-1002', pages: [pg], region: [550, 550], vendorLayout: 'V-BIRCH', copy: 'Pink',
    f: { vendor: ven('V-BIRCH', 'BIRCH TRUCKING INC.', E(pg, B(150, 40, 420, 170))), ticketNumber: f('84345', '84345', 'extracted', E(pg, B(1055, 15, 250, 55))),
      project: proj('Riverside Park · Job Number 2507', E(pg, B(905, 258, 400, 42))), customer: f('Cascade Civil', 'cascade-civil', 'extracted', E(pg, B(15, 222, 650, 38))), jobLocation: f('Riverside Park, Shoreline', 'Riverside Park   shoreline', 'extracted', E(pg, B(15, 258, 880, 42))), jobNumber: f('2507', '2507', 'extracted', E(pg, B(905, 258, 400, 42))),
      serviceDate: f('2026-07-22', '7-22-26', 'extracted', E(pg, B(685, 22, 360, 42))), truckNumber: f('6055', '60 55.', 'extracted', E(pg, B(685, 66, 360, 34)), { uncertain: true, note: 'Light handwriting; reads like 6055.' }),
      start: f('04:00', '4aM', 'extracted', E(pg, B(15, 298, 175, 38))), end: f('13:00', '1PM', 'extracted', E(pg, B(190, 298, 165, 38))), totalHours: f('9', '9h (Truck / Driver Hours; repeated circled in Hours column)', 'extracted', E(pg, B(685, 155, 370, 62))),
      odoStart: f('174090', '174090', 'extracted', E(pg, B(658, 655, 210, 45))), driverName: f('Billy Parker', 'Billy Parker (driver signature line)', 'extracted', E(pg, B(15, 738, 650, 42))),
      foremanNote: f('R-11', 'R-11 (written in the last material row)', 'extracted', E(pg, B(15, 620, 212, 36)), { note: 'Meaning not confirmed — cost code, area or note? Ask Jordan.' }),
      signature: f('Present', 'name written', 'extracted', E(pg, B(15, 738, 650, 42))), repSig: f('Present', 'initials seen', 'extracted', E(pg, B(670, 738, 640, 42))) },
    lines: [
      { material_raw: '1-1/4 min CSBC', material: '1-1/4" minus CSBC', from: 'Cedar Ridge Mine', to: 'Riverside Park', loads: '2', quantity: '2', unit: 'loads', basis: 'delivered', basis_origin: 'profile', cost_code_raw: '(none on line — see "R-11")', ev: LE(pg, { material: B(15, 352, 212, 42), from: B(228, 352, 440, 42), to: B(668, 352, 432, 42), loads: B(1100, 352, 142, 42), quantity: B(1100, 352, 142, 42) }) }
    ] });

  /* Page 2 top — Ridgeline Hauling Rental Ticket No. 5890 */
  pg = 'PG-1001-2'; B = H0;
  mk({ id: 'TD-1003', pages: [pg], region: [0, 550], vendorLayout: 'V-RIDGE', copy: 'Pink (customer)',
    f: { vendor: ven('V-RIDGE', 'RIDGELINE HAULING TRUCKING LLC', E(pg, B(615, 35, 280, 125))), ticketNumber: f('5890', '5890', 'extracted', E(pg, B(995, 85, 250, 95))),
      project: proj('Riverside Park · Job No. TC2507', E(pg, B(995, 282, 278, 40))), customer: f('Cascade Civil', 'Cascade Civil', 'extracted', E(pg, B(20, 242, 628, 42))), jobName: f('Riverside Park', 'Riverside Park', 'extracted', E(pg, B(648, 242, 625, 42))), jobNumber: f('TC2507', 'TC2507', 'extracted', E(pg, B(995, 282, 278, 40))),
      jobLocation: f(null, '1? ?56 25th Ave NE, Shoreline (street number not legible)', 'extracted', E(pg, B(20, 282, 975, 40)), { note: 'Street number is not legible. Riverside Park is in Shoreline.' }),
      serviceDate: f('2026-04-16', '4/1?/26', 'extracted', E(pg, B(20, 90, 255, 40)), { uncertain: true, note: 'Second digit of the day is unclear. Reads like 4/16/26.' }), truckNumber: f('004', '004', 'extracted', E(pg, B(275, 90, 250, 40))), truckType: f('Super', 'SUPER (box checked)', 'extracted', E(pg, B(20, 126, 505, 42))),
      driverName: f('Craig Fifer', 'Craig Fifer (light)', 'extracted', E(pg, B(20, 48, 505, 42)), { note: 'Light handwriting — confirm spelling.' }),
      start: f('04:15', '4:15 (AM/PM not circled)', 'extracted', E(pg, B(20, 320, 160, 40))), remarks: f('Job start 5:3_', 'JOB START: 5:3_ (last digit unclear)', 'extracted', E(pg, B(180, 320, 170, 40))),
      signature: f('Present', 'signature seen', 'extracted', E(pg, B(20, 728, 690, 48))), repSig: f('Present', 'customer signature seen', 'extracted', E(pg, B(710, 728, 563, 48))) },
    lines: [
      { material_raw: 'Gravel Borrow', material: 'Gravel borrow', from: 'Cedar Ridge Mine', to: 'TC2507 (job)', loads: '4', loads_uncertain: true, loads_note: 'Four tally marks in the TONS / #LOADS column.', quantity: '4', unit: 'loads', basis: 'delivered', basis_origin: 'profile', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: B(20, 416, 218, 42), from: B(238, 416, 450, 42), to: B(688, 416, 455, 42), loads: B(1143, 416, 130, 42), quantity: B(1143, 416, 130, 42) }) }
    ] });

  /* Page 2 bottom — Harbor No. 7632 */
  B = H1;
  mk({ id: 'TD-1004', pages: [pg], region: [550, 550], vendorLayout: 'V-HARBOR', copy: 'Yellow',
    f: { vendor: ven('V-HARBOR', 'HARBOR TRUCKING', E(pg, B(10, 30, 300, 260))), ticketNumber: f('7632', '7632', 'extracted', E(pg, B(985, 30, 300, 55))),
      project: proj('Job # TC 2507', E(pg, B(875, 362, 425, 40))), customer: f('Cascade Civil', 'Cascade Civil', 'extracted', E(pg, B(10, 328, 640, 40))), jobNumber: f('TC 2507', 'TC 2507', 'extracted', E(pg, B(875, 362, 425, 40))),
      serviceDate: f('2026-04-21', '4-21-26', 'extracted', E(pg, B(600, 42, 380, 40))), truckNumber: f('47', '47', 'extracted', E(pg, B(600, 78, 380, 36))), truckType: f('Solo', 'Solo "6 axle" written in the Solo rate box', 'extracted', E(pg, B(600, 148, 165, 38)), { note: '"6 axle" written next to Solo — confirm the truck type.' }),
      start: f('07:15', '7:15', 'extracted', E(pg, B(10, 400, 160, 40))), foremanNote: f('Cost code 8000017', '↑ Cost code 8000017 (arrow to line 1)', 'extracted', E(pg, B(615, 498, 480, 48))),
      signature: f('Present', 'mark seen (corner torn)', 'extracted', E(pg, B(10, 738, 640, 42)), { note: 'Bottom-left corner of the ticket is torn.' }), repSig: f('Present', 'signature seen', 'extracted', E(pg, B(655, 738, 645, 42))) },
    lines: [
      { material_raw: 'Type 17', material: 'Type 17', from: 'Cedar Ridge Mine', to: 'Riverside Park', loads: '3', loads_uncertain: true, loads_note: 'Three tally marks ( ||| ).', quantity: '3', unit: 'loads', basis: 'delivered', basis_origin: 'profile', cost_code_raw: '8000017 (foreman note with arrow)', ev: LE(pg, { material: B(10, 476, 130, 36), from: B(142, 476, 512, 36), to: B(654, 476, 445, 36), loads: B(1100, 476, 115, 36), quantity: B(1100, 476, 115, 36), code: B(615, 498, 480, 48) }) }
    ] });

  /* Page 3 top — Foothill No. 19957 */
  pg = 'PG-1001-3'; B = H0;
  mk({ id: 'TD-1005', pages: [pg], region: [0, 550], vendorLayout: 'V-FOOTHILL', copy: 'Yellow',
    f: { vendor: ven('V-FOOTHILL', 'FOOTHILL TRUCKING', E(pg, B(55, 50, 560, 190))), ticketNumber: f('19957', '19957', 'extracted', E(pg, B(1060, 28, 270, 62))),
      project: proj('Riverside Park · Job Number 2507', E(pg, B(915, 272, 385, 38))), customer: f('Cascade Civil', 'Cascade Civil', 'extracted', E(pg, B(15, 243, 660, 32))), jobLocation: f('Riverside Park', 'Riverside Park', 'extracted', E(pg, B(15, 276, 900, 34))), jobNumber: f('2507', '2507', 'extracted', E(pg, B(915, 272, 385, 38))),
      serviceDate: f('2026-04-20', '4-20-26', 'extracted', E(pg, B(680, 52, 370, 38))), truckNumber: f('15', 'Colson 15', 'extracted', E(pg, B(680, 84, 370, 36)), { uncertain: true, note: '"Colson" written before 15 — driver, owner or part of the truck ID?' }),
      truckType: f('Solo', 'rate written in the Solo column', 'derived', E(pg, B(800, 118, 75, 66))), rate: f('200', '200 (Truck Rate row, Solo column)', 'extracted', E(pg, B(800, 150, 75, 34)), { note: 'Rate basis not stated (per hour or per load?).' }),
      start: f('04:30', '4:30 AM (AM circled)', 'extracted', E(pg, B(15, 310, 175, 38))), breakHrs: f('0', 'Lunch: 0 (circled)', 'extracted', E(pg, B(355, 310, 165, 38))),
      signature: f('Present', 'signature seen', 'extracted', E(pg, B(15, 780, 640, 50))), repSig: f('Present', 'signature seen', 'extracted', E(pg, B(660, 770, 640, 60))) },
    lines: [
      { material_raw: 'Gravel Borrow', material: 'Gravel borrow', from: 'Mt Loop mine', to: '2507 (job)', loads: '4', quantity: '25', unit: 'short_ton', basis: 'delivered', basis_origin: 'profile', qty_uncertain: true, qty_note: '25 in the Tons column with 4 in No. Loads — total tons or tons per load?', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: B(108, 383, 95, 48), quantity: B(203, 383, 90, 48), from: B(293, 383, 280, 48), to: B(573, 383, 278, 48), loads: B(1128, 383, 95, 48) }) }
    ] });

  /* Page 3 bottom — Kai Morgan No. 6107 */
  B = H1;
  const scale6107 = [['127064', '13.89', 503], ['127104', '13.76', 538], ['127141', '13.65', 572]];
  mk({ id: 'TD-1006', pages: [pg], region: [550, 550], vendorLayout: 'V-MORGAN', copy: 'Yellow',
    f: { vendor: ven('V-MORGAN', 'KAI MORGAN TRUCKING LLC', E(pg, B(120, 70, 430, 200))), ticketNumber: f('6107', '6107', 'extracted', E(pg, B(1020, 55, 250, 55))),
      project: proj('Seattle – Riverside Park · Job # 2507', E(pg, B(880, 358, 420, 40))), customer: f('Cascade Civil', 'Cascade Civil', 'extracted', E(pg, B(15, 323, 640, 42))), jobLocation: f('Seattle – Riverside Park', 'Seattle - Riverside Park', 'extracted', E(pg, B(15, 360, 860, 40))), jobNumber: f('2507', '2507', 'extracted', E(pg, B(880, 358, 420, 40))),
      serviceDate: f('2026-05-19', '5/19/26', 'extracted', E(pg, B(660, 72, 315, 42))), truckNumber: f('1', '#1', 'extracted', E(pg, B(660, 108, 230, 38))), truckType: f('Solo', 'Solo', 'extracted', E(pg, B(880, 108, 95, 38))),
      start: f('03:30', '3:30 a.m.', 'extracted', E(pg, B(15, 398, 160, 40))), remarks: f('5 loads total (circled)', '(5) circled in NO. LOADS', 'extracted', E(pg, B(1100, 688, 120, 52)), { note: 'Circled 5 = 3 washed rock + 2 dirt. It is a total, not another line.' }),
      signature: f('Present', 'signature seen', 'extracted', E(pg, B(15, 768, 640, 48))), repSig: f('Present', 'signature seen', 'extracted', E(pg, B(657, 768, 645, 48))) },
    lines: [
      ...scale6107.map(([tk, tons, y], i) => ({ material_raw: '3/4 Washed Rock Borrow', material: '3/4" washed rock', from: 'Cedar Ridge Mine', to: '#2507 (job)', loads: '1', quantity: tons, unit: 'short_ton', basis: 'weighed', basis_origin: 'profile', scale: tk, loads_note: i === 0 ? 'NO. LOADS shows 3 for the three scale tickets.' : '', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: B(15, 468, 130, 140), from: B(147, y - 2, 510, 36), scale: B(147, y - 2, 510, 36), quantity: B(147, y - 2, 510, 36), to: B(657, 468, 445, 38), loads: B(1103, 468, 118, 38) }) })),
      { material_raw: 'Dirt', material: 'Dirt', from: 'Onsite', to: 'Onsite', loads: '2', quantity: '2', unit: 'loads', basis: 'hauled', basis_origin: 'profile', loads_note: '2 in NO. LOADS, two tally marks under TO.', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: B(15, 640, 130, 38), from: B(147, 640, 510, 38), to: B(657, 640, 445, 70), loads: B(1103, 640, 118, 38), quantity: B(1103, 640, 118, 38) }) }
    ] });

  /* Page 4 — Fast Lane (full-page run log) */
  pg = 'PG-1001-4';
  const T0 = (x, y, w, h) => [x * K, y * K, w * K, h * K], T1 = (x, y, w, h) => [x * K, y * K + 550, w * K, h * K];
  mk({ id: 'TD-1007', pages: [pg], region: [0, 1100], vendorLayout: 'V-FASTLANE', copy: 'Yellow',
    f: { vendor: ven('V-FASTLANE', 'Fast Lane Trucking LLC', E(pg, T0(330, 85, 590, 150))), ticketNumber: f('3068', '3068 (faint stamp)', 'extracted', E(pg, T0(1130, 65, 130, 55)), { uncertain: true, note: 'Number is stamped very faintly at top right.' }),
      project: proj('JOB # 2507 – Riverside Park', E(pg, T0(60, 312, 850, 48))), customer: f('Cascade Civil', 'CASCADE CIVIL', 'extracted', E(pg, T0(60, 360, 1210, 48))), jobName: f('Riverside Park', 'Riverside Park', 'extracted', E(pg, T0(60, 312, 850, 48))), jobNumber: f('2507', '2507', 'extracted', E(pg, T0(60, 312, 850, 48))),
      serviceDate: f('2026-07-15', '7/15/26', 'extracted', E(pg, T0(910, 312, 360, 48))), truckNumber: f('5', '5', 'extracted', E(pg, T0(60, 505, 290, 48))), truckType: f('Super Solo', 'SUPER SOLO (circled)', 'extracted', E(pg, T0(60, 553, 1210, 48))), driverName: f('Summer C.', 'Summer C.', 'extracted', E(pg, T0(630, 505, 640, 48))),
      start: f('06:00', '6:00 AM', 'extracted', E(pg, T0(60, 600, 290, 100))), end: f('15:45', '3:45 (Time Out, no AM/PM)', 'extracted', E(pg, T0(680, 600, 285, 100)), { note: 'Read as 3:45 PM — the last run left the job at 2:00.' }), odoStart: f('212464', '212464', 'extracted', E(pg, T0(60, 703, 350, 50))),
      repSig: f('Present', 'signature seen', 'extracted', E(pg, T1(60, 680, 660, 75))), signature: f(null, 'no driver signature line on this form', 'none') },
    lines: [
      { material_raw: 'CSBC', material: 'CSBC', from: 'Mt Loop', to: 'Riverside P.', times: 'Pickup 6:00–6:08 · Drop 7:50–7:56', loads: '1', loads_note: 'Load #1', quantity: '23.41', unit: 'short_ton', basis: 'delivered', basis_origin: 'profile', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: T0(60, 800, 160, 52), from: T0(222, 800, 375, 52), times: T0(222, 800, 740, 52), to: T0(598, 800, 365, 52), loads: T0(965, 800, 150, 52), quantity: T0(1115, 800, 155, 52) }) },
      { material_raw: '" (CSBC)', material: 'CSBC', from: 'Mt Loop', to: 'Riverside P.', times: 'Pickup 9:00–9:08 · Drop 10:21–10:27', loads: '1', loads_note: 'Load #2 (ditto marks = same material and route)', quantity: '23.13', unit: 'short_ton', basis: 'delivered', basis_origin: 'profile', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: T1(60, -8, 160, 40), from: T1(222, -8, 375, 40), times: T1(222, -8, 740, 40), to: T1(598, -8, 365, 40), loads: T1(965, -8, 150, 40), quantity: T1(1115, -8, 155, 40) }) },
      { material_raw: 'TYPE 22', material: 'Type 22', from: 'Mt Loop', to: 'SOLD OUT OF TYPE 22', times: 'Pickup 11:46–11:56', loads: null, loads_note: 'Load "2" crossed out; Total shows a dash.', quantity: null, unit: 'short_ton', basis: 'unknown', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: T1(60, 32, 160, 48), from: T1(222, 32, 375, 48), times: T1(222, 32, 375, 48), to: T1(598, 32, 365, 48), loads: T1(965, 32, 150, 48), quantity: T1(1115, 32, 155, 48) }) },
      { material_raw: '" (TYPE 22)', material: 'Type 22', from: 'Kenmore Cal Port', to: 'Riverside P.', times: 'Pickup 1:10–1:29 · Drop 1:45–2:00', loads: '1', loads_note: 'Load #3', quantity: '23.83', unit: 'short_ton', basis: 'delivered', basis_origin: 'profile', cost_code_raw: '(none on ticket)', ev: LE(pg, { material: T1(60, 80, 160, 46), from: T1(222, 80, 375, 46), times: T1(222, 80, 740, 46), to: T1(598, 80, 365, 46), loads: T1(965, 80, 150, 46), quantity: T1(1115, 80, 155, 46) }) }
    ] });

  /* Page 5 — Cascade Civil Delivery / Tonnage Ticket No. 37077 */
  pg = 'PG-1001-5'; B = FP;
  mk({ id: 'TD-1008', pages: [pg], region: [0, 1100], vendorLayout: 'V-CASCADE CIVIL', copy: 'Pink',
    f: { vendor: ven('V-CASCADE CIVIL', 'CASCADE CIVIL CONSTRUCTION LLC', E(pg, B(20, 15, 420, 120))), ticketNumber: f('37077', '37077', 'extracted', E(pg, B(460, 20, 460, 36))),
      project: proj('Riverside · Job Number 2507', E(pg, B(18, 314, 442, 38))), customer: f('Cascade Civil', 'Cascade Civil', 'extracted', E(pg, B(18, 240, 442, 38))), jobName: f('Riverside', 'Riverside', 'extracted', E(pg, B(18, 278, 442, 36))), jobNumber: f('2507', '2507', 'extracted', E(pg, B(18, 314, 442, 38))),
      serviceDate: f('2026-06-07', '6-7-26', 'extracted', E(pg, B(462, 56, 180, 42))), truckNumber: f('24', '24', 'extracted', E(pg, B(462, 96, 180, 44))), truckType: f('Super Solo', 'Super Solo (circled)', 'extracted', E(pg, B(462, 185, 180, 112))),
      onsiteHours: f('3 1/4', '3 1/4  (10:45 / 3:00 written beside it)', 'extracted', E(pg, B(642, 220, 280, 48)), { uncertain: true, note: 'Onsite Hours says 3 1/4 but 10:45 and 3:00 are written beside it. Which is worked time?' }),
      totalHours: f('10:45', '10:45', 'extracted', E(pg, B(642, 298, 280, 52)), { uncertain: true, note: 'Written as a clock time, not hours. Does not match 3 1/4 onsite.' }),
      injury: f('No', 'No (circled)', 'extracted', E(pg, B(462, 300, 180, 50))),
      signature: f('Present', 'signature seen', 'extracted', E(pg, B(18, 1083, 450, 42))), repSig: f('Not observed', 'line blank', 'extracted', E(pg, B(478, 1083, 440, 42))) },
    lines: [
      { material_raw: '1 1/4', material: '1-1/4" minus CSBC', from: 'Mnt. Loop', to: 'Riverside', times: 'Mine in/out 12:00–12:10 · Job in/out 1:45–1:50', loads: '1', quantity: '23.64', unit: 'short_ton', basis: 'delivered', basis_origin: 'profile', scale: '127135', cost_code_raw: '(Cost Code column blank)', ev: LE(pg, { material: B(18, 398, 98, 44), from: B(116, 398, 232, 44), times: B(348, 398, 374, 44), to: B(410, 398, 250, 44), code: B(722, 398, 128, 44), quantity: B(850, 398, 72, 44), scale: B(850, 398, 72, 22), loads: B(850, 398, 72, 44) }) }
    ] });

  audit('Intake', 'Example ticket set loaded: 5 pages, 8 tickets from 7 vendor layouts', RID);
}
function snap(t) { return clone({ f: t.f, lines: t.lines, ack: t.ack, assigned: t.assigned }); }
function audit(actor, action, ref) { S.audit.unshift({ at: nowISO(), actor, action, ref: ref || '' }); }
function outKey(...a) { return a.join('|'); }

/* ---------- derived ---------- */
const T = id => S.tickets[id];
const inScope = t => S.ui.scope === 'all' || t.f.project.value === S.ui.scope;
const vName = id => VENDORS[id]?.name || '—';
const pName = id => id ? (PROJECTS[id] ? `${id} · ${PROJECTS[id].name}` : id) : '—';
const codeOK = (p, c) => !!(CODES[p] || []).find(x => x[0] === c);
function lineMeasure(l) { return M(l.quantity); }
function issues(t) {
  const out = [], H = t.f, P = S.profile;
  const miss = (k, pk) => { if (P[pk || k]?.approve && (H[k]?.value == null || H[k].value === '')) out.push({ id: 'REQ-' + k, sev: 'block', field: k, msg: `${LABELS[k]} is missing`, dest: 'Approval, Daily Output' }); };
  miss('project'); miss('vendor'); miss('ticketNumber'); miss('serviceDate'); if (P.truckNumber.approve) miss('truckNumber');
  Object.keys(H).forEach(k => { if (H[k] && H[k].uncertain) out.push({ id: 'UNC-' + k, sev: 'block', field: k, msg: `${LABELS[k]} is uncertain — confirm or correct it against the source`, dest: 'Approval' }); });
  if (!t.lines.length) out.push({ id: 'LINE-0', sev: 'block', field: 'lines', msg: 'No work/material line has been entered', dest: 'Approval' });
  t.lines.forEach((l, i) => {
    const n = `Line ${i + 1}`;
    if (P.quantity.approve && M(l.quantity) == null) out.push({ id: `Q-${i}`, sev: 'block', field: `l${i}.quantity`, msg: `${n}: quantity is missing (blank is not zero)`, dest: 'Approval' });
    if (P.unit.approve && !l.unit) out.push({ id: `U-${i}`, sev: 'block', field: `l${i}.unit`, msg: `${n}: unit is missing`, dest: 'Approval' });
    if (P.basis.approve && (!l.basis || l.basis === 'unknown')) out.push({ id: `B-${i}`, sev: 'block', field: `l${i}.basis`, msg: `${n}: quantity basis is unknown (delivered, hauled, placed…)`, dest: 'Approval, Daily Output' });
    if (l.qty_uncertain) out.push({ id: `TQ-${i}`, sev: 'block', field: `l${i}.quantity`, msg: `${n}: ${l.qty_note || 'quantity needs confirming'}`, dest: 'Approval, Daily Output' });
    if (l.loads_uncertain) out.push({ id: `TL-${i}`, sev: 'block', field: `l${i}.loads`, msg: `${n}: load count was read from tally marks — confirm it`, dest: 'Approval' });
    if (l.allocations.length) {
      const sum = l.allocations.reduce((a, x) => a + (M(x.qty) || 0), 0), q = M(l.quantity);
      if (q == null || Math.abs(sum - q) > 10) out.push({ id: `AL-${i}`, sev: 'block', field: `l${i}.alloc`, msg: `${n}: cost-code allocations total ${F(sum)} of ${F(q)} ${UNITS[l.unit] || ''} — remainder ${F((q || 0) - sum)}`, dest: 'Approval, Daily Output' });
      l.allocations.forEach(a => { if (!codeOK(H.project.value, a.code)) out.push({ id: `ALC-${i}-${a.code}`, sev: 'block', field: `l${i}.alloc`, msg: `${n}: allocation code ${a.code || '(blank)'} is not in this project's code list`, dest: 'Approval' }); });
    } else if (P.costCode.approve && !l.cost_code) {
      out.push({ id: `CC-${i}`, sev: 'block', field: `l${i}.code`, msg: `${n}: cost code unresolved${H.foremanNote.value ? ' — foreman CC note present; use Allocate' : ''}`, dest: 'Approval, Daily Output' });
    } else if (l.cost_code && !codeOK(H.project.value, l.cost_code)) out.push({ id: `CCV-${i}`, sev: 'block', field: `l${i}.code`, msg: `${n}: cost code ${l.cost_code} is not in this project's code list`, dest: 'Approval' });
  });
  const g = M(H.gross.value), ta = M(H.tare.value), ne = M(H.net.value);
  if (g != null && ta != null && ne != null && Math.abs(g - ta - ne) > 0 && !t.ack.weight) out.push({ id: 'WT', sev: 'block', field: 'net', msg: `Printed net ${LB(ne)} lb ≠ gross − tare ${LB(g - ta)} lb (difference ${LB(g - ta - ne)} lb). Source numbers stay unchanged — acknowledge with a reason.`, dest: 'Approval' });
  if (H.start.value && H.end.value && H.end.value < H.start.value && !H.rollover.value) out.push({ id: 'OVN', sev: 'block', field: 'end', msg: 'End time is earlier than start — confirm the overnight rollover (no naive end − start)', dest: 'Approval' });
  const dups = Object.values(S.tickets).filter(o => o.id !== t.id && o.status !== 'rejected' && o.f.vendor.value === H.vendor.value && o.f.ticketNumber.value === H.ticketNumber.value && o.f.serviceDate.value === H.serviceDate.value && H.ticketNumber.value);
  if (dups.length && !t.ack.dup) out.push({ id: 'DUP', sev: 'block', field: 'ticketNumber', msg: `Possible duplicate of ${dups.map(d => d.id).join(', ')} (same vendor, ticket and date)`, dest: 'Approval' });
  return out;
}
function infos(t) {
  const H = t.f, o = [];
  const same = Object.values(S.tickets).filter(x => x.id !== t.id && x.f.ticketNumber.value && x.f.ticketNumber.value === H.ticketNumber.value && x.f.vendor.value !== H.vendor.value);
  if (same.length) o.push(`Ticket No. ${H.ticketNumber.value} also exists for ${same.map(x => vName(x.f.vendor.value)).join(', ')}. Different vendors can reuse numbers — not a duplicate.`);
  if (S.receipts.find(r => r.id === t.receiptId)?.defaults?.serviceDate && H.serviceDate.value && S.receipts.find(r => r.id === t.receiptId).defaults.serviceDate !== H.serviceDate.value) o.push(`Batch default date is ${fmtD(S.receipts.find(r => r.id === t.receiptId).defaults.serviceDate)}, but the ticket says ${fmtD(H.serviceDate.value)}. The ticket value is used.`);
  return o;
}
function reviewState(t) { if (t.status === 'approved' && t.approved && t.approved.version === t.version) return 'approved'; if (t.status === 'rejected') return 'rejected'; return 'needs_review'; }
function stateChip(t) {
  const s = reviewState(t);
  if (s === 'approved') return `<span class="chip ok">✓ Approved <i>v${t.approved.version}</i></span>`;
  if (s === 'rejected') return `<span class="chip e">✕ Rejected</span>`;
  if (t.approved && t.approved.version !== t.version) return `<span class="chip w">● Needs re-approval <i>v${t.version}</i></span>`;
  return `<span class="chip w">● Needs review</span>`;
}
function receiptStatus(r) {
  if (!r.attachments.length) return 'awaiting';
  const st = r.attachments.map(a => a.status);
  if (st.every(s => s === 'saved' || s === 'rejected')) return 'received';
  if (st.some(s => s === 'saved')) return 'partial';
  if (st.some(s => s === 'pending')) return 'receiving';
  return 'failed';
}
const RCHIP = { received: '<span class="chip ok">Received · complete</span>', partial: '<span class="chip w">Partial · attachment missing</span>', awaiting: '<span class="chip i">Awaiting attachments</span>', receiving: '<span class="chip i">Receiving…</span>', failed: '<span class="chip e">Delivery failed</span>' };

function outputRows(project, date) {
  const groups = {}, excluded = [];
  Object.values(S.tickets).forEach(t => {
    const H = t.status === 'approved' && t.approvedSnap ? t.approvedSnap.f : t.f;
    if (H.project.value !== project || H.serviceDate.value !== date) return;
    if (t.status === 'rejected') return;
    if (!(t.approved && t.approved.version === t.version && t.status === 'approved')) {
      if (t.approved && t.approved.version !== t.version) excluded.push({ t, why: `approved v${t.approved.version} was superseded by v${t.version} — excluded until re-approved` });
      else excluded.push({ t, why: 'not approved yet — excluded' });
      return;
    }
    t.approvedSnap.lines.forEach((l, li) => {
      if (S.profile.costCode.daily && !l.allocations.length && !l.cost_code) { excluded.push({ t, why: `line ${li + 1} (${l.material}) has no cost code yet — held back until one is assigned` }); return; }
      if (M(l.quantity) == null) return;
      const parts = l.allocations.length ? l.allocations.map(a => ({ code: a.code, qty: M(a.qty) })) : [{ code: l.cost_code, qty: M(l.quantity) }];
      parts.forEach(p => {
        const key = outKey(project, date, 'Daily Log Quantities', l.material, l.unit, l.basis, p.code);
        groups[key] = groups[key] || { key, material: l.material, unit: l.unit, basis: l.basis, code: p.code, qty: 0, members: [] };
        groups[key].qty += p.qty; groups[key].members.push({ t: t.id, v: t.approved.version, num: t.approvedSnap.f.ticketNumber.value, qty: p.qty, alloc: !!l.allocations.length });
      });
    });
  });
  const rows = Object.values(groups).map(g => { const d = S.deliveries[g.key]; return Object.assign(g, { delivered: d ? (d.status === 'succeeded' ? d.qty : d.prevQty || 0) : 0, d }); });
  // delivered keys with no desired rows still show
  Object.entries(S.deliveries).forEach(([k, d]) => { const [p, dt] = k.split('|'); if (p === project && dt === date && !groups[k]) { const [, , , mat, unit, basis, code] = k.split('|'); rows.push({ key: k, material: mat, unit, basis, code, qty: 0, members: [], delivered: d.qty, d }); } });
  return { rows, excluded };
}
function rowState(r) {
  if (r.d && r.d.status === 'uncertain') return ['uncertain', '<span class="chip e">Uncertain — reconcile before resend</span>'];
  if (r.d && r.d.status === 'failed') return ['failed', '<span class="chip e">Failed — safe to resend</span>'];
  const delta = r.qty - (r.delivered || 0);
  if (!r.d) return ['new', '<span class="chip i">Not entered yet</span>'];
  if (delta === 0) return ['done', '<span class="chip ok">Entered in Procore</span>'];
  if (delta > 0) return ['amend', `<span class="chip w">Add +${F(delta)} in Procore</span>`];
  return ['amend', `<span class="chip w">Correction needed ${F(delta)}</span>`];
}
function exceptionsList() {
  const list = [];
  Object.values(S.tickets).forEach(t => {
    if (reviewState(t) === 'approved' || t.status === 'rejected') return;
    issues(t).forEach(i => list.push({ kind: 'ticket', id: t.id + ':' + i.id, type: i.id.startsWith('UNC') || i.id.startsWith('TL') ? 'Uncertain value' : i.id.startsWith('CC') || i.id.startsWith('AL') ? 'Cost code / allocation' : i.id === 'WT' ? 'Weight inconsistency' : i.id === 'DUP' ? 'Possible duplicate' : i.id === 'OVN' ? 'Overnight time' : 'Missing required field', ref: `${t.id} · No. ${t.f.ticketNumber.value || '—'}`, ticket: t.id, field: i.field, project: t.f.project.value, dest: i.dest, owner: t.assigned, created: t.receivedAt, detail: i.msg, status: 'open' }));
  });
  Object.values(S.tickets).forEach(t => { if (!isApproved(t)) return; const F0 = t.approvedSnap.f; postBlocks(t, effPost(t)).forEach(i => list.push({ kind: 'ticket', id: t.id + ':P-' + i.id, type: 'HCSS / Procore entry detail', ref: `${t.id} · No. ${F0.ticketNumber.value || '—'}`, ticket: t.id, field: 'post', project: F0.project.value, dest: 'Daily Output (HCSS + Procore)', owner: 'Jordan', created: t.approved.at, detail: i.msg, status: 'open' })); });
  S.receipts.forEach(r => r.attachments.forEach(a => { if (a.status === 'failed') list.push({ kind: 'receipt', id: r.id + ':' + a.key, type: 'Attachment not received', ref: `${r.id} · ${a.name}`, receipt: r.id, project: r.defaults?.project, dest: 'Intake', owner: 'Casey', created: r.receivedAt, detail: a.error, status: 'open' }); }));
  Object.entries(S.deliveries).forEach(([k, d]) => {
    const [p, dt, , mat] = k.split('|');
    if (d.status === 'uncertain') list.push({ kind: 'delivery', id: 'DLV:' + k, type: 'Uncertain downstream write', ref: `${dt} · ${mat}`, out: { project: p, date: dt }, project: p, dest: 'Daily Output', owner: 'Jordan', created: d.at, detail: 'Target timed out after a possible write. Reconcile before any resend.', status: 'open' });
    if (d.notification === 'failed') list.push({ kind: 'delivery', id: 'NTF:' + k, type: 'Notification failed', ref: `${dt} · ${mat}`, out: { project: p, date: dt }, project: p, dest: 'Notifications', owner: 'Jordan', created: d.at, detail: 'Delivery succeeded; only the internal notification failed. Retry the notification only.', status: 'open' });
  });
  S.tasks.forEach(tk => list.push(Object.assign({ kind: 'task' }, tk)));
  return list;
}

/* ---------- UI utilities ---------- */
function toast(msg, err) { const el = document.createElement('div'); el.className = 'toast' + (err ? ' e' : ''); el.textContent = msg; $('#toast-root').appendChild(el); $('#announcer').textContent = msg; setTimeout(() => el.remove(), 4200); }
let modalReturn = null;
function modal(title, body, actions, wide) {
  modalReturn = document.activeElement;
  const root = $('#modal-root');
  root.innerHTML = `<div class="ov" role="presentation"><div class="md ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="md-t"><div class="md-h"><h2 id="md-t">${title}</h2><button class="btn q s" style="margin-left:auto" data-x aria-label="Close dialog">✕</button></div><div class="md-b">${body}</div><div class="md-f">${(actions || []).map((a, i) => `<button class="btn ${a.cls || ''}" data-a="${i}" ${a.disabled ? 'disabled' : ''}>${a.label}</button>`).join('')}<button class="btn" data-x>Cancel</button></div></div></div>`;
  const close = () => { root.innerHTML = ''; modalReturn && modalReturn.focus && modalReturn.focus(); };
  $$('[data-x]', root).forEach(b => b.onclick = close);
  $('.ov', root).addEventListener('mousedown', e => { if (e.target.classList.contains('ov')) close(); });
  $$('[data-a]', root).forEach(b => b.onclick = () => { const a = actions[+b.dataset.a]; if (a.fn(root) !== false) close(); });
  root.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: false });
  setTimeout(() => { const first = $('input,select,textarea,[data-a]', root); first && first.focus(); }, 20);
  return root;
}
const ICONS = {
  inbox: '<path d="M3 13h5l1.5 2.5h5L16 13h5M5.5 5h13l2.5 8v6H3v-6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  capture: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  review: '<rect x="3.5" y="4.5" width="8" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M14 7h7M14 11h7M14 15h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  register: '<path d="M4 5h16M4 10h16M4 15h16M4 20h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  output: '<path d="M5 20V10M10 20V5M15 20v-7M20 20V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  exc: '<path d="M12 4l9 15H3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4M12 16.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  inv: '<path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8h6M9 12h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  help: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4M12 16.6v.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>',
  set: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
};
const ic = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

/* ---------- shell ---------- */
function renderShell(route) {
  const nr = Object.values(S.tickets).filter(t => reviewState(t) === 'needs_review' && inScope(t)).length;
  const ex = exceptionsList().filter(e => e.status === 'open' && (S.ui.scope === 'all' || e.project === S.ui.scope)).length;
  const items = [['inbox', 'Inbox', 'inbox', nr], ['capture', 'Capture', 'capture'], ['review', 'Review', 'review'], ['register', 'Register', 'register'], ['output', 'Daily Output', 'output'], ['exceptions', 'Exceptions', 'exc', ex]];
  const sec = [['invoices', 'Invoice Matching', 'inv'], ['help', 'Help', 'help'], ['settings', 'Settings / Health', 'set']];
  const a = ([r, l, i, c]) => `<a class="nav-a" href="#/${r}" ${route === r ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${c ? `<span class="cnt ${r === 'exceptions' ? 'w' : ''}" aria-label="${c} items">${c}</span>` : ''}</a>`;
  $('#nav').innerHTML = `<div class="nav-h">Work</div>${items.map(a).join('')}<div class="nav-h">More</div>${sec.map(a).join('')}`;
  $('#top').innerHTML = `<button class="btn q menu" id="menu" aria-label="Open navigation">☰</button>
    <label class="scope">Project scope <select id="scope"><option value="all">All projects</option>${Object.values(PROJECTS).map(p => `<option value="${p.id}" ${S.ui.scope === p.id ? 'selected' : ''}>${p.id} · ${p.name}</option>`).join('')}</select></label>
    <span class="sp"></span>
    <a class="conn" href="#/settings"><span class="d"></span>Integrations: not connected</a>
    <label class="who"><span class="av">${esc(ME.slice(0, 2).toUpperCase())}</span><span class="tx">Working as<select id="me" aria-label="Who is reviewing">${PEOPLE.map(p => `<option ${p === ME ? 'selected' : ''}>${p}</option>`).join('')}</select></span></label>`;
  $('#scope').onchange = e => { S.ui.scope = e.target.value; render(); };
  $('#me').onchange = e => { ME = e.target.value; audit(ME, 'Now working as ' + ME); render(); };
  $('#menu').onclick = () => $('#side').classList.toggle('open');
  const off = !navigator.onLine;
  $('#banner').innerHTML = off
    ? `<div class="banner off" role="status"><b>Offline.</b> You can keep reviewing in this tab. Changes are saved when the connection returns; keep the tab open.</div>`
    : '';
}

/* ---------- router ---------- */
let R = null; // review working state
let lastHash = location.hash;
function parse() { const h = (location.hash || '#/inbox').slice(2).split('/'); return { route: h[0] || 'inbox', arg: h[1] ? decodeURIComponent(h[1]) : null }; }
window.addEventListener('hashchange', () => {
  if (R && R.dirty && !location.hash.startsWith('#/review/' + R.id)) {
    if (!confirm('You have unsaved edits on ' + R.id + '. Leave without saving?')) { history.replaceState(null, '', lastHash); return; }
    R = null;
  }
  lastHash = location.hash; render();
});
window.addEventListener('online', () => render()); window.addEventListener('offline', () => render());
window.addEventListener('beforeunload', e => { if (R && R.dirty) { e.preventDefault(); e.returnValue = ''; } });
function render() {
  if (S) migrateHcss();
  const { route, arg } = parse();
  renderShell(route);
  $('#side').classList.remove('open');
  const v = VIEWS[route] || VIEWS.inbox;
  $('#main').innerHTML = '';
  v(arg);
  document.title = `${(TITLES[route] || 'Ticket Desk')} · Ticket Desk · Cascade Civil Project Engineering`;
  persist();
}
const TITLES = { inbox: 'Inbox', capture: 'Capture', review: 'Review', register: 'Register', output: 'Daily Output', exceptions: 'Exceptions', invoices: 'Invoice Matching', help: 'Help', settings: 'Settings / Health' };
const VIEWS = {};
const main = () => $('#main');

/* ---------- INBOX ---------- */
VIEWS.inbox = () => {
  const U = S.ui.inbox;
  const tickets = Object.values(S.tickets).filter(inScope);
  const partial = S.receipts.filter(r => ['partial', 'awaiting', 'receiving', 'failed'].includes(receiptStatus(r)) && (S.ui.scope === 'all' || r.defaults?.project === S.ui.scope || !r.defaults?.project));
  const needs = tickets.filter(t => reviewState(t) === 'needs_review');
  const failedAtt = S.receipts.reduce((a, r) => a + r.attachments.filter(x => x.status === 'failed').length, 0) + Object.values(S.deliveries).filter(d => d.status === 'uncertain' || d.status === 'failed').length;
  const ready = readyForOutput().map(T).filter(inScope);
  const tile = (k, v, l, s, cls) => `<button class="tile ${cls}" data-tile="${k}" aria-pressed="${U.tile === k}"><div class="l">${l}</div><div class="v num">${v}</div><div class="s">${s}</div></button>`;
  let rows = tickets;
  if (U.tile === 'review') rows = needs; else if (U.tile === 'ready') rows = ready;
  if (U.q) rows = rows.filter(t => [t.f.ticketNumber.value, t.f.truckNumber.value, vName(t.f.vendor.value), t.id].join(' ').toLowerCase().includes(U.q.toLowerCase()));
  rows = rows.slice().sort((a, b) => U.oldest ? a.receivedAt.localeCompare(b.receivedAt) : b.receivedAt.localeCompare(a.receivedAt));
  const tab = (U.tile === 'partial' || U.tile === 'failed') ? 'receipts' : U.tab;
  main().innerHTML = `
  <div class="ph"><div><h1>Work Inbox</h1><p>Every count comes straight from the tickets below. Click a count to filter the list.</p></div>
    <div class="act"><a class="btn" href="#/capture">${ic('capture')} Capture tickets</a><a class="btn p" href="#/review">${ic('review')} Start reviewing</a></div></div>
  <div class="tiles">${tile('partial', partial.length, 'Partial / awaiting receipts', 'Emails with an attachment still missing', 'w')}${tile('review', needs.length, 'Needs review', 'Tickets waiting for review', 'i')}${tile('failed', failedAtt, 'Failed or uncertain', 'Attachments needing action', 'e')}${tile('ready', ready.length, 'Approved, ready for output', 'Approved, not yet entered in Procore', 'ok')}</div>
  ${U.tile ? `<div class="row" style="margin:-6px 0 12px"><span class="chip t">Filter: ${({ partial: 'Partial receipts', review: 'Needs review', failed: 'Failed or uncertain', ready: 'Ready for output' })[U.tile]}</span><button class="btn q s" id="clr">Clear filter</button></div>` : ''}
  <div class="tabs" role="tablist"><button role="tab" aria-selected="${tab === 'tickets'}" data-tab="tickets">Tickets (${rows.length})</button><button role="tab" aria-selected="${tab === 'receipts'}" data-tab="receipts">Receipts &amp; attachments (${S.receipts.length})</button></div>
  <div id="ib"></div>`;
  $$('[data-tile]').forEach(b => b.onclick = () => { U.tile = U.tile === b.dataset.tile ? null : b.dataset.tile; if (U.tile === 'review' || U.tile === 'ready') U.tab = 'tickets'; render(); });
  $('#clr') && ($('#clr').onclick = () => { U.tile = null; render(); });
  $$('[data-tab]').forEach(b => b.onclick = () => { U.tab = b.dataset.tab; if (U.tile === 'partial' || U.tile === 'failed') U.tile = null; render(); });
  const ib = $('#ib');
  if (tab === 'tickets') {
    ib.innerHTML = `<div class="filters"><div class="f wide"><label class="lb" for="iq">Search ticket, truck or vendor</label><input id="iq" type="search" value="${esc(U.q)}" placeholder="e.g. 6107, Morgan or truck 24"></div>
      <div class="f"><label class="lb">Order</label><div class="seg"><button data-o="0" aria-pressed="${!U.oldest}">Newest first</button><button data-o="1" aria-pressed="${U.oldest}">Oldest unresolved first</button></div></div>
      <div class="f"><label class="lb">&nbsp;</label><button class="btn" id="bulk" disabled>Assign selected…</button></div></div>
      ${rows.length ? `<div class="tw" role="region" aria-label="Tickets" tabindex="0"><table class="t"><thead><tr><th><span class="sr-only">Select</span></th><th>Received</th><th>Service date</th><th>Project</th><th>Vendor</th><th>Ticket No.</th><th>Assigned</th><th>Blocking issue</th><th>Review state</th></tr></thead><tbody>
      ${rows.map(t => { const is = reviewState(t) === 'needs_review' ? issues(t) : []; return `<tr class="click" data-open="${t.id}"><td><input type="checkbox" data-sel="${t.id}" aria-label="Select ${t.id}"></td><td class="num">${fmtDT(t.receivedAt)}</td><td class="num">${fmtD(t.f.serviceDate.value)}</td><td>${esc(t.f.project.value || 'Unassigned')}</td><td>${esc(vName(t.f.vendor.value))}</td><td class="mono">${esc(t.f.ticketNumber.value || '—')}</td><td>${esc(t.assigned || '—')}</td><td>${is.length ? `<span class="chip w">${is.length} blocker${is.length > 1 ? 's' : ''}</span> <span class="sub">${esc(is[0].msg.slice(0, 60))}${is[0].msg.length > 60 ? '…' : ''}</span>` : reviewState(t) === 'approved' ? '<span class="sub">None</span>' : '<span class="chip ok">Ready to approve</span>'}</td><td>${stateChip(t)}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="card empty"><b>No tickets match.</b>Clear the filter or search, or <a href="#/capture">capture a new ticket</a>.</div>`}`;
    $('#iq').oninput = e => { U.q = e.target.value; const p = e.target.selectionStart; render(); const i = $('#iq'); i.focus(); i.setSelectionRange(p, p); };
    $$('[data-o]').forEach(b => b.onclick = () => { U.oldest = b.dataset.o === '1'; render(); });
    $$('[data-open]').forEach(tr => tr.onclick = e => { if (e.target.matches('input')) return; location.hash = '#/review/' + tr.dataset.open; });
    const sel = () => $$('[data-sel]:checked').map(x => x.dataset.sel);
    $$('[data-sel]').forEach(c => c.onchange = () => { $('#bulk').disabled = !sel().length; });
    $('#bulk').onclick = () => { const ids = sel(); modal('Assign reviewer', `<p class="small muted">Bulk assignment only changes who reviews. It never approves or edits ticket data.</p><label class="lb" for="as">Reviewer</label><select id="as">${PEOPLE.map(p => `<option>${p}</option>`).join('')}</select>`, [{ label: `Assign ${ids.length} ticket${ids.length > 1 ? 's' : ''}`, cls: 'p', fn: r => { const who = $('#as', r).value; ids.forEach(id => { T(id).assigned = who; audit(ME, `Assigned to ${who}`, id); }); toast(`Assigned ${ids.length} to ${who}`); render(); } }]); };
  } else {
    const list = (U.tile === 'partial' || U.tile === 'failed') ? partial : S.receipts;
    ib.innerHTML = list.length ? list.slice().reverse().map(receiptCard).join('') : `<div class="card empty"><b>No partial receipts.</b>Every attachment is accounted for.</div>`;
    bindReceiptActions(ib);
  }
};
function receiptCard(r) {
  const st = receiptStatus(r);
  return `<div class="card"><div class="row" style="justify-content:space-between"><div><h3 style="margin:0">${r.id} · ${r.channel === 'email' ? 'Email' : 'Upload'} ${RCHIP[st]}</h3>
    <div class="small muted">Received ${fmtDT(r.receivedAt)} · ${esc(r.sender || 'Browser upload')} · ${esc(r.subject || '')}</div></div>
    ${st === 'partial' || st === 'failed' ? `<button class="btn p s" data-retry="${r.id}">Retry missing attachment only</button>` : ''}</div>
    <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Attachment</th><th>Source key</th><th class="n">Bytes</th><th>Status</th><th>Document / tickets</th></tr></thead><tbody>
    ${r.attachments.length ? r.attachments.map(a => { const tk = a.docId ? Object.values(S.tickets).filter(t => t.docId === a.docId) : []; return `<tr><td>${esc(a.name)}</td><td class="mono">${esc(a.key)}</td><td class="n num">${a.bytes ? a.bytes.toLocaleString() : '—'}</td><td>${a.status === 'saved' ? '<span class="chip ok">Saved</span>' : a.status === 'failed' ? `<span class="chip e">Not received</span><div class="sub">${esc(a.error)}</div>` : a.status === 'notuploaded' ? '<span class="chip e">Not uploaded</span>' : `<span class="chip i">${esc(a.status)}</span>`}</td><td>${tk.map(t => `<a href="#/review/${t.id}">${t.id}</a>`).join(', ') || (a.docId ? '<span class="sub">No ticket yet</span>' : '—')}</td></tr>`; }).join('') : `<tr><td colspan="5" class="sub">The mail event arrived with an empty attachment list. Waiting for attachments — the message is not marked complete.</td></tr>`}
    </tbody></table></div>
    ${r.provenance.length ? `<div class="note" style="margin-top:10px"><b>Additional provenance:</b> ${r.provenance.map(esc).join('; ')}</div>` : ''}
    ${r.mode === 'local' ? `<p class="xs muted" style="margin:8px 0 0">Saved to the shared team workspace.</p>` : ''}</div>`;
}
function bindReceiptActions(root) { /* attachments are saved locally in one step; nothing to retry */ }

/* ---------- CAPTURE ---------- */
let CAP = null;
VIEWS.capture = () => {
  CAP = CAP || { mode: 'single', project: S.ui.scope !== 'all' ? S.ui.scope : 'TC-2507', vendor: '', date: '', files: [], submitting: false };
  main().innerHTML = `
  <div class="ph"><div><h1>Capture tickets</h1><p>Upload scans or photograph tickets as one batch. Each file gets its own receipt and opens in Review next to the data form. Originals are kept as received; rotation only changes the working copy.</p></div></div>
  <div class="grid" style="grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start" id="capg">
  <div>
    <div class="card">
      <div class="grid g2">
        <div><label class="lb">Batch type</label><div class="seg" role="group" aria-label="Batch type"><button data-m="single" aria-pressed="${CAP.mode === 'single'}">Single project</button><button data-m="mixed" aria-pressed="${CAP.mode === 'mixed'}">Mixed projects</button></div></div>
        <div><label class="lb" for="cp">Default project <span class="chip i">Inherited</span></label><select id="cp" ${CAP.mode === 'mixed' ? 'disabled' : ''}><option value="">None</option>${Object.values(PROJECTS).map(p => `<option value="${p.id}" ${CAP.project === p.id ? 'selected' : ''}>${p.id} · ${p.name}</option>`).join('')}</select></div>
        <div><label class="lb" for="cv">Vendor layout (optional)</label><select id="cv"><option value="">Decide in review</option>${Object.values(VENDORS).map(v => `<option value="${v.id}" ${CAP.vendor === v.id ? 'selected' : ''}>${esc(v.short)}</option>`).join('')}</select></div>
        <div><label class="lb" for="cd">Default service date (optional) <span class="chip i">Inherited</span></label><input id="cd" type="date" value="${CAP.date}"></div>
      </div>
      <p class="small muted" style="margin:10px 0 0">Defaults are labeled “Inherited from batch” in review and are never shown as if printed on the ticket. If the ticket says something different, the ticket value wins and both are shown.</p>
      <hr class="sep">
      <div class="drop" id="drop" tabindex="0" aria-label="Drop files here">
        <div style="font-weight:700;font-size:15px">Drag tickets here</div>
        <div class="small muted" style="margin:4px 0 12px">PDF, JPEG or PNG · up to 25 MB per file</div>
        <div class="row" style="justify-content:center"><label class="btn p" for="fi">Choose files</label><input id="fi" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.tif,.tiff,application/pdf,image/*" class="sr-only">
        <label class="btn" for="cam">${ic('capture')} Use camera</label><input id="cam" type="file" accept="image/*" capture="environment" class="sr-only"></div>
        <div class="xs muted" style="margin-top:8px">The camera only opens when you press “Use camera”. Lay the ticket flat and get all four corners in the shot.</div>
      </div>
      <div class="thumbs" id="thumbs"></div>
      <div class="row" style="margin-top:14px;justify-content:flex-end">
        <button class="btn p" id="submit" ${CAP.files.length && !CAP.submitting ? '' : 'disabled'}>Submit batch (${CAP.files.length} file${CAP.files.length === 1 ? '' : 's'})</button>
      </div>
      <div id="capres"></div>
      <p class="xs muted" style="margin:12px 0 0">Files are saved to the shared team workspace so everyone reviewing sees the same image.</p>
    </div>
  </div>
  <div>
    <div class="card warm">
      <h2>How tickets come in</h2>
      <ul class="small" style="margin:6px 0 0;padding-left:18px">
        <li><b>Scanned PDF batch.</b> One PDF can hold several tickets, and one page can hold two (the example set has two per page on pages 1–3). Each ticket gets its own record and keeps a link to its page.</li>
        <li><b>Phone photo.</b> One ticket per photo works best. Pink and yellow copies both work; note which copy you have.</li>
        <li><b>Shared mailbox.</b> Not connected yet. Once it is, emailed tickets will land in the Inbox with the email kept as the receipt.</li>
      </ul>
    </div>
    <div class="card">
      <h2>Vendor layouts recognized</h2>
      <p class="small muted">Each vendor puts the same facts in different places. Pick the layout above, or in review, and the form shows where to look and how that vendor counts quantities.</p>
      <ul class="small" style="list-style:none;padding:0;margin:0">${Object.entries(LAYOUTS).map(([k, l]) => `<li style="padding:8px 0;border-top:1px solid var(--line)"><b>${esc(VENDORS[k].short)}</b> <span class="muted">· ${esc(l.copies)}</span><div class="xs muted">${esc(l.qty)}</div></li>`).join('')}</ul>
      <a class="btn s" href="#/help" style="margin-top:8px">Open layout guide</a>
    </div>
  </div></div>`;
  if (innerWidth < 900) $('#capg').style.gridTemplateColumns = '1fr';
  $$('[data-m]').forEach(b => b.onclick = () => { CAP.mode = b.dataset.m; render(); });
  $('#cp').onchange = e => CAP.project = e.target.value; $('#cd').onchange = e => CAP.date = e.target.value; $('#cv').onchange = e => CAP.vendor = e.target.value;
  const add = files => { [...files].forEach(fl => { const ext = (fl.name.split('.').pop() || '').toLowerCase(); const ok = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext) || ['application/pdf', 'image/jpeg', 'image/png'].includes(fl.type); const big = fl.size > 25 * 1024 * 1024; const x = { id: uid('F'), name: fl.name, size: fl.size, type: fl.type || (ext === 'pdf' ? 'application/pdf' : ''), url: null, rot: 0, err: !ok ? (/heic|tif/.test(ext) ? 'HEIC/TIFF is not supported yet. Export as JPEG or PDF (iPhone: Settings → Camera → Formats → Most Compatible) and try again.' : 'Unsupported format. Use PDF, JPEG or PNG.') : big ? 'File is over the 25 MB limit. Split the PDF or reduce the image size.' : null, status: 'ready' }; CAP.files.push(x); if (ok && !big) readFile(fl, x); }); drawThumbs(); };
  $('#fi').onchange = e => add(e.target.files); $('#cam').onchange = e => add(e.target.files);
  const d = $('#drop');
  ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); }));
  d.addEventListener('drop', e => add(e.dataTransfer.files));
  $('#submit').onclick = submitBatch;
  drawThumbs();
};
function readFile(fl, x) {
  x.loading = true;
  const rd = new FileReader();
  rd.onload = () => {
    if (/^image\//.test(x.type)) {
      const im = new Image();
      im.onload = () => { const mx = 2000, k = Math.min(1, mx / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); try { x.url = c.toDataURL('image/jpeg', .85); } catch (e) { x.url = rd.result; } x.loading = false; drawThumbs(); };
      im.onerror = () => { x.err = 'This image could not be opened. Try exporting it again as JPEG.'; x.loading = false; drawThumbs(); };
      im.src = rd.result;
    } else { x.url = rd.result; x.loading = false; drawThumbs(); }
  };
  rd.onerror = () => { x.err = 'The file could not be read from this computer.'; x.loading = false; drawThumbs(); };
  rd.readAsDataURL(fl);
}
function drawThumbs() {
  const el = $('#thumbs'); if (!el) return;
  el.innerHTML = CAP.files.map(fl => `<div class="thumb"><div class="im">${fl.url && /^image\//.test(fl.type) ? `<img src="${fl.url}" alt="Preview of ${esc(fl.name)}" style="transform:rotate(${fl.rot}deg)">` : `<div class="small muted">${fl.loading ? 'Reading file…' : 'PDF'}</div>`}</div>
    <div class="tb"><div style="font-weight:600;word-break:break-all">${esc(fl.name)}</div><div class="muted">${(fl.size / 1024).toFixed(0)} KB · ${esc(fl.type || 'unknown')}</div>
    ${fl.err ? `<div class="note e" style="margin-top:6px;padding:6px 8px">${esc(fl.err)}</div>` : ''}
    ${fl.status === 'saved' ? '<span class="chip ok" style="margin-top:6px">Saved</span>' : fl.status === 'sending' ? '<span class="chip i" style="margin-top:6px">Saving…</span>' : ''}
    <div class="row">${fl.status === 'ready' ? `<button class="btn s" data-rot="${fl.id}" ${fl.err || !/^image\//.test(fl.type) ? 'disabled' : ''} aria-label="Rotate working copy of ${esc(fl.name)}">Rotate copy</button><button class="btn s d" data-rm="${fl.id}">Remove</button>` : ''}</div></div></div>`).join('');
  $$('[data-rot]').forEach(b => b.onclick = () => { const x = CAP.files.find(z => z.id === b.dataset.rot); x.rot = (x.rot + 90) % 360; drawThumbs(); });
  $$('[data-rm]').forEach(b => b.onclick = () => { CAP.files = CAP.files.filter(z => z.id !== b.dataset.rm); drawThumbs(); updSubmit(); });
  updSubmit();
}
function updSubmit() { const b = $('#submit'); if (!b) return; const n = CAP.files.filter(x => x.status === 'ready' && !x.err).length; const busy = CAP.files.some(x => x.loading); b.disabled = !n || CAP.submitting || busy; b.textContent = busy ? 'Reading files…' : `Submit batch (${n} file${n === 1 ? '' : 's'})`; }
async function submitBatch() {
  const files = CAP.files.filter(x => x.status === 'ready' && !x.err && x.url); if (!files.length) return;
  CAP.submitting = true; updSubmit();
  const r0 = await reserve('R', 1), t0 = await reserve('T', files.length); let ti = 0;
  if (r0 != null) POOL.R.unshift(r0); if (t0 != null) for (let i = files.length - 1; i >= 0; i--) POOL.T.unshift(t0 + i);
  const rN = take('R'); S.nextR = Math.max(S.nextR || 0, rN + 1); const rec = { id: 'R-' + rN, channel: 'upload', mode: 'local', receivedAt: nowISO(), sender: ME, subject: `Upload · ${files.length} file${files.length > 1 ? 's' : ''} · ${CAP.mode === 'mixed' ? 'mixed projects' : (CAP.project || 'no project')}`, messageKey: null, defaults: { project: CAP.mode === 'single' ? CAP.project || null : null, serviceDate: CAP.date || null }, attachments: [], provenance: [] };
  S.receipts.push(rec);
  const made = [];
  files.forEach(fl => {
    fl.status = 'saved';
    const n = take('T'); S.nextT = Math.max(S.nextT || 0, n + 1); const docId = 'D-' + n, pg = 'PG-' + n + '-1', id = 'TD-' + n;
    const isPdf = /pdf/.test(fl.type);
    S.docs[docId] = { id: docId, name: fl.name, pages: [pg], receipts: [rec.id], sha: null };
    S.pages[pg] = { id: pg, docId, n: 1, kind: isPdf ? 'pdf' : 'img', url: fl.url, rot: fl.rot };
    const t = { id, version: 1, status: 'needs_review', approved: null, approvedSnap: null, assigned: null, ack: {}, receiptId: rec.id, docId, pages: [pg], receivedAt: rec.receivedAt, classification: 'Trucking ticket', manual: true, vendorLayout: CAP.vendor || null,
      f: blankFields(), lines: [], versions: [{ v: 1, at: rec.receivedAt, by: ME, reason: `Uploaded ${fl.name}. Enter the values from the ticket.`, changes: [] }] };
    if (CAP.vendor) t.f.vendor = f(CAP.vendor, null, 'inherited');
    if (rec.defaults.project) t.f.project = f(rec.defaults.project, null, 'inherited');
    if (rec.defaults.serviceDate) t.f.serviceDate = f(rec.defaults.serviceDate, null, 'inherited');
    S.tickets[id] = t; S.order.push(id); made.push(id);
    rec.attachments.push({ key: fl.id, name: fl.name, bytes: fl.size, status: 'saved', docId });
  });
  CAP.submitting = false;
  audit(ME, `Uploaded ${files.length} file(s)`, rec.id);
  persist();
  drawThumbs();
  $('#capres').innerHTML = `<div class="note ok" style="margin-top:12px"><b>${rec.id}:</b> ${made.length} saved. Open ${made.map(id => `<a href="#/review/${id}">${id}</a>`).join(', ')} in Review.</div>`;
  toast(`${made.length} file(s) saved as ${rec.id}`);
  CAP.files = CAP.files.filter(x => x.status !== 'saved'); 
  renderShell('capture');
}

/* ---------- REVIEW ---------- */
function openReview(id) {
  const t = T(id);
  R = { id, base: t.version, baseSnap: snap(t), w: snap(t), dirty: false, active: null, page: 0, zoom: innerWidth < 900 ? .45 : .72, rot: 0, tab: 'data', save: 'saved' };
}
VIEWS.review = (id) => {
  if (!id) {
    const q = Object.values(S.tickets).filter(t => inScope(t) && reviewState(t) === 'needs_review').sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
    if (q.length) { location.replace('#/review/' + q[0].id); return; }
    main().innerHTML = `<div class="ph"><div><h1>Review</h1></div></div><div class="card empty"><b>Nothing waiting for review in this scope.</b>New tickets appear here as they arrive. <a href="#/capture">Capture a ticket</a> or <a href="#/register">open the register</a>.</div>`;
    return;
  }
  const t = T(id);
  if (!t) { main().innerHTML = `<div class="card empty"><b>Ticket ${esc(id)} was not found.</b><a href="#/inbox">Back to the Inbox</a></div>`; return; }
  if (!R || R.id !== id) openReview(id);
  const queue = Object.values(S.tickets).filter(x => inScope(x)).sort((a, b) => a.receivedAt.localeCompare(b.receivedAt)).map(x => x.id);
  const qi = queue.indexOf(id);
  main().innerHTML = `
  <div class="rv-head">
    <a class="btn q s" href="#/inbox">← Inbox</a>
    <h1>${t.id} <span class="muted" style="font-weight:500">· No. <span class="mono" style="font-size:20px">${esc(R.w.f.ticketNumber.value || '—')}</span></span></h1>
    ${stateChip(t)} <span class="chip g">v${t.version}</span> <span class="chip g">${esc(t.classification)}</span>
    <span class="sp" style="flex:1"></span>
    <button class="btn s" id="prevT" ${qi <= 0 ? 'disabled' : ''} aria-label="Previous ticket">‹ Prev</button><span class="small muted">${qi + 1} of ${queue.length}</span><button class="btn s" id="nextT" ${qi >= queue.length - 1 ? 'disabled' : ''} aria-label="Next ticket">Next ›</button>
  </div>
  <div class="mtabs tabs" role="tablist"><button role="tab" data-mt="source" aria-selected="${R.tab === 'source'}">Source</button><button role="tab" data-mt="data" aria-selected="${R.tab === 'data'}">Data &amp; approval</button></div>
  <div class="rv" id="rv" data-tab="${R.tab}">
    <section class="src" id="src" aria-label="Source document"></section>
    <div class="divider" id="div" role="separator" aria-orientation="vertical" aria-label="Resize panes" tabindex="0"></div>
    <section class="frm" aria-label="Ticket data"><div class="frm-body" id="frm"></div>
      <div class="frm-foot" id="foot"></div></section>
  </div>`;
  $('#prevT').onclick = () => location.hash = '#/review/' + queue[qi - 1];
  $('#nextT').onclick = () => location.hash = '#/review/' + queue[qi + 1];
  $$('[data-mt]').forEach(b => b.onclick = () => { R.tab = b.dataset.mt; $('#rv').dataset.tab = R.tab; $$('[data-mt]').forEach(x => x.setAttribute('aria-selected', x.dataset.mt === R.tab)); });
  // divider
  const dv = $('#div'), src = $('#src');
  if (R.split) src.style.flex = `0 0 ${R.split}%`;
  dv.onmousedown = e => { e.preventDefault(); const rv = $('#rv').getBoundingClientRect(); const mv = ev => { const p = Math.min(75, Math.max(30, (ev.clientX - rv.left) / rv.width * 100)); src.style.flex = `0 0 ${p}%`; R.split = p; }; const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); };
  dv.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { R.split = Math.min(75, Math.max(30, (R.split || 55) + (e.key === 'ArrowLeft' ? -3 : 3))); src.style.flex = `0 0 ${R.split}%`; } };
  renderSource(); renderForm(); renderFoot();
};
function curPageId() { const t = T(R.id); return t.pages[Math.min(R.page, t.pages.length - 1)]; }
function activeEv() {
  if (!R.active) return null;
  const w = R.w;
  if (R.active.startsWith('l')) {
    const [li, k] = R.active.slice(1).split('.'); const l = w.lines[+li]; if (!l || !l.ev) return null;
    const col = { material: 'material', from: 'from', to: 'to', loads: 'loads', quantity: 'quantity', code: 'code', alloc: 'code', unit: 'quantity', basis: 'quantity', times: 'times', scale: 'scale', cost_code: 'code' }[k] || 'quantity';
    const bx = l.ev.boxes || {}; const box = bx[col] || bx.quantity || bx.material || l.ev.box || null;
    return box ? { page: l.ev.page, box } : null;
  }
  return w.f[R.active]?.ev || null;
}
const BLOBS = {};
function blobUrl(pg) {
  if (BLOBS[pg.id]) return BLOBS[pg.id];
  try { const [h, b64] = pg.url.split(','); const mime = (h.match(/data:([^;]+)/) || [])[1] || 'application/pdf'; const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); BLOBS[pg.id] = URL.createObjectURL(new Blob([a], { type: mime })); } catch (e) { BLOBS[pg.id] = pg.url; }
  return BLOBS[pg.id];
}
function renderSource() {
  const t = T(R.id), el = $('#src'); if (!el) return;
  const pid = curPageId(), pg = S.pages[pid], ev = activeEv();
  let inner = '', W = PW, Hh = PH;
  const mine = (pg.regions || []).find(rg => rg.t === t.id);
  if (pg.kind === 'scan') {
    W = pg.w || PW; Hh = pg.h || PH;
    let s = `<svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Scanned page ${pg.n} of ${S.docs[pg.docId].pages.length}"><image href="${pg.url}" x="0" y="0" width="${W}" height="${Hh}" preserveAspectRatio="none"/>`;
    (pg.regions || []).forEach(rg => { if (rg.t !== t.id) { const o = T(rg.t); s += `<rect x="0" y="${rg.y0}" width="${W}" height="${rg.h}" fill="#102638" opacity=".38"/><rect x="${W - 250}" y="${rg.y0 + rg.h / 2 - 18}" width="232" height="36" rx="6" fill="#fff"/><text x="${W - 134}" y="${rg.y0 + rg.h / 2 + 6}" text-anchor="middle" font-size="15" font-weight="700" fill="#102638" font-family="Arial,sans-serif">${esc(o ? vName(o.f.vendor.value).split(' ')[0] + ' ' + (o.f.ticketNumber.value || '') : rg.t)} · ${esc(rg.t)}</text>`; } });
    if (mine && pg.regions.length > 1) s += `<rect x="3" y="${mine.y0 + 3}" width="${W - 6}" height="${mine.h - 6}" fill="none" stroke="#087E82" stroke-width="3" stroke-dasharray="10 6"/>`;
    if (ev && ev.page === pid && ev.box) s += `<rect x="${ev.box[0] - 3}" y="${ev.box[1] - 3}" width="${ev.box[2] + 6}" height="${ev.box[3] + 6}" fill="rgba(8,126,130,.16)" stroke="#087E82" stroke-width="3" rx="4"/>`;
    s += '</svg>'; inner = s;
  } else if (pg.kind === 'img') { Hh = 1100; inner = `<img src="${pg.url}" alt="Uploaded ticket image" style="width:${PW}px;display:block;transform:rotate(${pg.rot || 0}deg)">`; }
  else if (pg.kind === 'pdf') { inner = `<iframe src="${blobUrl(pg)}" title="Uploaded PDF" style="width:${PW}px;height:${PH}px;border:0;background:#fff"></iframe>`; }
  else inner = `<div class="card" style="width:${PW}px;height:500px;display:grid;place-items:center;text-align:center"><div><b>No image for this ticket</b><p class="muted small">Enter the values from the paper ticket on the right.</p></div></div>`;
  const evMsg = !R.active ? 'Select a field to see where it is on the ticket.' : ev && ev.box ? (ev.page === pid ? `Highlighting ${esc(fieldName(R.active))} on page ${pg.n}.` : `${esc(fieldName(R.active))} is on page ${S.pages[ev.page].n} — <button class="btn q s" id="gopg">Go to page ${S.pages[ev.page].n}</button>`) : `${esc(fieldName(R.active))}: ${t.manual ? 'entered by hand — no highlight for uploaded files.' : 'not written on this ticket.'}`;
  el.innerHTML = `<div class="src-bar"><span class="small" style="font-weight:600">${esc(S.docs[pg.docId].name)}</span><span class="chip g">Page ${pg.n} of ${S.docs[pg.docId].pages.length}</span>${t.copy ? `<span class="chip g">${esc(t.copy)} copy</span>` : ''}${pg.regions && pg.regions.length > 1 ? `<span class="chip t">${pg.regions.length} tickets on this page</span>` : ''}
    <span style="flex:1"></span>${t.pages.length > 1 ? `<button class="btn s" id="pp" ${R.page === 0 ? 'disabled' : ''} aria-label="Previous page">‹</button><button class="btn s" id="np" ${R.page >= t.pages.length - 1 ? 'disabled' : ''} aria-label="Next page">›</button>` : ''}
    <button class="btn s" id="zo" aria-label="Zoom out">−</button><span class="small num" style="min-width:38px;text-align:center">${Math.round(R.zoom * 100)}%</span><button class="btn s" id="zi" aria-label="Zoom in">+</button><button class="btn s" id="ro" aria-label="Rotate view">⟳</button>${pg.url ? `<button class="btn s" id="opn" aria-label="Open the original in a new tab">Open original</button>` : ''}</div>
    <div class="src-view" id="sv"><div class="src-canvas" style="transform:scale(${R.zoom}) rotate(${R.rot}deg);${R.rot % 180 ? `margin-top:${W * R.zoom * .2}px` : ''}">${inner}</div></div>
    <div class="src-meta" aria-live="polite">${evMsg} <span class="xs">Zoom and rotation only change this view; the original stays as received.</span></div>`;
  const cv = $('.src-canvas', el); cv.style.width = W + 'px'; cv.style.marginBottom = `-${(1 - R.zoom) * Hh}px`; cv.style.marginRight = `-${(1 - R.zoom) * W}px`;
  $('#zi').onclick = () => { R.zoom = Math.min(2.5, +(R.zoom + .1).toFixed(2)); renderSource(); };
  $('#zo').onclick = () => { R.zoom = Math.max(.3, +(R.zoom - .1).toFixed(2)); renderSource(); };
  $('#ro').onclick = () => { R.rot = (R.rot + 90) % 360; renderSource(); };
  $('#opn') && ($('#opn').onclick = () => openOriginal(pg));
  $('#pp') && ($('#pp').onclick = () => { R.page--; renderSource(); });
  $('#np') && ($('#np').onclick = () => { R.page++; renderSource(); });
  $('#gopg') && ($('#gopg').onclick = () => { R.page = T(R.id).pages.indexOf(ev.page); renderSource(); });
  const sv = $('#sv');
  if (ev && ev.box && ev.page === pid) sv.scrollTop = Math.max(0, ev.box[1] * R.zoom - 80);
  else if (mine && !R.active) sv.scrollTop = Math.max(0, mine.y0 * R.zoom - 8);
}
function openOriginal(pg) { const u = pg.kind === 'pdf' ? blobUrl(pg) : pg.kind === 'img' ? blobUrl(pg) : pg.url; window.open(u, '_blank', 'noopener'); }
function fieldName(k) { if (k.startsWith('l')) { const [i, c] = k.slice(1).split('.'); return `Line ${+i + 1} ${({ material: 'material', from: 'from', to: 'to', loads: 'load count', quantity: 'quantity', unit: 'unit', basis: 'basis', code: 'cost code', alloc: 'allocations', times: 'times', scale: 'scale ticket', cost_code: 'cost code' })[c] || c}`; } return LABELS[k] || k; }
function originChip(o) { const [l, c] = ORIGIN[o] || ORIGIN.none; return `<span class="chip ${c}">${l}</span>`; }
function fld(k, type, opts = {}) {
  R.w.f[k] = R.w.f[k] || f(null);
  const x = R.w.f[k], bl = issues(Object.assign({}, T(R.id), R.w)).filter(i => i.field === k);
  const miss = bl.some(i => i.id.startsWith('REQ')), unc = x.uncertain;
  let input;
  const v = x.value ?? '';
  if (type === 'vendor') input = `<select id="f-${k}" data-f="${k}"><option value="">Select vendor…</option>${Object.values(VENDORS).map(o => `<option value="${o.id}" ${v === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>`;
  else if (type === 'project') input = `<select id="f-${k}" data-f="${k}"><option value="">Unassigned — choose project…</option>${Object.values(PROJECTS).map(o => `<option value="${o.id}" ${v === o.id ? 'selected' : ''}>${o.id} · ${esc(o.name)}</option>`).join('')}</select>`;
  else if (type === 'check') input = `<label class="row small" style="gap:6px"><input type="checkbox" id="f-${k}" data-f="${k}" ${x.value ? 'checked' : ''}> ${esc(opts.text || 'Yes')}</label>`;
  else if (type === 'select') input = `<select id="f-${k}" data-f="${k}"><option value="">—</option>${opts.options.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  else input = `<input id="f-${k}" data-f="${k}" type="${type}" value="${esc(v)}" ${opts.ph ? `placeholder="${esc(opts.ph)}"` : ''} ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''} aria-describedby="m-${k}">`;
  return `<div class="fld ${miss ? 'miss' : ''} ${unc ? 'unc' : ''} ${R.active === k ? 'act' : ''}" data-fw="${k}">
    <div class="lr"><label for="f-${k}">${esc(LABELS[k])}</label>${miss ? '<span class="chip w">Missing</span>' : ''}${unc ? '<span class="chip w">Uncertain</span>' : ''}${x.ev ? `<button class="btn q s" data-show="${k}" aria-label="Show ${esc(LABELS[k])} on source">Show on source</button>` : ''}</div>
    ${input}
    <div class="meta" id="m-${k}">${originChip(x.origin)}${x.raw != null && x.raw !== '' ? `<span>On ticket: <span class="raw">${esc(x.raw)}</span></span>` : x.origin === 'none' ? '<span>Blank on ticket — stays blank, not zero</span>' : ''}${x.note ? `<span>${esc(x.note)}</span>` : ''}${unc ? `<button class="btn s" data-conf="${k}">Confirm as read</button>` : ''}</div></div>`;
}
function layoutCard(w, t) {
  const k = w.f.vendor.value || t.vendorLayout, L = LAYOUTS[k]; if (!L) return '<div class="note" style="margin-bottom:12px">Choose the vendor below and the form shows that vendor\'s layout: where each field sits and how quantities are counted.</div>';
  return `<details class="sec lay" ${R.layOpen ? 'open' : ''} id="lay"><summary><h3 style="display:inline">Vendor layout · ${esc(L.name)}</h3></summary><div class="b small">
    <dl class="kv"><dt>Quantities</dt><dd>${esc(L.qty)}</dd><dt>Times</dt><dd>${esc(L.time)}</dd><dt>Ticket No.</dt><dd>${esc(L.id)}</dd><dt>Copies</dt><dd>${esc(L.copies)}</dd></dl>
    <div style="margin-top:6px"><b>Where to look</b><ul style="margin:4px 0 0;padding-left:18px">${L.where.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div style="margin-top:6px"><b>Watch for</b><ul style="margin:4px 0 0;padding-left:18px">${L.quirks.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div></details>`;
}
function renderForm() {
  const t = T(R.id), w = R.w, el = $('#frm'); if (!el) return;
  const sc = el.scrollTop;
  const proj = w.f.project.value, codes = CODES[proj] || [];
  const inf = infos(Object.assign({}, t, w));
  const rec = S.receipts.find(r => r.id === t.receiptId);
  const allIss = issues(Object.assign({}, t, w));
  el.innerHTML = `
  ${t.manual ? '<div class="note w" style="margin-bottom:12px"><b>Enter from the ticket.</b> Type each value as written. Every entry is recorded under your name, and the image stays next to the form.</div>' : '<div class="note" style="margin-bottom:12px">Values marked “On ticket” were keyed from the scan, exactly as written. Check each one against the image before approving. Your corrections are kept separately from the ticket text.</div>'}
  ${layoutCard(w, t)}
  ${t.approved && t.approved.version !== t.version ? `<div class="note w" style="margin-bottom:12px"><b>Edited after approval.</b> v${t.approved.version} was approved by ${esc(t.approved.by)}. This is v${t.version} and needs a new approval before it can be used in outputs.</div>` : ''}
  ${inf.map(i => `<div class="note" style="margin-bottom:8px">${esc(i)}</div>`).join('')}
  <div class="sec"><h3>Ticket &amp; job</h3><div class="b grid g2">${fld('vendor', 'vendor')}${fld('ticketNumber', 'text', { ph: 'Keep leading zeros' })}${fld('serviceDate', 'date')}${fld('project', 'project')}${fld('customer', 'text')}${fld('jobName', 'text')}${fld('jobNumber', 'text')}${fld('jobLocation', 'text')}</div>
    <div class="b small muted" style="padding-top:0">Service date is the work date on the ticket. It is separate from when we received it: ${fmtDT(t.receivedAt)} (${esc(rec?.id || '—')}). ${rec?.defaults?.serviceDate ? `Batch default date: ${fmtD(rec.defaults.serviceDate)} (inherited, not on ticket).` : ''}</div></div>
  <div class="sec"><h3>Truck &amp; driver</h3><div class="b grid g3">${fld('truckNumber', 'text')}${fld('trailerNumber', 'text')}${fld('truckType', 'text', { ph: 'As written, e.g. Super Solo, T&T' })}${fld('driverName', 'text')}${fld('rate', 'text')}${fld('odoStart', 'text', { inputmode: 'numeric' })}</div></div>
  <div class="sec"><h3>Runs / material lines <span class="chip g">${w.lines.length} line${w.lines.length === 1 ? '' : 's'}</span></h3><div class="b">
    ${w.lines.length ? `<div style="overflow:auto"><table class="lt"><thead><tr><th>Material (on ticket → reviewed)</th><th>From → To · times</th><th>Loads</th><th>Quantity · scale ticket</th><th>Unit</th><th>Basis</th><th>Cost code</th><th></th></tr></thead><tbody>
    ${w.lines.map((l, i) => { const bl = allIss.filter(x => x.field && x.field.startsWith(`l${i}.`)).map(x => x.field); const cl = k => (bl.includes(`l${i}.${k}`) ? 'style="border-color:#D9A93A;background:#FFFBEF"' : ''); return `<tr data-lw="${i}">
      <td style="min-width:170px"><div class="xs muted">On ticket: <span class="raw">${esc(l.material_raw || '—')}</span></div><select data-l="${i}" data-k="material" aria-label="Line ${i + 1} reviewed material">${[...new Set([l.material, ...MATERIALS].filter(Boolean))].map(m => `<option ${l.material === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>${l.material_origin === 'mapping' ? '<div class="xs muted">Matched to material list</div>' : ''}</td>
      <td style="min-width:170px"><input data-l="${i}" data-k="from" value="${esc(l.from || '')}" aria-label="Line ${i + 1} from" placeholder="From"><input data-l="${i}" data-k="to" value="${esc(l.to || '')}" aria-label="Line ${i + 1} to" placeholder="To" style="margin-top:4px"><input data-l="${i}" data-k="times" value="${esc(l.times || '')}" aria-label="Line ${i + 1} in/out times" placeholder="In / out times as written" style="margin-top:4px"></td>
      <td style="min-width:80px"><input data-l="${i}" data-k="loads" value="${esc(l.loads ?? '')}" inputmode="numeric" aria-label="Line ${i + 1} load count" ${cl('loads')}>${l.loads_note ? `<div class="xs muted">${esc(l.loads_note)}</div>` : ''}${l.loads_uncertain ? `<button class="btn s" data-lconf="${i}" style="margin-top:4px">Confirm count</button>` : ''}</td>
      <td style="min-width:110px"><input data-l="${i}" data-k="quantity" value="${esc(l.quantity ?? '')}" inputmode="decimal" aria-label="Line ${i + 1} quantity" ${cl('quantity')}><input data-l="${i}" data-k="scale" value="${esc(l.scale || '')}" aria-label="Line ${i + 1} scale ticket number" placeholder="Scale ticket #" style="margin-top:4px">${l.qty_note && l.qty_uncertain ? `<div class="xs muted">${esc(l.qty_note)}</div><button class="btn s" data-qconf="${i}" style="margin-top:4px">Confirm quantity</button>` : ''}</td>
      <td style="min-width:90px"><select data-l="${i}" data-k="unit" aria-label="Line ${i + 1} unit" ${cl('unit')}><option value="">—</option>${Object.entries(UNITS).map(([k, v]) => `<option value="${k}" ${l.unit === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
      <td style="min-width:110px"><select data-l="${i}" data-k="basis" aria-label="Line ${i + 1} quantity basis" ${cl('basis')}>${Object.entries(BASES).map(([k, v]) => `<option value="${k}" ${l.basis === k ? 'selected' : ''}>${v}</option>`).join('')}</select>${l.basis_origin === 'profile' ? '<div class="xs muted">From vendor layout</div>' : ''}</td>
      <td style="min-width:150px"><div class="xs muted">On ticket: <span class="raw">${esc(l.cost_code_raw || '—')}</span></div>${l.allocations.length ? `<div class="small">${l.allocations.map(a => `${esc(a.code)}: ${esc(a.qty)}`).join(' · ')}</div>` : `<select data-l="${i}" data-k="cost_code" aria-label="Line ${i + 1} cost code" ${cl('code')}><option value="">Not assigned yet</option>${codes.map(c => `<option value="${c[0]}" ${l.cost_code === c[0] ? 'selected' : ''}>${c[0]} · ${esc(c[1])}</option>`).join('')}</select>`}<button class="btn s q" data-alloc="${i}" style="margin-top:4px">${l.allocations.length ? 'Edit allocation' : 'Allocate across codes'}</button></td>
      <td><button class="btn s q" data-lshow="${i}" aria-label="Show line ${i + 1} on source">Source</button><button class="btn s q d" data-ldel="${i}" aria-label="Remove line ${i + 1}">✕</button></td></tr>`; }).join('')}
    </tbody></table></div>` : '<div class="empty" style="padding:14px">No lines yet. Add one for each run, material or scale ticket on the ticket.</div>'}
    <button class="btn s" id="addl" style="margin-top:8px">+ Add line</button>
    <p class="xs muted" style="margin:8px 0 0">Each line keeps its own unit and basis. Loads, tons, yards and hours are never added together. A total written on the ticket (for example a circled 5) is not entered as another line.</p></div></div>
  <div class="sec"><h3>Foreman notes &amp; remarks</h3><div class="b grid g2">${fld('foremanNote', 'text')}${fld('remarks', 'text')}</div><p class="b xs muted" style="margin:0;padding-top:0">Notes are kept exactly as written. Use “Allocate across codes” on a line to turn a cost-code note into allocations. Nothing is guessed.</p></div>
  <div class="sec"><h3>Time</h3><div class="b grid g2">${fld('start', 'time')}${fld('end', 'time')}${fld('rollover', 'check', { text: 'End time is on the next day' })}${fld('breakHrs', 'text', { inputmode: 'decimal' })}${fld('onsiteHours', 'text')}${fld('totalHours', 'text')}<div class="small muted" style="align-self:end">${durText(w)}</div></div><div class="b xs muted" style="padding-top:0">Hours are recorded as written on the ticket. They are not treated as payroll.</div></div>
  <div class="sec"><h3>Scale weights (printed gross / tare / net)</h3><div class="b grid g3">${fld('gross', 'text', { inputmode: 'numeric' })}${fld('tare', 'text', { inputmode: 'numeric' })}${fld('net', 'text', { inputmode: 'numeric' })}</div>
    <div class="b" style="padding-top:0">${weightNote(t, w)}</div></div>
  <div class="sec"><h3>Signatures &amp; safety</h3><div class="b grid g3">${fld('signature', 'select', { options: ['Present', 'Not observed'] })}${fld('repSig', 'select', { options: ['Present', 'Not observed'] })}${fld('injury', 'select', { options: ['Not marked', 'No', 'Yes'] })}</div><div class="b xs muted" style="padding-top:0">Records whether a signature is on the ticket. It is not signature verification.</div></div>
  ${postSection()}
  <div class="sec" id="blk"><h3>Approval blockers</h3><div class="b" id="blkb"></div></div>
  <div class="sec"><h3>History</h3><div class="b small">${t.versions.slice(-3).reverse().map(v => `<div style="padding:4px 0;border-bottom:1px dashed var(--border)"><b>v${v.v}</b> · ${esc(v.by)} · ${fmtDT(v.at)} — ${esc(v.reason)}${v.changes?.length ? `<div class="xs muted">${v.changes.map(esc).join('; ')}</div>` : ''}</div>`).join('')}<button class="btn q s" id="vers" style="margin-top:6px">View all versions</button></div></div>`;
  el.scrollTop = sc;
  $('#lay') && $('#lay').addEventListener('toggle', e => { R.layOpen = e.target.open; });
  renderBlockers();
  bindForm();
  bindPost();
}
function durText(w) { const s = w.f.start.value, e = w.f.end.value; if (!s || !e) return 'Duration: needs start and end'; const [a, b] = s.split(':').map(Number), [c, d] = e.split(':').map(Number); let m = (c * 60 + d) - (a * 60 + b); if (m < 0) { if (!w.f.rollover.value) return '<span style="color:var(--amber)">End is before start — confirm overnight</span>'; m += 1440; } const br = Number(w.f.breakHrs.value || 0) * 60; return `Elapsed ${(m / 60).toFixed(2)} h${br ? ` − break ${(br / 60).toFixed(2)} h = ${((m - br) / 60).toFixed(2)} h` : ''} <span class="chip g">Derived</span>${w.f.totalHours.value ? ` · printed ${esc(w.f.totalHours.value)} h` : ''}`; }
function weightNote(t, w) {
  const g = M(w.f.gross.value), ta = M(w.f.tare.value), ne = M(w.f.net.value);
  if (g == null && ta == null && ne == null) return '<div class="small muted">No weights on this ticket. They stay blank — nothing is estimated from truck type.</div>';
  if (g != null && ta != null && ne != null) {
    const d = g - ta - ne;
    if (d === 0) return `<div class="note ok">Gross − tare = ${LB(g - ta)} lb, matching printed net (${F(ne / 2000, 2)} short tons).</div>`;
    return `<div class="note w"><b>Printed net does not match.</b> Gross − tare = ${LB(g - ta)} lb; printed net ${LB(ne)} lb (difference ${LB(d)} lb). The ticket's numbers are kept as printed.
      ${w.ack.weight ? `<div style="margin-top:6px"><span class="chip ok">Acknowledged</span> ${esc(w.ack.weight)}</div>` : `<div style="margin-top:8px"><button class="btn s" id="ackw">Acknowledge with reason…</button></div>`}</div>`;
  }
  return '<div class="small muted">Some weights are blank. Missing values stay blank, not zero.</div>';
}
function renderBlockers() {
  const t = T(R.id), list = issues(Object.assign({}, t, R.w)), b = $('#blkb'); if (!b) return;
  const st = reviewState(t);
  b.innerHTML = st === 'approved' && !R.dirty ? `<div class="note ok">Approved v${t.approved.version} by ${esc(t.approved.by)} on ${fmtDT(t.approved.at)}${t.approved.reason ? ` — “${esc(t.approved.reason)}”` : ''}. Any substantive edit creates a new version that needs approval.</div>`
    : list.length ? `<ul class="blk">${list.map(i => `<li><span class="chip w" aria-hidden="true">!</span><span>${esc(i.msg)}<div class="xs muted">Blocks: ${esc(i.dest)}</div></span><button class="btn s go" data-goto="${esc(i.field)}">Go to field</button>${i.id === 'DUP' ? `<button class="btn s" id="ackdup">Not a duplicate…</button>` : ''}</li>`).join('')}</ul>`
      : `<div class="note ok"><b>No blockers.</b> Every required field is present and checked. ${R.dirty ? 'Save, then approve.' : 'Ready to approve.'}</div>`;
  $$('[data-goto]', b).forEach(x => x.onclick = () => gotoField(x.dataset.goto));
  $('#ackdup') && ($('#ackdup').onclick = () => reasonModal('Mark as not a duplicate', 'Explain why this ticket is separate (for example, a different load the same day).', r => { R.w.ack.dup = r; markDirty(); renderForm(); }));
}
function gotoField(k) {
  R.active = k === 'lines' ? null : k; R.tab = 'data'; $('#rv').dataset.tab = 'data';
  let sel = k.startsWith('l') ? (() => { const [i, c] = k.slice(1).split('.'); return c === 'alloc' ? `[data-alloc="${i}"]` : `[data-l="${i}"][data-k="${c === 'code' ? 'cost_code' : c}"]`; })() : `#f-${k}`;
  if (k === 'lines') sel = '#addl';
  if (k === 'post') { R.active = null; sel = '#post'; }
  renderSource(); renderForm();
  const el = $(sel) || $(`[data-alloc]`); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); }
  const ev = activeEv(); if (ev && ev.page !== curPageId()) { R.page = T(R.id).pages.indexOf(ev.page); renderSource(); }
}
function markDirty() { R.dirty = true; R.save = 'dirty'; renderFoot(); renderBlockers(); }
function bindForm() {
  const el = $('#frm');
  $$('[data-f]', el).forEach(inp => {
    inp.addEventListener('focus', () => { R.active = inp.dataset.f; $$('.fld.act', el).forEach(x => x.classList.remove('act')); inp.closest('.fld')?.classList.add('act'); const ev = activeEv(); if (ev && ev.page !== curPageId()) R.page = T(R.id).pages.indexOf(ev.page); renderSource(); });
    inp.addEventListener('change', () => {
      const k = inp.dataset.f, x = R.w.f[k];
      const val = inp.type === 'checkbox' ? inp.checked : (inp.value === '' ? null : inp.value);
      if (val === x.value) return;
      x.value = val; x.origin = val == null ? (x.raw ? 'manual' : 'none') : 'manual'; x.uncertain = false;
      if (k === 'project') { R.w.lines.forEach(l => { if (l.cost_code && !codeOK(val, l.cost_code)) l.cost_code = null; }); }
      markDirty(); renderForm();
    });
  });
  $$('[data-l]', el).forEach(inp => {
    inp.addEventListener('focus', () => { R.active = `l${inp.dataset.l}.${inp.dataset.k === 'cost_code' ? 'code' : inp.dataset.k}`; renderSource(); });
    inp.addEventListener('change', () => {
      const l = R.w.lines[+inp.dataset.l], k = inp.dataset.k; let v = inp.value === '' ? null : inp.value;
      if ((k === 'quantity' || k === 'loads') && v != null && M(v) == null) { toast('Enter a number (use a decimal point, e.g. 18.50).', true); inp.value = l[k] ?? ''; return; }
      l[k] = v; if (k === 'loads') l.loads_uncertain = false; if (k === 'quantity') l.qty_uncertain = false; if (k === 'basis') l.basis_origin = 'manual'; if (k === 'material') l.material_origin = 'manual';
      if (k === 'unit' && l.allocations.length) { l.allocations = []; toast('Unit changed — allocations cleared. Re-allocate in the new unit.'); }
      markDirty(); renderForm();
    });
  });
  $$('[data-show]', el).forEach(b => b.onclick = () => { R.active = b.dataset.show; const ev = activeEv(); if (ev && ev.page !== curPageId()) R.page = T(R.id).pages.indexOf(ev.page); R.tab = 'source'; $('#rv').dataset.tab = innerWidth < 900 ? 'source' : R.tab; renderSource(); renderForm(); });
  $$('[data-lshow]', el).forEach(b => b.onclick = () => { R.active = `l${b.dataset.lshow}.quantity`; const ev = activeEv(); if (ev && ev.page !== curPageId()) R.page = T(R.id).pages.indexOf(ev.page); if (innerWidth < 900) { R.tab = 'source'; $('#rv').dataset.tab = 'source'; } renderSource(); });
  $$('[data-conf]', el).forEach(b => b.onclick = () => { const x = R.w.f[b.dataset.conf]; x.uncertain = false; x.note = (x.note ? x.note + ' ' : '') + 'Confirmed as read by reviewer.'; markDirty(); renderForm(); });
  $$('[data-qconf]', el).forEach(b => b.onclick = () => { const l = R.w.lines[+b.dataset.qconf]; l.qty_uncertain = false; l.qty_note = (l.qty_note || '') + ' Confirmed by reviewer.'; markDirty(); renderForm(); });
  $$('[data-lconf]', el).forEach(b => b.onclick = () => { const l = R.w.lines[+b.dataset.lconf]; l.loads_uncertain = false; l.loads_note = (l.loads_note || '') + ' Confirmed by reviewer.'; markDirty(); renderForm(); });
  $$('[data-ldel]', el).forEach(b => b.onclick = () => modal('Remove this line?', '<p>The line is removed from the reviewed version only. The source ticket is unchanged and earlier versions keep it.</p>', [{ label: 'Remove line', cls: 'd', fn: () => { R.w.lines.splice(+b.dataset.ldel, 1); markDirty(); renderForm(); } }]));
  $$('[data-alloc]', el).forEach(b => b.onclick = () => allocDialog(+b.dataset.alloc));
  $('#addl').onclick = () => { R.w.lines.push({ id: uid(R.id + '-L'), material_raw: null, material: 'Other (keep raw)', material_origin: 'manual', from: '', to: '', loads: null, quantity: null, unit: '', basis: 'unknown', cost_code_raw: null, cost_code: null, allocations: [], times: '', scale: '', ev: null }); markDirty(); renderForm(); };
  $('#ackw') && ($('#ackw').onclick = () => reasonModal('Acknowledge weight difference', 'The printed numbers stay as printed. Record why the approved quantity is acceptable (for example, “Using printed tons per scale house; difference noted for vendor follow-up”).', r => { R.w.ack.weight = r; markDirty(); renderForm(); }));
  $('#vers').onclick = versionsModal;
}
function reasonModal(title, help, cb, required = true) {
  modal(title, `<p class="small">${esc(help)}</p><label class="lb" for="rsn">Reason${required ? ' (required)' : ' (optional)'}</label><textarea id="rsn"></textarea><div id="rerr" class="small" style="color:var(--err);margin-top:4px"></div>`, [{ label: 'Save', cls: 'p', fn: r => { const v = $('#rsn', r).value.trim(); if (required && !v) { $('#rerr', r).textContent = 'Please enter a reason.'; return false; } cb(v); } }]);
}
function allocDialog(i) {
  const l = R.w.lines[i], codes = CODES[R.w.f.project.value] || [], unit = UNITS[l.unit] || '(no unit)';
  let rows = l.allocations.length ? clone(l.allocations) : [{ code: '', qty: '' }, { code: '', qty: '' }];
  const note = R.w.f.foremanNote.value;
  const draw = r => {
    const q = M(l.quantity), sum = rows.reduce((a, x) => a + (M(x.qty) || 0), 0), rem = (q || 0) - sum;
    $('#alr', r).innerHTML = rows.map((x, j) => `<tr><td><select data-ac="${j}" aria-label="Allocation ${j + 1} code"><option value="">Choose code…</option>${codes.map(c => `<option value="${c[0]}" ${x.code === c[0] ? 'selected' : ''}>${c[0]} · ${esc(c[1])}</option>`).join('')}</select></td><td><input data-aq="${j}" value="${esc(x.qty)}" inputmode="decimal" aria-label="Allocation ${j + 1} quantity"></td><td>${unit}</td><td><button class="btn s q d" data-ar="${j}" aria-label="Remove allocation ${j + 1}">✕</button></td></tr>`).join('');
    $('#alsum', r).innerHTML = `<div class="row"><span class="chip ${Math.abs(rem) <= 10 && q != null ? 'ok' : 'w'}">Allocated ${F(sum)} of ${F(q)} ${unit}</span><span class="chip ${Math.abs(rem) <= 10 ? 'ok' : 'w'}">Remaining ${F(rem)} ${unit}</span><span class="chip g">Tolerance ±0.01</span></div>`;
    $$('[data-ac]', r).forEach(s => s.onchange = () => { rows[+s.dataset.ac].code = s.value; });
    $$('[data-aq]', r).forEach(s => s.oninput = () => { rows[+s.dataset.aq].qty = s.value; const pos = s.selectionStart, j = s.dataset.aq; draw(r); const n = $(`[data-aq="${j}"]`, r); n.focus(); n.setSelectionRange(pos, pos); });
    $$('[data-ar]', r).forEach(s => s.onclick = () => { rows.splice(+s.dataset.ar, 1); draw(r); });
  };
  const r = modal(`Allocate line ${i + 1} across cost codes`, `
    <dl class="kv"><dt>Measure</dt><dd><b>${esc(l.quantity ?? '—')} ${unit}</b> · ${BASES[l.basis] || ''} · ${esc(l.material)}</dd><dt>Foreman note (raw)</dt><dd>${note ? `<span class="raw">${esc(note)}</span>` : '<span class="muted">None on ticket</span>'}</dd></dl>
    <p class="xs muted">Allocations use this line's unit only. An hours split never allocates tons or loads automatically. Codes are limited to ${esc(R.w.f.project.value || 'the selected project')}.</p>
    <table class="lt"><thead><tr><th>Cost code</th><th>Quantity</th><th>Unit</th><th></th></tr></thead><tbody id="alr"></tbody></table>
    <button class="btn s" id="aladd" style="margin:6px 0 10px">+ Add code</button><div id="alsum"></div>
    <label class="lb" for="alrs" style="margin-top:10px">Reason / explanation</label><textarea id="alrs" placeholder="e.g. Per foreman note on ticket">${esc(l.allocReason || '')}</textarea><div id="alerr" class="small" style="color:var(--err);margin-top:4px"></div>`,
    [{ label: 'Clear allocation', fn: () => { l.allocations = []; markDirty(); renderForm(); } }, { label: 'Save allocation', cls: 'p', fn: r => {
      const q = M(l.quantity), clean = rows.filter(x => x.code || x.qty), sum = clean.reduce((a, x) => a + (M(x.qty) || 0), 0);
      if (q == null) { $('#alerr', r).textContent = 'Enter the line quantity first.'; return false; }
      if (clean.some(x => !x.code || M(x.qty) == null)) { $('#alerr', r).textContent = 'Every row needs a code and a number.'; return false; }
      if (Math.abs(sum - q) > 10) { $('#alerr', r).textContent = `Allocations total ${F(sum)} but the line is ${F(q)} ${unit}. Remaining ${F(q - sum)}.`; return false; }
      if (!$('#alrs', r).value.trim()) { $('#alerr', r).textContent = 'Add a short reason.'; return false; }
      l.allocations = clean.map(x => ({ code: x.code, qty: x.qty })); l.allocReason = $('#alrs', r).value.trim(); l.cost_code = null; S.done.alloc = true; markDirty(); renderForm();
    } }], true);
  draw(r);
  $('#aladd', r).onclick = () => { rows.push({ code: '', qty: '' }); draw(r); };
}
function renderFoot() {
  const t = T(R.id), el = $('#foot'); if (!el) return;
  const list = issues(Object.assign({}, t, R.w)), st = reviewState(t);
  const ss = R.save === 'dirty' ? '<span class="save-state dirty">● Unsaved changes</span>' : R.save === 'saving' ? '<span class="save-state">Saving…</span>' : R.save === 'err' ? '<span class="save-state err">Save failed — your edits are still here</span>' : `<span class="save-state">✓ Saved · v${t.version}</span>`;
  el.innerHTML = `${ss}<span style="flex:1"></span>
    <button class="btn s" id="more" aria-haspopup="true">More…</button>
    ${R.save === 'err' ? '<button class="btn" id="retry">Retry save</button>' : ''}
    <button class="btn" id="save" ${R.dirty ? '' : 'disabled'} title="Ctrl+S">Save draft</button>
    <button class="btn d" id="rej" ${t.status === 'rejected' ? 'disabled' : ''}>Reject…</button>
    <button class="btn p" id="appr" ${list.length || (st === 'approved' && !R.dirty) ? 'disabled' : ''} title="${list.length ? `${list.length} blocker(s) — see Approval blockers` : ''}">${st === 'approved' && !R.dirty ? `Approved v${t.approved.version}` : `Approve v${R.dirty ? t.version + 1 : t.version}`}</button>`;
  $('#save').onclick = () => saveDraft();
  $('#retry') && ($('#retry').onclick = () => saveDraft());
  $('#appr').onclick = approve;
  $('#rej').onclick = () => reasonModal(`Reject ${t.id}`, 'Rejected tickets stay in the register with your reason. They are excluded from outputs. This is an internal decision; nothing is sent to the vendor.', r => { if (R.dirty && !saveDraft(true)) return; t.status = 'rejected'; t.rejected = { by: ME, at: nowISO(), reason: r }; t.versions.push({ v: t.version, at: nowISO(), by: ME, reason: 'Rejected: ' + r, changes: [] }); audit(ME, 'Rejected: ' + r, t.id); toast(`${t.id} rejected`); render(); });
  $('#more').onclick = moreMenu;
}
function moreMenu() {
  const t = T(R.id);
  modal(`${t.id} — more actions`, `<div class="grid" style="gap:8px">
    <button class="btn" data-m="assign">Assign reviewer…</button>
    <button class="btn" data-m="clar">Request clarification (internal task)…</button>
    <button class="btn" data-m="split">Split or merge pages…</button>
    <button class="btn" data-m="vers">View version history</button>
    <button class="btn" data-m="orig">Open original</button></div>`, []);
  const r = $('#modal-root');
  $$('[data-m]', r).forEach(b => b.onclick = () => {
    r.innerHTML = '';
    const m = b.dataset.m;
    if (m === 'assign') modal('Assign reviewer', `<label class="lb" for="as">Reviewer</label><select id="as">${PEOPLE.map(p => `<option ${t.assigned === p ? 'selected' : ''}>${p}</option>`).join('')}</select>`, [{ label: 'Assign', cls: 'p', fn: rr => { t.assigned = $('#as', rr).value; audit(ME, 'Assigned to ' + t.assigned, t.id); toast('Assigned to ' + t.assigned); } }]);
    if (m === 'clar') reasonModal('Request clarification', 'Creates an internal task in Exceptions. Vendor messaging is turned off — nothing is sent outside the team.', v => { S.tasks.push({ id: 'TASK-' + String(take('TASK')).padStart(3, '0'), type: 'Clarification requested', ref: `${t.id} · No. ${t.f.ticketNumber.value || '—'}`, ticket: t.id, project: t.f.project.value, dest: 'Approval', owner: t.assigned || 'Jordan', due: '', created: nowISO(), status: 'open', detail: v }); audit(ME, 'Clarification task created', t.id); toast('Internal clarification task created'); renderShell('review'); });
    if (m === 'split') modal('Split or merge pages', `<p>This ticket's evidence covers ${t.pages.length} page${t.pages.length > 1 ? 's' : ''} of <b>${esc(S.docs[t.docId].name)}</b>:</p>
      <ul class="small">${t.pages.map(p => { const pg = S.pages[p]; const others = (pg.regions || []).filter(r => r.t !== t.id).map(r => r.t); return `<li>Page ${pg.n}${others.length ? ` — shared with ${others.join(', ')}` : ''}</li>`; }).join('')}</ul>
      <div class="note">If a page was split in the wrong place, tell Jordan which ticket and page. Each ticket keeps a link to the page it came from, so nothing is lost.</div>`, []);
    if (m === 'vers') versionsModal(t.id);
    if (m === 'orig') openOriginal(S.pages[t.pages[0]]);
  });
}
function diffSnaps(a, b) {
  const out = [];
  Object.keys(b.f).forEach(k => { const x = a.f[k] || {}, y = b.f[k] || {}; if ((x.value ?? null) !== (y.value ?? null)) out.push(`${LABELS[k]}: ${x.value ?? 'blank'} → ${y.value ?? 'blank'}`); else if (x.uncertain && !y.uncertain) out.push(`${LABELS[k]}: confirmed as read`); });
  const n = Math.max(a.lines.length, b.lines.length);
  for (let i = 0; i < n; i++) {
    const x = a.lines[i], y = b.lines[i];
    if (!x) { out.push(`Line ${i + 1} added`); continue; }
    if (!y) { out.push(`Line ${i + 1} removed`); continue; }
    ['material', 'from', 'to', 'times', 'loads', 'quantity', 'scale', 'unit', 'basis', 'cost_code'].forEach(k => { if ((x[k] ?? null) !== (y[k] ?? null)) out.push(`Line ${i + 1} ${k.replace('_', ' ')}: ${x[k] ?? 'blank'} → ${y[k] ?? 'blank'}`); });
    if (x.loads_uncertain && !y.loads_uncertain) out.push(`Line ${i + 1} load count confirmed`);
    if (x.qty_uncertain && !y.qty_uncertain) out.push(`Line ${i + 1} quantity confirmed`);
    if (JSON.stringify(x.allocations) !== JSON.stringify(y.allocations)) out.push(`Line ${i + 1} allocations: ${y.allocations.length ? y.allocations.map(z => z.code + ' ' + z.qty).join(', ') : 'cleared'}`);
  }
  if ((a.ack.weight || '') !== (b.ack.weight || '')) out.push('Weight difference acknowledged: ' + b.ack.weight);
  if ((a.ack.dup || '') !== (b.ack.dup || '')) out.push('Marked not a duplicate: ' + b.ack.dup);
  return out;
}
function saveDraft(quiet) {
  const t = T(R.id);
  if (!R.dirty) return true;
  if (t.version !== R.base) { staleModal(); return false; }
  const changes = diffSnaps(R.baseSnap, R.w);
  const hadUnc = Object.values(R.baseSnap.f).some(x => x.uncertain) || R.baseSnap.lines.some(l => l.loads_uncertain || l.qty_uncertain);
  t.version++;
  t.f = clone(R.w.f); t.lines = clone(R.w.lines); t.ack = clone(R.w.ack); t.assigned = R.w.assigned;
  if (t.status === 'approved' || t.status === 'rejected') t.status = 'needs_review';
  t.versions.push({ v: t.version, at: nowISO(), by: ME, reason: t.approved ? `Draft saved after approval of v${t.approved.version}` : 'Draft saved', changes });
  audit(ME, `Saved draft v${t.version} (${changes.length} change${changes.length === 1 ? '' : 's'})`, t.id);
  if (hadUnc && !Object.values(t.f).some(x => x.uncertain)) S.done.correct = true;
  R.base = t.version; R.baseSnap = snap(t); R.w = snap(t); R.dirty = false; R.save = 'saved';
  if (!quiet) { toast(`Saved ${t.id} as v${t.version}`); const sc = $('#frm') ? $('#frm').scrollTop : 0; render(); if ($('#frm')) $('#frm').scrollTop = sc; }
  return true;
}
function staleModal() {
  const t = T(R.id), latest = snap(t);
  const theirs = t.versions.filter(v => v.v > R.base).map(v => `<li><b>v${v.v}</b> by ${esc(v.by)} · ${fmtDT(v.at)}${v.changes.length ? ` — ${v.changes.map(esc).join('; ')}` : ''}</li>`).join('');
  const mine = diffSnaps(R.baseSnap, R.w);
  modal('Someone else saved this ticket', `<p>You started from <b>v${R.base}</b>. The ticket is now <b>v${t.version}</b>. Your save was stopped so neither set of edits is silently overwritten.</p>
    <h3>Their changes</h3><ul class="small">${theirs || '<li>No details recorded</li>'}</ul>
    <h3>Your unsaved changes</h3><ul class="small">${mine.map(c => `<li>${esc(c)}</li>`).join('') || '<li>None</li>'}</ul>`, [
    { label: 'Load latest (discard mine)', fn: () => { R.base = t.version; R.baseSnap = latest; R.w = clone(latest); R.dirty = false; R.save = 'saved'; S.done.stale = true; audit(ME, 'Stale edit: loaded latest, discarded own edits', t.id); toast(`Loaded v${t.version}`); render(); } },
    { label: 'Keep mine on top of latest', cls: 'p', fn: () => {
      const merged = clone(latest);
      Object.keys(R.w.f).forEach(k => { if (JSON.stringify(R.w.f[k]) !== JSON.stringify(R.baseSnap.f[k])) merged.f[k] = clone(R.w.f[k]); });
      if (JSON.stringify(R.w.lines) !== JSON.stringify(R.baseSnap.lines)) merged.lines = clone(R.w.lines);
      merged.ack = Object.assign({}, latest.ack, R.w.ack);
      R.base = t.version; R.baseSnap = latest; R.w = merged; S.done.stale = true;
      audit(ME, `Stale edit: re-applied own edits on v${t.version}`, t.id);
      saveDraft(); render();
    } }]);
}
function approve() {
  const t = T(R.id);
  const list = issues(Object.assign({}, t, R.w));
  if (list.length) { toast(`${list.length} blocker${list.length > 1 ? 's' : ''} left — see Approval blockers.`, true); gotoField(list[0].field); return; }
  if (R.dirty && !saveDraft(true)) { renderFoot(); return; }
  const lines = t.lines.map((l, i) => `<li>Line ${i + 1}: ${esc(l.material)} · <b>${esc(l.quantity)} ${UNITS[l.unit]}</b> · ${BASES[l.basis]} · ${l.allocations.length ? l.allocations.map(a => `${esc(a.code)} ${esc(a.qty)}`).join(' + ') : esc(l.cost_code)}</li>`).join('');
  const late = Object.values(S.entries || {}).some(e => e.project === t.f.project.value && e.date === t.f.serviceDate.value && !e.cleared);
  modal(`Approve ${t.id} v${t.version}`, `<dl class="kv"><dt>Vendor</dt><dd>${esc(vName(t.f.vendor.value))}</dd><dt>Ticket No.</dt><dd class="mono">${esc(t.f.ticketNumber.value)}</dd><dt>Project</dt><dd>${esc(pName(t.f.project.value))}</dd><dt>Service date</dt><dd>${fmtD(t.f.serviceDate.value)}</dd></dl>
    <ul class="small">${lines}</ul>
    ${late ? `<div class="note w">Rows for ${fmtD(t.f.serviceDate.value)} were already entered in HCSS or Procore. After approval, Daily Output shows exactly which rows to add or update.</div>` : ''}
    <label class="lb" for="apn" style="margin-top:10px">Approval note</label><textarea id="apn">Reviewed against source</textarea>
    <p class="xs muted">You are approving v${t.version} as ${esc(ME)}. Approval is recorded with version, reviewer, time and note. Nothing is sent to the vendor.</p>`, [{ label: `Approve v${t.version}`, cls: 'p', fn: r => {
      const note = $('#apn', r).value.trim() || 'Reviewed against source';
      t.status = 'approved'; t.approved = { version: t.version, by: ME, at: nowISO(), reason: note }; t.approvedSnap = snap(t);
      t.versions.push({ v: t.version, at: nowISO(), by: ME, reason: `Approved v${t.version}: ${note}`, changes: [] });
      audit(ME, `Approved v${t.version}`, t.id); S.done.approve = true; if (late) S.done.late = true;
      R.baseSnap = snap(t); R.w = snap(t); R.save = 'saved';
      toast(`${t.id} v${t.version} approved`); render();
    } }]);
}
function versionsModal(id) {
  const t = T(id);
  modal(`${t.id} — version history`, `<p class="small muted">Every save creates a new version. Approvals point at one exact version; editing afterwards creates a new unapproved version. The original file is never changed.</p>
    <div class="tw"><table class="t"><thead><tr><th>Version</th><th>When</th><th>Who</th><th>What happened</th></tr></thead><tbody>
    ${t.versions.slice().reverse().map(v => `<tr><td><b>v${v.v}</b>${t.approved && t.approved.version === v.v && /^Approved/.test(v.reason) ? ' <span class="chip ok">approved</span>' : ''}</td><td class="num">${fmtDT(v.at)}</td><td>${esc(v.by)}</td><td>${esc(v.reason)}${v.changes && v.changes.length ? `<div class="sub">${v.changes.map(esc).join('<br>')}</div>` : ''}</td></tr>`).join('')}
    </tbody></table></div>`, [], true);
}
/* keyboard */
document.addEventListener('keydown', e => {
  if ($('#modal-root').innerHTML) return;
  const { route } = parse();
  if (route !== 'review' || !R) return;
  const typing = e.target.matches('input,select,textarea');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (document.activeElement) document.activeElement.blur(); setTimeout(() => saveDraft(), 0); return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'n' || e.key === 'p') {
    const list = issues(Object.assign({}, T(R.id), R.w)); if (!list.length) { toast('No blockers left on this ticket'); return; }
    R.bi = ((R.bi ?? -1) + (e.key === 'n' ? 1 : -1) + list.length) % list.length;
    gotoField(list[R.bi].field); $('#announcer').textContent = `Blocker ${R.bi + 1} of ${list.length}: ${list[R.bi].msg}`;
  }
  if (e.key === ']') $('#nextT') && !$('#nextT').disabled && $('#nextT').click();
  if (e.key === '[') $('#prevT') && !$('#prevT').disabled && $('#prevT').click();
});

/* ---------- REGISTER ---------- */
function regRows() {
  const U = S.ui.reg, rows = [];
  Object.values(S.tickets).filter(inScope).forEach(t => {
    const st = reviewState(t), H = t.f;
    const rec = S.receipts.find(r => r.id === t.receiptId);
    const outRes = st === 'approved' ? (() => { const F0 = t.approvedSnap.f, { hRows, pRows, needs } = entryRows(F0.project.value, F0.serviceDate.value); if (needs.some(n => n.t.id === t.id)) return 'Entry details needed'; const mine = [...hRows.filter(r => r.t === t.id), ...pRows.filter(r => r.tickets.includes(t.id))]; if (!mine.length) return 'Not in output'; const st2 = mine.map(r => entState(r)[0]); return st2.every(x => x === 'done') ? 'Entered in HCSS + Procore' : st2.includes('changed') ? 'Update needed' : st2.some(x => x === 'done') ? 'Partly entered' : 'Not entered yet'; })() : '—';
    const base = { t, st, ticketNumber: H.ticketNumber.value || '', vendor: vName(H.vendor.value), project: H.project.value || '', serviceDate: H.serviceDate.value || '', received: t.receivedAt, receipt: rec?.id || '', truck: H.truckNumber.value || '', reviewer: t.approved ? t.approved.by : (t.assigned || ''), version: t.version, approvedV: st === 'approved' ? t.approved.version : null, outRes };
    if (!t.lines.length) rows.push(Object.assign({ line: 0, material: '', material_raw: '', qty: '', unit: '', basis: '', code: '' }, base));
    t.lines.forEach((l, i) => rows.push(Object.assign({ line: i + 1, material: l.material, material_raw: l.material_raw || '', qty: l.quantity ?? '', unit: l.unit, basis: l.basis, code: l.allocations.length ? l.allocations.map(a => `${a.code} ${a.qty}`).join(' + ') : (l.cost_code || '') }, base)));
  });
  return rows.filter(r => {
    if (U.q) { const q = U.q.trim().toLowerCase(); if (![r.ticketNumber, r.truck, r.vendor, r.project, r.t.id, r.material, r.material_raw].join(' ').toLowerCase().includes(q)) return false; }
    if (U.status !== 'all' && r.st !== U.status) return false;
    if (U.unit !== 'all' && r.unit !== U.unit) return false;
    if (U.basis !== 'all' && r.basis !== U.basis) return false;
    if (U.reviewer && U.reviewer !== 'all' && r.reviewer !== U.reviewer) return false;
    if (U.sFrom && r.serviceDate < U.sFrom) return false; if (U.sTo && r.serviceDate > U.sTo) return false;
    const rd = r.received.slice(0, 10); if (U.rFrom && rd < U.rFrom) return false; if (U.rTo && rd > U.rTo) return false;
    return true;
  }).sort((a, b) => (b.serviceDate.localeCompare(a.serviceDate)) || a.ticketNumber.localeCompare(b.ticketNumber));
}
const csvCell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
VIEWS.register = () => {
  const U = S.ui.reg; U.reviewer = U.reviewer || 'all';
  const rows = regRows(), approvedRows = rows.filter(r => r.st === 'approved' && r.line);
  const reviewers = [...new Set(Object.values(S.tickets).map(t => t.approved ? t.approved.by : t.assigned).filter(Boolean))];
  const opt = (v, cur, l) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`;
  main().innerHTML = `
  <div class="ph"><div><h1>Register</h1><p>One row per ticket line. Service date (work date) and received date are kept separate. Ticket numbers are stored as text, so leading zeros are never dropped.</p></div>
    <div class="act"><button class="btn p" id="csv" ${approvedRows.length ? '' : 'disabled'}>Export approved rows (${approvedRows.length}) to CSV</button></div></div>
  <div class="filters">
    <div class="f wide"><label class="lb" for="rq">Search ticket, truck, vendor, project or material</label><input id="rq" type="search" value="${esc(U.q)}" placeholder="e.g. 6107, Morgan or CSBC"></div>
    <div class="f"><label class="lb" for="rs">Review state</label><select id="rs">${opt('all', U.status, 'All')}${opt('needs_review', U.status, 'Needs review')}${opt('approved', U.status, 'Approved')}${opt('rejected', U.status, 'Rejected')}</select></div>
    <div class="f"><label class="lb" for="ru">Unit</label><select id="ru">${opt('all', U.unit, 'All units')}${Object.entries(UNITS).map(([k, v]) => opt(k, U.unit, v)).join('')}</select></div>
    <div class="f"><label class="lb" for="rb">Basis</label><select id="rb">${opt('all', U.basis, 'All')}${Object.entries(BASES).map(([k, v]) => opt(k, U.basis, v)).join('')}</select></div>
    <div class="f"><label class="lb" for="rr">Reviewer</label><select id="rr">${opt('all', U.reviewer, 'Anyone')}${reviewers.map(p => opt(p, U.reviewer, esc(p))).join('')}</select></div>
    <div class="f"><label class="lb" for="sf">Service date from</label><input id="sf" type="date" value="${U.sFrom}"></div>
    <div class="f"><label class="lb" for="st">Service date to</label><input id="st" type="date" value="${U.sTo}"></div>
    <div class="f"><label class="lb" for="rf">Received from</label><input id="rf" type="date" value="${U.rFrom}"></div>
    <div class="f"><label class="lb" for="rt">Received to</label><input id="rt" type="date" value="${U.rTo}"></div>
    <div class="f"><label class="lb">&nbsp;</label><button class="btn q" id="rclr">Clear filters</button></div>
  </div>
  ${rows.length ? `<div class="tw" role="region" aria-label="Register" tabindex="0"><table class="t"><thead><tr><th>Ticket No.</th><th>Vendor</th><th>Project</th><th>Service date</th><th>Received</th><th>Line</th><th>Material</th><th class="n">Qty</th><th>Unit</th><th>Basis</th><th>Cost code</th><th>State</th><th>Reviewer</th><th>Output</th><th></th></tr></thead><tbody>
  ${rows.map(r => `<tr><td class="mono"><a href="#/review/${r.t.id}">${esc(r.ticketNumber || '—')}</a><div class="sub">${r.t.id}</div></td><td>${esc(r.vendor)}</td><td>${esc(r.project || '—')}</td><td class="num">${fmtD(r.serviceDate)}</td><td class="num">${fmtDT(r.received)}<div class="sub">${esc(r.receipt)}</div></td><td>${r.line || '—'}</td><td>${esc(r.material || '—')}${r.material_raw && r.material_raw !== r.material ? `<div class="sub">On ticket: ${esc(r.material_raw)}</div>` : ''}</td><td class="n num">${r.qty === '' || r.qty == null ? '<span class="sub">blank</span>' : esc(r.qty)}</td><td>${UNITS[r.unit] || '—'}</td><td>${BASES[r.basis] || '—'}</td><td>${esc(r.code || '—')}</td><td>${stateChip(r.t)}</td><td>${esc(r.reviewer || '—')}</td><td class="sub">${esc(r.outRes)}</td><td><button class="btn s q" data-ver="${r.t.id}">Versions</button><button class="btn s q" data-orig="${r.t.id}">Original</button></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="card empty"><b>No rows match these filters.</b>Clear a filter or search for part of a ticket number.</div>`}
  <p class="xs muted" style="margin-top:10px">CSV export includes approved line versions only, within the current project scope and filters. Cells that start with =, +, −, @ or a tab are prefixed so spreadsheets cannot run them as formulas.</p>`;
  const bind = (id, k) => { $(id).onchange = e => { U[k] = e.target.value; render(); }; };
  bind('#rs', 'status'); bind('#ru', 'unit'); bind('#rb', 'basis'); bind('#rr', 'reviewer'); bind('#sf', 'sFrom'); bind('#st', 'sTo'); bind('#rf', 'rFrom'); bind('#rt', 'rTo');
  $('#rq').oninput = e => { U.q = e.target.value; const p = e.target.selectionStart; render(); const i = $('#rq'); i.focus(); i.setSelectionRange(p, p); };
  $('#rclr').onclick = () => { Object.assign(U, { q: '', status: 'all', unit: 'all', basis: 'all', reviewer: 'all', sFrom: '', sTo: '', rFrom: '', rTo: '' }); render(); };
  $$('[data-ver]').forEach(b => b.onclick = () => versionsModal(b.dataset.ver));
  $$('[data-orig]').forEach(b => b.onclick = () => openOriginal(S.pages[T(b.dataset.orig).pages[0]]));
  $('#csv').onclick = () => {
    const head = ['ticket_id', 'approved_version', 'ticket_number', 'vendor', 'project', 'job_number_as_written', 'customer', 'job_location', 'service_date', 'received_at', 'receipt', 'truck', 'truck_type', 'driver', 'start', 'stop', 'total_hours_as_written', 'line', 'material_raw', 'material', 'from', 'to', 'times', 'loads', 'quantity', 'unit', 'basis', 'scale_ticket', 'cost_code_or_allocations', 'foreman_note', 'remarks', 'approved_by', 'approved_at'];
    const body = approvedRows.map(r => { const s = r.t.approvedSnap, l = s.lines[r.line - 1]; const v = k => s.f[k] ? s.f[k].value : ''; return [r.t.id, r.approvedV, v('ticketNumber'), vName(v('vendor')), v('project'), v('jobNumber'), v('customer'), v('jobLocation'), v('serviceDate'), r.received, r.receipt, v('truckNumber'), v('truckType'), v('driverName'), v('start'), v('end'), v('totalHours'), r.line, l.material_raw, l.material, l.from, l.to, l.times, l.loads, l.quantity, l.unit, l.basis, l.scale, l.allocations.length ? l.allocations.map(a => `${a.code}:${a.qty}`).join(' | ') : l.cost_code, v('foremanNote'), v('remarks'), r.t.approved.by, r.t.approved.at].map(csvCell).join(','); });
    const blob = new Blob(['\ufeff' + [head.join(','), ...body].join('\r\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ticket-desk-approved-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
    S.done.register = true; audit(ME, `Exported ${approvedRows.length} approved rows to CSV`); toast(`Exported ${approvedRows.length} approved row${approvedRows.length === 1 ? '' : 's'}`);
  };
  S.done.registerSeen = true;
};

/* ---------- DAILY OUTPUT ---------- */
/* ---------- HCSS + Procore entry (one approved ticket → HeavyJob Material-Sub-Expense line(s) + Procore Daily Log Manpower) ---------- */
const HCSS_CC = [['40000002', 'TRAILER'], ['90000013', 'PCO 011-AD15 RELOCATION'], ['90000014', 'CE 017-POTHOLING FOR WATER SOURCE'], ['90000015', 'CE 018-PLUMBING TRENCH - SPLASH PARK'], ['90000016', 'CE 019-RAISING SCL TRANSFORMER VAULT'], ['90000017', 'PCO 020-SLIDE EXCAVATION'], ['90000018', 'CE 021-ADA RAMP BORROW IMPORT'], ['90000019', 'PCO 022-ECO BLOCK SHORING WALL'], ['90000020', 'CE 022-MOUND CURB DEMO REGRADE'], ['90000021', 'PCO 023-SHOTCRETE MOUND REGRADING'], ['90000022', 'PCO 024-REDIG FOOTING LAID INCORRECT'], ['90000023', 'Storage Tank Install'], ['90000024', 'Diverter Structure Install'], ['90000025', 'Turnstone Plumbing Install'], ['90000026', 'Haul Material to Hillwood'], ['90000027', 'ADA LANDSCAPE SLOPE REGRADE'], ['90000028', 'Landscape area drain fix']];
const MSE0 = {
  '2AGGQAPG': ['Granite Aggregate Pea Gravel', 'M', 'TN', 36.15], '4ATCO': ['ATCO', 'S', 'DL', 1], '4ULTRABLOCK': ['EcoBlocks'], '4UNITED': ['United Rentals'], '4UR': ['United Rentals'], '4VACT': ['Vactor Services'], '4VCTR': ['Vactor Sub'], '4WHITECAP': ['Whitecap'], '4WTC': ['WA Traffic Control'],
  '6LACY': ['Harbor Trucking'], '6TCB': ['Ridgeline Hauling Trucking', 'S', 'HR', 220], '6TCBDT': ['Ridgeline Hauling Trucking DT'], '6TCBOT': ['Ridgeline Hauling Trucking OT', 'S', 'HR', 250], '6TCKASPRUB': ['Truck Asphalt Rubble'],
  '6TCT': ['Alder Trucking'], '6TCTOT': ['Alder Trucking Over Time'], '6TEST': ['Open Road Trucking'], '6TESTOT': ['Open Road Trucking Over Time'], '6TGNW': ['Evergreen Excavation Excavation'], '6TTRB': ['Valley Bros Trucking', 'S', 'HR', 215]
};
const VEND0 = {
  'V-RIDGE': { code: 'RIDGELINE', procore: 'Ridgeline Hauling Trucking', reg: '6TCB', ot: '6TCBOT', dt: '6TCBDT' },
  'V-HARBOR': { code: '', procore: '', reg: '6LACY' },
  'V-VALLEY': { code: 'VALEYBROS', procore: 'No Company', reg: '6TTRB' },
  'V-GRANITE': { code: 'GRANITEAGG', procore: '', reg: '', mat: '2AGGQAPG' },
  'V-ALDER': { code: '', procore: '', reg: '6TCT', ot: '6TCTOT' },
  'V-OPENROAD': { code: '', procore: '', reg: '6TEST', ot: '6TESTOT' },
  'V-EVX': { code: '', procore: '', reg: '6TGNW' },
  'V-MORGAN': { code: '', procore: '', reg: '' }, 'V-BIRCH': { code: '', procore: '', reg: '' }, 'V-FOOTHILL': { code: '', procore: '', reg: '' }, 'V-FASTLANE': { code: '', procore: '', reg: '' }
};
const LOCS0 = ['Riverside Park', 'Material Pits > Granite Aggregate'];
const COMPANIES0 = ['Regional Heavy-Civil Contractor, LLC', 'Ridgeline Hauling Trucking', 'No Company'];
Object.assign(VENDORS, {
  'V-VALLEY': { id: 'V-VALLEY', name: 'Valley Bros Trucking', short: 'Valley Bros', aliases: ['Valley', 'Valey Bros', 'VALEYBROS'] },
  'V-GRANITE': { id: 'V-GRANITE', name: 'Granite Aggregate', short: 'Granite Aggregate', aliases: ['Granite Agg', 'GRANITEAGG'] },
  'V-ALDER': { id: 'V-ALDER', name: 'Alder Trucking', short: 'Alder', aliases: ['Alder'] },
  'V-OPENROAD': { id: 'V-OPENROAD', name: 'Open Road Trucking', short: 'Open Road', aliases: ['Open Road'] },
  'V-EVX': { id: 'V-EVX', name: 'Evergreen Excavation Excavation', short: 'Evergreen Excavation', aliases: ['EVX', 'Evergreen'] }
});
function migrateHcss() {
  S.hcss = S.hcss || {};
  const H = S.hcss;
  if (!H.mse) { H.mse = {}; Object.entries(MSE0).forEach(([k, v]) => H.mse[k] = { d: v[0], type: v[1] || '', unit: v[2] || '', cost: v[3] ?? null }); }
  if (!H.vend) H.vend = clone(VEND0);
  Object.keys(VEND0).forEach(k => { if (!H.vend[k]) H.vend[k] = clone(VEND0[k]); });
  if (!H.locs) H.locs = LOCS0.slice();
  if (!H.companies) H.companies = COMPANIES0.slice();
  S.entries = S.entries || {}; S.entryLog = S.entryLog || [];
  const list = CODES['TC-2507'] = CODES['TC-2507'] || [];
  HCSS_CC.forEach(c => { if (!list.find(x => x[0] === c[0])) list.push(c.slice()); });
  const w = list.find(x => x[0] === '8000017'); if (w && /Description needed/.test(w[1])) w[1] = 'As written on Harbor 7632 — not in the HCSS list (HCSS codes are 8 digits)';
  list.sort((a, b) => a[0].localeCompare(b[0]));
  S.codes = CODES;
}
const hcssCodeOK = c => /^\d{8}$/.test(c || '') && !!(CODES['TC-2507'] || []).find(x => x[0] === c);
const ccDesc = c => ((CODES['TC-2507'] || []).find(x => x[0] === c) || [])[1] || '';
const mseOf = k => (S.hcss.mse || {})[k] || null;
const vmap = v => (S.hcss.vend || {})[v] || {};
const n2 = x => { const v = Number(String(x ?? '').replace(/,/g, '')); return x === '' || x == null || !isFinite(v) ? null : v; };
const money = v => v == null ? '' : '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qfmt = v => v == null ? '' : v.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
function hrsNum(s) {
  if (s == null || s === '') return null; s = String(s).trim();
  let m = s.match(/^(\d+)\s+(\d)\/(\d)$/); if (m) return +m[1] + (+m[2]) / (+m[3]);
  m = s.match(/^(\d+(?:\.\d+)?)\s*h?$/i); if (m) return +m[1];
  return null;
}
function ticketHours(H) {
  const t = hrsNum(H.totalHours.value); if (t != null) return { v: t, how: `total hours written: ${H.totalHours.value}` };
  if (H.totalHours.value) return { v: null, how: `total hours are written as “${H.totalHours.value}”` };
  const s = H.start.value, e = H.end.value;
  if (s && e) { const [a, b] = s.split(':').map(Number), [c, d] = e.split(':').map(Number); let mm = (c * 60 + d) - (a * 60 + b); if (mm < 0 && H.rollover.value) mm += 1440; if (mm > 0) { const br = Number(H.breakHrs.value || 0); const v = Math.round((mm / 60 - br) * 100) / 100; return { v, how: `start ${s} to stop ${e}${br ? ` less ${br} h break` : ''}` }; } }
  return { v: null, how: H.start.value ? `only a start time (${H.start.value}) is written` : 'no hours are written' };
}
function suggestPost(H, lines) {
  const v = H.vendor.value, map = vmap(v), out = { h: [], p: null, ack: {}, src: 'suggested' };
  if (v === 'V-CASCADE CIVIL') { out.own = true; return out; }
  const hr = ticketHours(H); out.hrsHow = hr.how;
  const codes = [...new Set(lines.flatMap(l => l.allocations.length ? l.allocations.map(a => a.code) : [l.cost_code]).filter(Boolean))];
  const truck = H.truckNumber.value || '', no = H.ticketNumber.value || '';
  const loads = lines.reduce((a, l) => a + (n2(l.loads) || 0), 0);
  const tonL = lines.filter(l => l.unit === 'short_ton' && n2(l.quantity) != null);
  const tons = tonL.reduce((a, l) => a + n2(l.quantity), 0), tonLoads = tonL.reduce((a, l) => a + (n2(l.loads) || 0), 0);
  const it = mseOf(map.reg) || {};
  (codes.length ? codes : ['']).forEach((cc, i) => out.h.push({ kind: 'truck', cc, mse: map.reg || '', unit: it.unit || 'HR', qty: codes.length > 1 ? '' : (hr.v ?? ''), cost: it.cost ?? '', vendor: map.code || '', tm: /^9/.test(cc), loads: '', note: `${loads ? loads + ' ' : ''}Truck ${truck} Ticket ${no}`, inv: '' }));
  if (tons > 0) {
    const mats = [...new Set(tonL.map(l => l.material))];
    out.h.push({ kind: 'material', cc: codes[0] || '', mse: '', unit: 'TN', qty: tons.toFixed(2), cost: '', vendor: '', tm: /^9/.test(codes[0] || ''), loads: '', note: `${tonLoads ? tonLoads + ' ' : ''}${tons.toFixed(2)} TN ${mats.join(', ')}`, inv: '' });
  }
  const fromQA = lines.some(l => /granite ag/i.test(l.from || ''));
  out.p = { company: map.procore || '', workers: '1', hours: hr.v ?? '', location: fromQA ? 'Material Pits > Granite Aggregate' : '', comment: `Truck ${truck} Ticket ${no}${tons > 0 ? `\n${tonLoads} loads brought in totaling ${tons.toFixed(2)}` : loads ? `\n${loads} loads` : ''}`, attach: true };
  return out;
}
function factsOf(t) { return t.status === 'approved' && t.approvedSnap ? t.approvedSnap : t; }
function effPost(t, w) { if (t.post) return t.post; const b = w || factsOf(t); return suggestPost(b.f, b.lines); }
function postIssues(t, P) {
  const out = [], H = factsOf(t).f, vn = vName(H.vendor.value), map = vmap(H.vendor.value);
  if (P.own) { out.push({ id: 'OWN', sev: 'block', msg: `Cascade Civil’s own truck. This is not a Material-Sub-Expense line and the crew is already on the Cascade Civil Manpower row. Confirm with Jordan where own-truck tickets go (HCSS time card only?).` }); return out; }
  P.h.forEach((l, i) => {
    const n = `HCSS line ${i + 1}${l.kind === 'material' ? ' (material)' : ''}`;
    if (!l.cc) out.push({ id: `H${i}cc`, sev: 'block', f: `h${i}.cc`, msg: `${n}: cost code needed (8-digit HCSS code)` });
    else if (!hcssCodeOK(l.cc)) out.push({ id: `H${i}ccv`, sev: 'block', f: `h${i}.cc`, msg: `${n}: cost code ${l.cc} is not in the HCSS cost code list for TC2507` });
    if (!l.mse) out.push({ id: `H${i}m`, sev: 'block', f: `h${i}.mse`, msg: l.kind === 'material' ? `${n}: material item code needed — who supplied the material and which HCSS item (for example 2AGGQAPG Granite Aggregate Pea Gravel)?` : `${n}: item code needed — ${vn} is not in the HCSS Material-Sub-Expense list seen so far` });
    else if (!mseOf(l.mse)) out.push({ id: `H${i}mv`, sev: 'block', f: `h${i}.mse`, msg: `${n}: item code ${l.mse} is not in the HCSS list` });
    if (!l.unit) out.push({ id: `H${i}u`, sev: 'block', f: `h${i}.unit`, msg: `${n}: unit needed (HR, TN, LD…)` });
    if (n2(l.qty) == null) out.push({ id: `H${i}q`, sev: 'block', f: `h${i}.qty`, msg: `${n}: installed quantity needed${l.kind === 'truck' ? ` — on the ticket, ${P.hrsHow || 'no hours are written'}` : ''}` });
    if (n2(l.cost) == null) out.push({ id: `H${i}c`, sev: 'block', f: `h${i}.cost`, msg: `${n}: unit cost needed${l.mse ? ` — no rate on file for ${l.mse}` : ''}` });
    if (!l.vendor) out.push({ id: `H${i}v`, sev: 'block', f: `h${i}.vendor`, msg: `${n}: HCSS vendor code needed` });
  });
  if (map.ot && P.h.some(l => l.kind === 'truck' && l.mse === map.reg) && !P.ack.ot) out.push({ id: 'OT', sev: 'block', f: 'ot', msg: `${vn} has a regular code (${map.reg}${mseOf(map.reg)?.cost != null ? ` $${mseOf(map.reg).cost}/HR` : ''}) and an overtime code (${map.ot}${mseOf(map.ot)?.cost != null ? ` $${mseOf(map.ot).cost}/HR` : ''}). Split the hours, or confirm all are regular.` });
  const p = P.p || {};
  if (!p.company) out.push({ id: 'Pco', sev: 'block', f: 'p.company', msg: `Procore company needed — pick it from the Procore directory, or “No Company” as used for Valley Bros` });
  if (n2(p.workers) == null) out.push({ id: 'Pw', sev: 'block', f: 'p.workers', msg: 'Procore workers needed (one per truck)' });
  if (n2(p.hours) == null) out.push({ id: 'Ph', sev: 'block', f: 'p.hours', msg: 'Procore hours needed' });
  if (!p.location) out.push({ id: 'Pl', sev: 'block', f: 'p.location', msg: 'Procore location needed (for example Material Pits > Granite Aggregate)' });
  const th = P.h.filter(l => l.kind === 'truck').reduce((a, l) => a + (n2(l.qty) || 0), 0);
  if (th && n2(p.hours) != null && Math.abs(th - n2(p.hours)) > 0.001 && !P.ack.hrs) out.push({ id: 'HRS', sev: 'warn', f: 'hrs', msg: `HCSS hours (${th}) and Procore hours (${n2(p.hours)}) differ. On Sept 1 the Valley trucks were 7 HR in HCSS and 8 in Procore — confirm which is meant.` });
  return out;
}
const postBlocks = (t, P) => postIssues(t, P).filter(i => i.sev === 'block');

/* ---------- ticket images for Procore attachments ---------- */
function imgName(t, i, n) { const H = factsOf(t).f; const v = (VENDORS[H.vendor.value]?.short || 'Vendor').replace(/[^A-Za-z0-9]+/g, '-'); return `${H.serviceDate.value || 'undated'}_${v}_Truck-${(H.truckNumber.value || 'x').replace(/[^A-Za-z0-9]+/g, '')}_Ticket-${(H.ticketNumber.value || 'x').replace(/[^A-Za-z0-9]+/g, '')}${n > 1 ? `_p${i + 1}` : ''}.jpg`; }
function loadImg(src) { return new Promise((ok, no) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = no; im.src = src; }); }
async function ticketImages(t) {
  const out = [];
  for (let i = 0; i < t.pages.length; i++) {
    const pg = S.pages[t.pages[i]]; if (!pg) continue;
    const name = imgName(t, i, t.pages.length);
    if (pg.kind === 'scan') {
      try {
        const im = await loadImg(pg.url), reg = (pg.regions || []).find(r => r.t === t.id) || { y0: 0, h: pg.h };
        const sx = im.naturalWidth / pg.w, sy = im.naturalHeight / pg.h, y = Math.max(0, reg.y0 * sy), h = Math.min(im.naturalHeight - y, reg.h * sy);
        const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = Math.round(h); c.getContext('2d').drawImage(im, 0, y, im.naturalWidth, h, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.9); out.push({ name, url });
      } catch (e) { out.push({ name, url: pg.url }); }
    } else out.push({ name: pg.kind === 'pdf' ? name.replace(/\.jpg$/, '.pdf') : name, url: blobUrl(pg) });
  }
  return out;
}
async function downloadImages(ids) { let n = 0; for (const id of ids) { for (const x of await ticketImages(T(id))) { const a = document.createElement('a'); a.href = x.url; a.download = x.name; document.body.appendChild(a); a.click(); a.remove(); n++; await new Promise(r => setTimeout(r, 250)); } } toast(`Downloaded ${n} ticket image${n === 1 ? '' : 's'} for Procore`); }
function copyText(s, what) {
  const done = () => toast(`${what} copied`);
  const fb = () => { const ta = document.createElement('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copy was blocked — select the text and copy it', true); } ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(done, fb); else fb();
}

/* ---------- Review: HCSS & Procore entry section ---------- */
function postSection() {
  const t = T(R.id), P = effPost(t, R.w), iss = postIssues(t, P), H = R.w.f;
  const cc = (CODES[H.project.value] || CODES['TC-2507'] || []).filter(c => hcssCodeOK(c[0]));
  const dl = `<datalist id="dl-mse">${Object.entries(S.hcss.mse).map(([k, v]) => `<option value="${esc(k)}">${esc(v.d)}${v.unit ? ' · ' + esc(v.unit) : ''}${v.cost != null ? ' · $' + v.cost : ''}</option>`).join('')}</datalist>
    <datalist id="dl-loc">${S.hcss.locs.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="dl-co">${S.hcss.companies.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    <datalist id="dl-hv">${[...new Set(Object.values(S.hcss.vend).map(v => v.code).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join('')}</datalist>`;
  const bad = f => iss.some(i => i.f === f && i.sev === 'block') ? 'style="border-color:#D9A93A;background:#FFFBEF"' : '';
  if (P.own) return `<div class="sec" id="post"><h3>HCSS &amp; Procore entry</h3><div class="b"><div class="note w">${esc(iss[0].msg)}</div></div></div>`;
  const p = P.p || {};
  const amt = l => { const q = n2(l.qty), c = n2(l.cost); return q != null && c != null ? money(Math.round(q * c * 100) / 100) : '—'; };
  return `<div class="sec" id="post"><h3>HCSS &amp; Procore entry <span class="chip ${t.post ? 'ok' : 'i'}">${t.post ? 'Edited by reviewer' : 'Filled in from the ticket and vendor list'}</span></h3><div class="b">${dl}
    <p class="small muted" style="margin:0 0 8px">One approved ticket becomes the HeavyJob Material-Sub-Expense line${P.h.length === 1 ? '' : 's'} and the Procore Daily Log Manpower entry below. Changes here save right away and do not change the approved ticket.</p>
    <h4 class="small" style="margin:6px 0">HCSS HeavyJob · Material-Sub-Expense · Install</h4>
    ${P.h.map((l, i) => `<div class="hl" style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px">
      <div class="row" style="justify-content:space-between;margin-bottom:6px"><b class="small">Line ${i + 1} · ${l.kind === 'material' ? 'Material' : 'Trucking'}${mseOf(l.mse) ? ' · ' + esc(mseOf(l.mse).d) : ''}</b><button class="btn s q d" data-phdel="${i}" aria-label="Remove HCSS line ${i + 1}">Remove</button></div>
      <div class="grid g3">
        <div style="grid-column:span 2"><label class="lb" for="ph${i}cc">Cost code</label><select id="ph${i}cc" data-ph="${i}|cc" ${bad(`h${i}.cc`)}><option value="">Choose…</option>${cc.map(c => `<option value="${c[0]}" ${l.cc === c[0] ? 'selected' : ''}>${c[0]} · ${esc(c[1])}</option>`).join('')}${l.cc && !hcssCodeOK(l.cc) ? `<option selected value="${esc(l.cc)}">${esc(l.cc)} (not in HCSS list)</option>` : ''}</select></div>
        <div><label class="lb" for="ph${i}mse">Matl-Sub-Exp</label><input id="ph${i}mse" list="dl-mse" data-ph="${i}|mse" value="${esc(l.mse)}" ${bad(`h${i}.mse`)}></div>
        <div><label class="lb" for="ph${i}unit">Unit</label><input id="ph${i}unit" data-ph="${i}|unit" value="${esc(l.unit)}" ${bad(`h${i}.unit`)}></div>
        <div><label class="lb" for="ph${i}qty">Inst qty</label><input id="ph${i}qty" data-ph="${i}|qty" value="${esc(l.qty)}" inputmode="decimal" ${bad(`h${i}.qty`)}></div>
        <div><label class="lb" for="ph${i}cost">Unit cost</label><input id="ph${i}cost" data-ph="${i}|cost" value="${esc(l.cost)}" inputmode="decimal" ${bad(`h${i}.cost`)}></div>
        <div><label class="lb" for="ph${i}vendor">Vendor</label><input id="ph${i}vendor" list="dl-hv" data-ph="${i}|vendor" value="${esc(l.vendor)}" ${bad(`h${i}.vendor`)}></div>
        <div><label class="lb" for="ph${i}inv">Invoice #</label><input id="ph${i}inv" data-ph="${i}|inv" value="${esc(l.inv)}" placeholder="Vendor invoice"></div>
        <div><label class="lb">Inst amt</label><div class="num" style="padding:8px 0"><b>${amt(l)}</b></div></div>
        <div style="grid-column:span 2"><label class="lb" for="ph${i}note">Note</label><input id="ph${i}note" data-ph="${i}|note" value="${esc(l.note)}"></div>
        <div><label class="lb" for="ph${i}loads">Loads</label><input id="ph${i}loads" data-ph="${i}|loads" value="${esc(l.loads)}" inputmode="numeric"></div>
        <div style="grid-column:1/-1"><label class="row small" style="gap:6px"><input type="checkbox" data-ph="${i}|tm" ${l.tm ? 'checked' : ''}> T&amp;M</label></div>
      </div></div>`).join('')}
    <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn s" data-phadd="truck">+ Trucking line</button><button class="btn s" data-phadd="material">+ Material line</button>${vmap(H.vendor.value).ot ? `<button class="btn s" data-phadd="ot">+ Overtime line (${esc(vmap(H.vendor.value).ot)})</button>` : ''}${t.post ? '<button class="btn s q" id="prb">Refill from ticket</button>' : ''}</div>
    <p class="xs muted" style="margin:6px 0 0">Hours on the ticket: ${esc(P.hrsHow || '—')}. Note format follows HeavyJob: loads, truck and ticket (“3 Truck 003 Ticket 0003672”). Invoice # is the vendor’s invoice number once it arrives.</p>
    <h4 class="small" style="margin:14px 0 6px">Procore · Daily Log · Manpower</h4>
    <div class="grid g3"><div><label class="lb" for="pp-company">Company</label><input id="pp-company" list="dl-co" data-pp="company" value="${esc(p.company)}" ${bad('p.company')}></div>
      <div><label class="lb" for="pp-workers">Workers</label><input id="pp-workers" data-pp="workers" value="${esc(p.workers)}" inputmode="numeric" ${bad('p.workers')}></div>
      <div><label class="lb" for="pp-hours">Hours</label><input id="pp-hours" data-pp="hours" value="${esc(p.hours)}" inputmode="decimal" ${bad('p.hours')}></div>
      <div style="grid-column:span 2"><label class="lb" for="pp-location">Location</label><input id="pp-location" list="dl-loc" data-pp="location" value="${esc(p.location)}" ${bad('p.location')}></div>
      <div><label class="lb">Total hours</label><div class="num" style="padding:8px 0">${n2(p.workers) != null && n2(p.hours) != null ? (n2(p.workers) * n2(p.hours)) : '—'}</div></div>
      <div style="grid-column:1/-1"><label class="lb" for="pp-comment">Comments</label><textarea id="pp-comment" data-pp="comment" rows="2">${esc(p.comment)}</textarea></div>
      <div style="grid-column:1/-1"><label class="row small" style="gap:6px"><input type="checkbox" data-pp="attach" ${p.attach !== false ? 'checked' : ''}> Attach the ticket image in Procore</label><button class="btn s q" id="pimg" style="margin-top:4px">Download ticket image</button></div></div>
    <p class="xs muted" style="margin:6px 0 0">Tickets for the same company, location and hours on the same day are combined into one Manpower row in Daily Output, the way the Sept 1 log shows two Valley trucks on one row.</p>
    <h4 class="small" style="margin:14px 0 6px">Before this goes into HCSS and Procore</h4>
    ${iss.length ? `<ul class="blk">${iss.map(i => `<li><span class="chip ${i.sev === 'block' ? 'w' : 'i'}" aria-hidden="true">${i.sev === 'block' ? '!' : 'i'}</span><span>${esc(i.msg)}</span>${i.id === 'OT' ? '<button class="btn s" id="ackot">All regular…</button>' : i.id === 'HRS' ? '<button class="btn s" id="ackhrs">Keep both…</button>' : ''}</li>`).join('')}</ul>` : '<div class="note ok">Ready. Once the ticket is approved it shows in Daily Output for both systems.</div>'}
    ${P.ack.ot ? `<div class="xs muted">Overtime: ${esc(P.ack.ot)}</div>` : ''}${P.ack.hrs ? `<div class="xs muted">Hours difference: ${esc(P.ack.hrs)}</div>` : ''}
  </div></div>`;
}
function postEdit(fn, what) {
  const t = T(R.id);
  if (!t.post) { t.post = clone(effPost(t, R.w)); t.post.src = 'edited'; }
  fn(t.post); audit(ME, `HCSS/Procore entry: ${what}`, t.id); persist();
  const sc = $('#frm') ? $('#frm').scrollTop : 0; renderForm(); if ($('#frm')) $('#frm').scrollTop = sc;
}
function bindPost() {
  const el = $('#post'); if (!el) return; const t = T(R.id);
  $$('[data-ph]', el).forEach(inp => inp.addEventListener('change', () => {
    const [i, k] = inp.dataset.ph.split('|'); let v = inp.type === 'checkbox' ? inp.checked : inp.value.trim();
    if ((k === 'qty' || k === 'cost' || k === 'loads') && v !== '' && n2(v) == null) { toast('Enter a number, e.g. 7 or 215.00', true); inp.value = effPost(t, R.w).h[+i][k] ?? ''; return; }
    if (k === 'mse') v = v.toUpperCase();
    postEdit(P => { const l = P.h[+i]; l[k] = v; if (k === 'mse' && mseOf(v)) { const it = mseOf(v); if (it.unit) l.unit = it.unit; if (it.cost != null) l.cost = it.cost; } if (k === 'cc') l.tm = /^9/.test(v); }, `HCSS line ${+i + 1} ${k} = ${v}`);
  }));
  $$('[data-pp]', el).forEach(inp => inp.addEventListener('change', () => {
    const k = inp.dataset.pp; let v = inp.type === 'checkbox' ? inp.checked : inp.value.trim();
    if ((k === 'workers' || k === 'hours') && v !== '' && n2(v) == null) { toast('Enter a number', true); return; }
    postEdit(P => { P.p = P.p || {}; P.p[k] = v; if (k === 'location' && v && !S.hcss.locs.includes(v)) S.hcss.locs.push(v); if (k === 'company' && v && !S.hcss.companies.includes(v)) S.hcss.companies.push(v); }, `Procore ${k} = ${v === true ? 'yes' : v === false ? 'no' : v}`);
  }));
  $$('[data-phdel]', el).forEach(b => b.onclick = () => postEdit(P => P.h.splice(+b.dataset.phdel, 1), `removed HCSS line ${+b.dataset.phdel + 1}`));
  $$('[data-phadd]', el).forEach(b => b.onclick = () => {
    const k = b.dataset.phadd, map = vmap(R.w.f.vendor.value), base = effPost(t, R.w).h[0] || {};
    postEdit(P => {
      if (k === 'ot') { const it = mseOf(map.ot) || {}; P.h.push({ kind: 'truck', cc: base.cc || '', mse: map.ot, unit: it.unit || 'HR', qty: '', cost: it.cost ?? '', vendor: map.code || '', tm: !!base.tm, loads: '', note: base.note || '', inv: '' }); P.ack.ot = P.ack.ot || 'Split into regular and overtime lines'; }
      else P.h.push({ kind: k, cc: base.cc || '', mse: k === 'truck' ? (map.reg || '') : '', unit: k === 'material' ? 'TN' : 'HR', qty: '', cost: '', vendor: k === 'truck' ? (map.code || '') : '', tm: !!base.tm, loads: '', note: '', inv: '' });
    }, `added ${k === 'ot' ? 'overtime' : k} line`);
  });
  $('#prb') && ($('#prb').onclick = () => modal('Refill from the ticket?', '<p>This replaces the HCSS and Procore entry with values taken fresh from the ticket and vendor list. Your edits to this entry are cleared.</p>', [{ label: 'Refill', cls: 'p', fn: () => { t.post = null; audit(ME, 'HCSS/Procore entry refilled from ticket', t.id); persist(); renderForm(); } }]));
  $('#ackot') && ($('#ackot').onclick = () => reasonModal('Confirm all hours are regular', 'Say why no overtime line is needed (for example, “Under 8 hours — all regular”).', r => postEdit(P => { P.ack.ot = r; }, 'overtime split confirmed')));
  $('#ackhrs') && ($('#ackhrs').onclick = () => reasonModal('Keep different hours', 'Say why HCSS and Procore hours differ (for example, “HCSS bills 7 per the rate agreement; Procore logs 8 on site”).', r => postEdit(P => { P.ack.hrs = r; }, 'hours difference kept')));
  $('#pimg') && ($('#pimg').onclick = () => downloadImages([t.id]));
}

/* ---------- Daily Output: rows for HCSS and Procore ---------- */
function outDates(project) { return [...new Set(Object.values(S.tickets).filter(t => factsOf(t).f.project.value === project && factsOf(t).f.serviceDate.value).map(t => factsOf(t).f.serviceDate.value))].sort().reverse(); }
const isApproved = t => t.status === 'approved' && t.approved && t.approved.version === t.version;
function entryRows(project, date) {
  const hRows = [], groups = {}, needs = [], excluded = [];
  Object.values(S.tickets).forEach(t => {
    const F0 = factsOf(t).f; if (F0.project.value !== project || F0.serviceDate.value !== date || t.status === 'rejected') return;
    if (!isApproved(t)) { excluded.push({ t, why: t.approved ? `approved v${t.approved.version} was edited (now v${t.version}) — re-approve to include it` : 'not approved yet' }); return; }
    const P = effPost(t), bl = postBlocks(t, P);
    if (bl.length) { needs.push({ t, bl }); return; }
    P.h.forEach((l, i) => {
      const q = n2(l.qty), c = n2(l.cost), it = mseOf(l.mse) || {};
      const row = { key: `H|${t.id}|${i}`, t: t.id, num: F0.ticketNumber.value, cc: l.cc, ccd: ccDesc(l.cc), mse: l.mse, msed: it.d || '', type: it.type || (l.kind === 'material' ? 'M' : 'S'), unit: l.unit, cost: c, qty: q, amt: q != null && c != null ? Math.round(q * c * 100) / 100 : null, vendor: l.vendor, tm: !!l.tm, loads: l.loads || '', note: l.note || '', inv: l.inv || '' };
      row.sig = J([row.cc, row.mse, row.unit, row.cost, row.qty, row.vendor, row.tm, row.loads, row.note, row.inv]); hRows.push(row);
    });
    const p = P.p, k = `P|${project}|${date}|${p.company}|${p.location}|${n2(p.hours)}`;
    const g = groups[k] = groups[k] || { key: k, company: p.company, location: p.location, hours: n2(p.hours), workers: 0, comments: [], tickets: [], attach: [] };
    g.workers += n2(p.workers); g.comments.push(p.comment || ''); g.tickets.push(t.id); if (p.attach !== false) g.attach.push(t.id);
  });
  const pRows = Object.values(groups).map(g => Object.assign(g, { total: g.workers * g.hours, comment: g.comments.filter(Boolean).join('\n'), sig: J([g.workers, g.hours, g.comments, g.attach]) }));
  const keys = new Set([...hRows, ...pRows].map(r => r.key));
  const orphans = Object.entries(S.entries).filter(([k, e]) => !keys.has(k) && e.project === project && e.date === date && !e.cleared).map(([k, e]) => Object.assign({ key: k }, e));
  return { hRows, pRows, needs, excluded, orphans };
}
function entState(r) {
  const e = S.entries[r.key];
  if (!e) return ['new', '<span class="chip i">Not entered yet</span>'];
  if (e.sig === r.sig) return ['done', `<span class="chip ok">Entered${e.ref ? ' · ' + esc(e.ref) : ''}</span>`];
  return ['changed', '<span class="chip w">Changed — update it</span>'];
}
function readyForOutput() {
  const set = new Set();
  Object.values(S.tickets).forEach(t => { if (!isApproved(t)) return; const F0 = t.approvedSnap.f; const { hRows, pRows, needs } = entryRows(F0.project.value, F0.serviceDate.value); if (needs.some(n => n.t.id === t.id)) { set.add(t.id); return; } if (hRows.some(r => r.t === t.id && entState(r)[0] !== 'done') || pRows.some(r => r.tickets.includes(t.id) && entState(r)[0] !== 'done')) set.add(t.id); });
  return [...set];
}
const H_COLS = ['Cost Code', 'Desc', 'Matl-Sub-Exp', 'Desc', 'Cost Type', 'Unit', 'Unit Cost', 'Inst Qty', 'Inst Amt', 'Vendor', 'T&M', 'Loads', 'Note', 'Invoice #'];
const hVals = r => [r.cc, r.ccd, r.mse, r.msed, r.type, r.unit, r.cost != null ? r.cost.toFixed(3) : '', r.qty != null ? r.qty.toFixed(3) : '', r.amt != null ? r.amt.toFixed(2) : '', r.vendor, r.tm ? 'Y' : 'N', r.loads, r.note, r.inv];
const P_COLS = ['Company', 'Workers', 'Hours', 'Total Hours', 'Location', 'Comments'];
const pVals = r => [r.company, r.workers, r.hours, r.total, r.location, r.comment];
VIEWS.output = () => {
  const U = S.ui.out;
  if (S.ui.scope !== 'all') U.project = S.ui.scope;
  const dates = outDates(U.project); if (!dates.includes(U.date)) U.date = dates[0] || U.date;
  const { hRows, pRows, needs, excluded, orphans } = entryRows(U.project, U.date);
  const hAmt = hRows.reduce((a, r) => a + (r.amt || 0), 0), pW = pRows.reduce((a, r) => a + r.workers, 0), pH = pRows.reduce((a, r) => a + r.total, 0);
  const left = [...hRows, ...pRows].filter(r => entState(r)[0] !== 'done').length;
  const log = (S.entryLog || []).filter(l => l.project === U.project && l.date === U.date);
  main().innerHTML = `
  <div class="ph"><div><h1>Daily Output</h1><p>Everything approved for one day, laid out the way it goes into HCSS HeavyJob and the Procore Daily Log. Enter each row, then mark it entered. If a ticket changes or arrives late, the row shows exactly what to update.</p></div></div>
  <div class="note" style="margin-bottom:14px"><b>Enter it in both systems from here.</b> Copy a row, or download the HCSS lines and ticket images, then press “Mark entered”. HCSS and Procore are not connected yet, so nothing is written to them automatically.</div>
  <div class="filters">
    <div class="f"><label class="lb" for="op">Project</label><select id="op" ${S.ui.scope !== 'all' ? 'disabled' : ''}>${Object.values(PROJECTS).map(p => `<option value="${p.id}" ${U.project === p.id ? 'selected' : ''}>${p.id} · ${esc(p.name)}</option>`).join('')}</select></div>
    <div class="f"><label class="lb" for="od">Service date</label><select id="od">${dates.map(d => `<option value="${d}" ${U.date === d ? 'selected' : ''}>${fmtD(d)}</option>`).join('') || '<option>No dates</option>'}</select></div>
  </div>
  <div class="tiles" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
    <div class="tile" style="cursor:default"><div class="l">HCSS lines</div><div class="v num">${hRows.length}</div><div class="s">${money(hAmt) || '$0.00'} installed</div></div>
    <div class="tile" style="cursor:default"><div class="l">Procore Manpower rows</div><div class="v num">${pRows.length}</div><div class="s">${pW} worker${pW === 1 ? '' : 's'} · ${pH} total hours</div></div>
    <div class="tile" style="cursor:default"><div class="l">Still to enter or update</div><div class="v num">${left}</div><div class="s">${left ? 'rows across both systems' : 'all rows entered'}</div></div>
    <div class="tile" style="cursor:default"><div class="l">Tickets needing details</div><div class="v num">${needs.length}</div><div class="s">approved, held back</div></div>
  </div>
  <div class="card" style="margin-top:6px"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><h3 style="margin:0">HCSS HeavyJob · Material-Sub-Expense · Install · ${fmtD(U.date)}</h3><div class="row" style="gap:6px">${hRows.length ? '<button class="btn s" id="hcopy">Copy all rows</button><button class="btn s" id="hcsv">Download HCSS lines (CSV)</button>' : ''}</div></div>
  <p class="xs muted" style="margin:4px 0 8px">Columns follow the HeavyJob Material-Sub-Expense screen, left to right. Foreman: ADMIN. Material and trucking from the same ticket are separate lines, the way pea gravel tons and Valley truck hours were entered on Sept 1.</p>
  ${hRows.length ? `<div class="tw"><table class="t hc"><thead><tr>${['Cost Code · Desc', 'Matl-Sub-Exp · Desc', 'Type', 'Unit', 'Unit Cost', 'Inst Qty', 'Inst Amt', 'Vendor', 'T&amp;M', 'Loads', 'Note', 'Invoice #', 'State'].map(h => `<th${/Unit Cost|Inst/.test(h) ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>
    ${hRows.map((r, i) => `<tr><td><span class="mono">${esc(r.cc)}</span><div class="xs muted">${esc(r.ccd)}</div></td><td><span class="mono">${esc(r.mse)}</span><div class="xs muted">${esc(r.msed)}</div></td><td>${esc(r.type)}</td><td>${esc(r.unit)}</td><td class="n num">${r.cost != null ? r.cost.toFixed(3) : ''}</td><td class="n num"><b>${qfmt(r.qty)}</b></td><td class="n num">${money(r.amt)}</td><td class="mono small">${esc(r.vendor)}</td><td>${r.tm ? '☑' : '☐'}</td><td>${esc(r.loads)}</td><td class="small" style="min-width:170px">${esc(r.note)}<div class="xs"><a href="#/review/${r.t}">${r.t}</a></div></td><td class="mono small">${esc(r.inv)}</td><td style="min-width:170px">${entState(r)[1]}${entState(r)[0] === 'changed' ? `<div class="xs muted">Entered as ${esc(S.entries[r.key].short || S.entries[r.key].show)}</div>` : ''}
      <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:4px"><button class="btn s q" data-hc="${i}">Copy</button>${entState(r)[0] !== 'done' ? `<button class="btn s p" data-hm="${i}">${entState(r)[0] === 'changed' ? 'Mark updated…' : 'Mark entered…'}</button>` : ''}</div></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty" style="padding:14px">No HCSS lines ready for ${fmtD(U.date)}.</div>`}</div>
  <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><h3 style="margin:0">Procore · Daily Log · Manpower · ${fmtD(U.date)}</h3><div class="row" style="gap:6px">${pRows.length ? '<button class="btn s" id="pimgs">Download all ticket images</button>' : ''}</div></div>
  <p class="xs muted" style="margin:4px 0 8px">One row per company, location and hours, with workers counted per truck and the ticket images to attach. The Cascade Civil crew row is entered from the foreman’s report, not from truck tickets.</p>
  ${pRows.length ? `<div class="tw"><table class="t hc"><thead><tr><th>Company</th><th class="n">Workers</th><th class="n">Hours</th><th class="n">Total Hours</th><th>Location</th><th>Comments</th><th>Attachments</th><th>State</th><th></th></tr></thead><tbody>
    ${pRows.map((r, i) => `<tr><td>${esc(r.company)}</td><td class="n num">${r.workers}</td><td class="n num">${r.hours}</td><td class="n num"><b>${r.total}</b></td><td>${esc(r.location)}</td><td class="small" style="white-space:pre-line">${esc(r.comment)}</td><td class="small">${r.attach.length ? `<button class="btn s q" data-pi="${i}">${r.attach.length} image${r.attach.length === 1 ? '' : 's'}</button>` : '—'}<div class="xs muted">${r.tickets.map(id => `<a href="#/review/${id}">${id}</a>`).join(', ')}</div></td><td>${entState(r)[1]}${entState(r)[0] === 'changed' ? `<div class="xs muted">Entered as ${esc(S.entries[r.key].short || S.entries[r.key].show)}</div>` : ''}</td>
      <td><div class="row" style="gap:4px;flex-wrap:wrap"><button class="btn s q" data-pc="${i}">Copy comment</button>${entState(r)[0] !== 'done' ? `<button class="btn s p" data-pm="${i}">${entState(r)[0] === 'changed' ? 'Mark updated…' : 'Mark entered…'}</button>` : ''}</div></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty" style="padding:14px">No Procore Manpower rows ready for ${fmtD(U.date)}.</div>`}</div>
  ${orphans.length ? `<div class="card" style="margin-top:14px"><h3>Entered rows that no longer match</h3><p class="small muted">These were marked entered, but the ticket behind them changed, moved or was rejected. Fix or remove them in ${orphans.some(o => o.sys === 'HCSS') && orphans.some(o => o.sys === 'Procore') ? 'HCSS and Procore' : esc(orphans[0].sys)}, then clear them here.</p><ul class="small" style="margin:0">${orphans.map(o => `<li><b>${esc(o.sys)}</b> · ${esc(o.show)} · entered by ${esc(o.by)} ${fmtDT(o.at)} <button class="btn s" data-oc="${esc(o.key)}">Fixed in ${esc(o.sys)}</button></li>`).join('')}</ul></div>` : ''}
  ${needs.length ? `<div class="card warm" style="margin-top:14px"><h3>Approved, but details are needed before entry</h3><ul class="small" style="margin:0">${needs.map(x => `<li style="margin-bottom:6px"><a href="#/review/${x.t.id}">${x.t.id}</a> · ${esc(vName(x.t.approvedSnap.f.vendor.value))} · No. ${esc(x.t.approvedSnap.f.ticketNumber.value || '—')}<ul style="margin:2px 0 0;padding-left:18px">${x.bl.map(b => `<li>${esc(b.msg)}</li>`).join('')}</ul></li>`).join('')}</ul></div>` : ''}
  ${excluded.length ? `<div class="card" style="margin-top:14px"><h3>Not included</h3><ul class="small" style="margin:0">${excluded.map(x => `<li><a href="#/review/${x.t.id}">${x.t.id}</a> · No. ${esc(x.t.f.ticketNumber.value || '—')} — ${esc(x.why)}</li>`).join('')}</ul></div>` : ''}
  <div class="card" style="margin-top:14px"><h3>Entry log · ${fmtD(U.date)}</h3>${log.length ? `<ul class="log" style="list-style:none;padding:0;margin:0">${log.slice().reverse().map(l => `<li><b>${esc(l.sys)}</b> · ${esc(l.what)}${l.ref ? ` · ref ${esc(l.ref)}` : ''}<div class="xs muted">${fmtDT(l.at)} · ${esc(l.by)}</div></li>`).join('')}</ul>` : '<p class="small muted" style="margin:0">Nothing marked entered for this day yet.</p>'}</div>`;
  $('#op').onchange = e => { U.project = e.target.value; U.date = outDates(U.project)[0] || ''; render(); };
  $('#od').onchange = e => { U.date = e.target.value; render(); };
  const tsv = (cols, rows) => [cols.join('\t'), ...rows].join('\n');
  $('#hcopy') && ($('#hcopy').onclick = () => copyText(tsv(H_COLS, hRows.map(r => hVals(r).join('\t'))), `${hRows.length} HCSS line${hRows.length === 1 ? '' : 's'}`));
  $('#hcsv') && ($('#hcsv').onclick = () => { const csv = [H_COLS, ...hRows.map(hVals)].map(r => r.map(csvCell).join(',')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `HCSS-MSE_${(PROJECTS[U.project]?.id || U.project).replace('-', '')}_${U.date}.csv`; a.click(); audit(ME, `Downloaded HCSS lines CSV (${hRows.length})`, U.date); });
  $$('[data-hc]').forEach(b => b.onclick = () => copyText(hVals(hRows[+b.dataset.hc]).join('\t'), 'HCSS row'));
  $$('[data-pc]').forEach(b => b.onclick = () => copyText(pRows[+b.dataset.pc].comment, 'Procore comment'));
  $$('[data-pi]').forEach(b => b.onclick = () => downloadImages(pRows[+b.dataset.pi].attach));
  $('#pimgs') && ($('#pimgs').onclick = () => downloadImages([...new Set(pRows.flatMap(r => r.attach))]));
  $$('[data-hm]').forEach(b => b.onclick = () => { const r = hRows[+b.dataset.hm]; markDialog('HCSS', r, `${qfmt(r.qty)} ${r.unit} · ${money(r.amt)}`, `${r.cc} · ${r.mse} · ${qfmt(r.qty)} ${r.unit} @ ${r.cost != null ? r.cost.toFixed(2) : '—'} = ${money(r.amt)} · ${r.vendor} · “${r.note}”${r.inv ? ' · inv ' + r.inv : ''}`, U); });
  $$('[data-pm]').forEach(b => b.onclick = () => { const r = pRows[+b.dataset.pm]; markDialog('Procore', r, `${r.workers} × ${r.hours} h · ${r.attach.length} image${r.attach.length === 1 ? '' : 's'}`, `${r.company} · ${r.workers} × ${r.hours} = ${r.total} h · ${r.location} · ${r.attach.length} image${r.attach.length === 1 ? '' : 's'}`, U); });
  $$('[data-oc]').forEach(b => b.onclick = () => { const e = S.entries[b.dataset.oc]; e.cleared = nowISO(); S.entryLog.push({ sys: e.sys, what: `Cleared: ${e.show}`, at: nowISO(), by: ME, project: U.project, date: U.date }); audit(ME, `Cleared ${e.sys} row that no longer matched`, b.dataset.oc); render(); });
  S.done.outputSeen = true;
};
function markDialog(sys, r, short, show, U) {
  const prev = S.entries[r.key], upd = prev && prev.sig !== r.sig;
  modal(upd ? `Mark updated in ${sys}` : `Mark entered in ${sys}`, `<dl class="kv"><dt>${upd ? 'Now' : 'Row'}</dt><dd>${esc(show)}</dd>${upd ? `<dt>Was entered as</dt><dd>${esc(prev.show)}</dd>` : ''}</dl>
    <label class="lb" for="eref" style="margin-top:10px">${sys} reference (optional)</label><input id="eref" placeholder="${sys === 'HCSS' ? 'e.g. foreman ADMIN, entered 9/1' : 'e.g. Daily Log 9/1, Manpower row'}">
    <p class="xs muted">Recorded under ${esc(ME)}. This marks the row as entered; it does not write to ${sys}.</p>`, [{ label: upd ? 'Mark updated' : 'Mark entered', cls: 'p', fn: m => {
      const ref = $('#eref', m).value.trim();
      S.entries[r.key] = { sys, sig: r.sig, show, short, at: nowISO(), by: ME, ref, project: U.project, date: U.date, tickets: r.tickets || [r.t] };
      S.entryLog.push({ sys, what: `${upd ? 'Updated' : 'Entered'}: ${show}`, ref, at: nowISO(), by: ME, project: U.project, date: U.date });
      if (upd) S.done.late = true;
      audit(ME, `${upd ? 'Updated' : 'Entered'} in ${sys}${ref ? ` (${ref})` : ''}`, r.key); toast(`Marked ${upd ? 'updated' : 'entered'} in ${sys}`); render();
    } }]);
}

/* ---------- EXCEPTIONS ---------- */
VIEWS.exceptions = () => {
  const U = S.ui.exc;
  const all = exceptionsList().filter(e => S.ui.scope === 'all' || !e.project || e.project === S.ui.scope);
  const open = all.filter(e => e.status === 'open'), done = all.filter(e => e.status !== 'open');
  const types = [...new Set(open.map(e => e.type))].sort(), owners = [...new Set(open.map(e => e.owner || 'Unassigned'))].sort();
  const list = open.filter(e => (U.type === 'all' || e.type === U.type) && (U.owner === 'all' || (e.owner || 'Unassigned') === U.owner)).sort((a, b) => (a.created || '').localeCompare(b.created || ''));
  const opt = (v, cur, l) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`;
  main().innerHTML = `
  <div class="ph"><div><h1>Exceptions</h1><p>Everything that is blocking a ticket, a receipt, an output or an invoice — with an owner, its age and what it blocks. Ticket problems clear when the ticket is fixed; tasks are resolved with a reason.</p></div></div>
  <div class="filters">
    <div class="f"><label class="lb" for="xt">Type</label><select id="xt">${opt('all', U.type, 'All types')}${types.map(t => opt(t, U.type, t)).join('')}</select></div>
    <div class="f"><label class="lb" for="xo">Owner</label><select id="xo">${opt('all', U.owner, 'Anyone')}${owners.map(t => opt(t, U.owner, t)).join('')}</select></div>
    <div class="f"><label class="lb">&nbsp;</label><span class="small muted">${list.length} open · oldest first</span></div>
  </div>
  ${list.length ? `<div class="tw" role="region" aria-label="Open exceptions" tabindex="0"><table class="t"><thead><tr><th>Type</th><th>Reference</th><th>Project</th><th>Owner</th><th class="n">Age</th><th>Due</th><th>Blocks</th><th>Detail</th><th></th></tr></thead><tbody>
  ${list.map((e, i) => `<tr><td><span class="chip ${/Uncertain|failed|not received/i.test(e.type) ? 'e' : 'w'}">${esc(e.type)}</span></td><td class="small">${esc(e.ref)}</td><td>${esc(e.project || '—')}</td><td>${esc(e.owner || 'Unassigned')}</td><td class="n num">${e.created ? daysSince(e.created) + ' d' : '—'}</td><td class="num">${e.due ? fmtD(e.due) : '—'}</td><td class="small">${esc(e.dest || '—')}</td><td class="small" style="max-width:360px;white-space:normal">${esc(e.detail)}</td>
    <td><div class="row" style="gap:4px;flex-wrap:wrap">${e.kind === 'ticket' ? `<a class="btn s p" href="#/review/${e.ticket}" data-fld="${esc(e.field)}" data-tk="${e.ticket}">Open field</a>` : e.kind === 'receipt' ? `<button class="btn s p" data-rc="${e.receipt}">Open receipt</button>` : e.kind === 'delivery' ? `<button class="btn s p" data-out="${i}">Open Daily Output</button>` : `${e.ticket ? `<a class="btn s" href="#/review/${e.ticket}">Open ticket</a>` : ''}${/Invoice/.test(e.dest || '') ? '<a class="btn s" href="#/invoices">Open invoice</a>' : ''}<button class="btn s" data-asg="${e.id}">Assign</button><button class="btn s p" data-res="${e.id}">Resolve…</button>`}</div></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="card empty"><b>No open exceptions${U.type !== 'all' || U.owner !== 'all' ? ' for these filters' : ''}.</b>Nothing is blocking work right now.</div>`}
  ${done.length ? `<div class="card" style="margin-top:14px"><h3>Resolved tasks</h3><ul class="small" style="margin:0">${done.map(e => `<li><b>${esc(e.id)}</b> · ${esc(e.type)} · ${esc(e.ref)} — resolved by ${esc(e.resolved?.by)} on ${fmtDT(e.resolved?.at)}: “${esc(e.resolved?.reason)}”</li>`).join('')}</ul></div>` : ''}
  <p class="xs muted" style="margin-top:10px">Assignment changes owners only; it never edits ticket data or financial values.</p>`;
  $('#xt').onchange = e => { U.type = e.target.value; render(); };
  $('#xo').onchange = e => { U.owner = e.target.value; render(); };
  $$('[data-fld]').forEach(a => a.onclick = ev => { ev.preventDefault(); const id = a.dataset.tk, k = a.dataset.fld; location.hash = '#/review/' + id; setTimeout(() => { if (R && R.id === id) gotoField(k); }, 30); });
  $$('[data-rc]').forEach(b => b.onclick = () => { S.ui.inbox.tab = 'receipts'; S.ui.inbox.tile = 'failed'; location.hash = '#/inbox'; });
  $$('[data-out]').forEach(b => b.onclick = () => { const e = list[+b.dataset.out]; S.ui.out.project = e.out.project; S.ui.out.date = e.out.date; location.hash = '#/output'; });
  $$('[data-asg]').forEach(b => b.onclick = () => { const tk = S.tasks.find(x => x.id === b.dataset.asg); modal('Assign task', `<label class="lb" for="as">Owner</label><select id="as">${PEOPLE.map(p => `<option ${tk.owner === p ? 'selected' : ''}>${p}</option>`).join('')}</select><label class="lb" for="dd" style="margin-top:10px">Due date</label><input id="dd" type="date" value="${tk.due || ''}">`, [{ label: 'Save', cls: 'p', fn: r => { tk.owner = $('#as', r).value; tk.due = $('#dd', r).value; audit(ME, `Assigned ${tk.id} to ${tk.owner}`); toast(`${tk.id} assigned to ${tk.owner}`); render(); } }]); });
  $$('[data-res]').forEach(b => b.onclick = () => { const tk = S.tasks.find(x => x.id === b.dataset.res); reasonModal(`Resolve ${tk.id}`, 'Record how this was resolved. The task stays in history with your reason.', v => { tk.status = 'resolved'; tk.resolved = { by: ME, at: nowISO(), reason: v }; audit(ME, `Resolved ${tk.id}: ${v}`); toast(`${tk.id} resolved`); render(); }); });
};

/* ---------- INVOICE MATCHING ---------- */
function lineKey(tid, n) { return `${tid}|${n}`; }
function consumed(tid, n, exceptInv, exceptLine) {
  let s = 0; S.invoices.forEach(inv => inv.lines.forEach(l => { if (inv.id === exceptInv && l.n === exceptLine) return; l.alloc.forEach(a => { if (a.key === lineKey(tid, n)) s += M(a.qty); }); })); return s;
}
function candidates(inv, ln) {
  return Object.values(S.tickets).filter(t => t.status !== 'rejected' && t.f.vendor.value === inv.vendor && t.f.ticketNumber.value === ln.ref).flatMap(t => {
    const src = reviewState(t) === 'approved' ? t.approvedSnap : t;
    return src.lines.map((l, i) => ({ t, n: i + 1, approved: reviewState(t) === 'approved', qty: M(l.quantity), unit: l.unit, used: consumed(t.id, i + 1, inv.id, ln.n), date: src.f.serviceDate.value }));
  });
}
function invLineState(inv, ln) {
  if (ln.status === 'accepted') return ['accepted', '<span class="chip ok">Evidence accepted</span>'];
  if (ln.status === 'discrepancy') return ['disc', '<span class="chip e">Discrepancy flagged</span>'];
  const c = candidates(inv, ln);
  if (!c.length) return ['missing', '<span class="chip e">Ticket missing</span>'];
  const sum = ln.alloc.reduce((a, x) => a + M(x.qty), 0), q = M(ln.qty);
  if (!sum) { const rem = c.reduce((a, x) => a + Math.max(0, (x.qty || 0) - x.used), 0); return rem ? ['open', '<span class="chip i">Not matched</span>'] : ['over', '<span class="chip e">Ticket already used</span>']; }
  if (Math.abs(sum - q) <= 10) return ['matched', '<span class="chip t">Matched — accept to finish</span>'];
  return sum < q ? ['partial', `<span class="chip w">Partial · ${F(q - sum)} unsupported</span>`] : ['partial', '<span class="chip w">Over invoice qty</span>'];
}
VIEWS.invoices = () => {
  S.done.inv = true;
  const head = `<div class="ph"><div><h1>Invoice Matching</h1><p>Check each invoice line against reviewed tickets. One ticket line can support invoice lines only up to its own quantity, so the same tons are never paid twice.</p></div><div class="act"><button class="btn p" id="addinv">Enter an invoice…</button></div></div>`;
  if (!S.invoices.length) {
    main().innerHTML = `${head}<div class="card empty"><b>No vendor invoices yet.</b>When an invoice comes in, enter its lines here: ticket number, quantity, unit, rate and amount. Each line is then checked against the reviewed tickets for that vendor. Matching is evidence review, not approval to pay.</div>`;
    $('#addinv').onclick = invoiceDialog; return;
  }
  S.ui.inv = S.invoices.find(i => i.id === S.ui.inv) ? S.ui.inv : S.invoices[S.invoices.length - 1].id;
  const inv = S.invoices.find(i => i.id === S.ui.inv);
  const lineRows = inv.lines.map(ln => { const [st, chip] = invLineState(inv, ln), c = candidates(inv, ln); const sum = ln.alloc.reduce((a, x) => a + M(x.qty), 0); return { ln, st, chip, c, sum }; });
  main().innerHTML = `${head}
  ${S.invoices.length > 1 ? `<div class="filters"><div class="f"><label class="lb" for="isel">Invoice</label><select id="isel">${S.invoices.map(i => `<option value="${i.id}" ${i.id === inv.id ? 'selected' : ''}>${esc(i.number)} · ${esc(VENDORS[i.vendor]?.short || '')}</option>`).join('')}</select></div></div>` : ''}
  <div class="note" style="margin-bottom:14px"><b>Matching is evidence review, not approval to pay.</b> Nothing is posted to accounting. Amounts are shown as printed on the invoice. A ticket-supported amount is only calculated once a contract rate is on file.</div>
  <div class="grid" style="grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);align-items:start" id="invg">
    <div class="card">
      <div style="font-weight:800;letter-spacing:.02em">${esc(vName(inv.vendor))}</div><div class="xs muted">Entered by ${esc(inv.by || '—')} · ${fmtDT(inv.receivedAt)}</div>
      <hr class="sep"><dl class="kv"><dt>Invoice</dt><dd class="mono">${esc(inv.number)}</dd><dt>Project</dt><dd>${esc(pName(inv.project))}</dd><dt>Period</dt><dd>${esc(inv.period || '—')}</dd></dl>
      <table class="lt" style="margin-top:10px"><thead><tr><th>#</th><th>Ticket ref</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>${inv.lines.map(l => `<tr><td>${l.n}</td><td class="mono">${esc(l.ref)}</td><td class="n num">${esc(l.qty)} ${UNITS[l.unit] || ''}</td><td class="n num">${l.rateOnInvoice ? '$' + esc(l.rateOnInvoice) : '—'}</td><td class="n num">${l.amount ? '$' + Number(l.amount).toFixed(2) : '—'}</td></tr>`).join('')}<tr><td colspan="4" style="text-align:right"><b>Total of lines</b></td><td class="n num"><b>$${inv.lines.reduce((a, l) => a + Number(l.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</b></td></tr></tbody></table>
      <button class="btn s d q" id="delinv" style="margin-top:8px">Remove this invoice…</button>
    </div>
    <div>${lineRows.map(({ ln, st, chip, c }) => `<div class="card" style="margin-bottom:12px">
      <div class="row" style="justify-content:space-between"><h3 style="margin:0">Line ${ln.n} · ticket <span class="mono">${esc(ln.ref)}</span> · ${esc(ln.qty)} ${UNITS[ln.unit] || ''}${ln.amount ? ` · $${Number(ln.amount).toFixed(2)}` : ''}</h3>${chip}</div>
      <table class="lt" style="margin-top:10px"><thead><tr><th>Ticket line</th><th>Review state</th><th class="n">Ticket qty</th><th class="n">Used on other lines</th><th class="n">Allocated here</th></tr></thead><tbody>
      ${c.length ? c.map(x => { const here = ln.alloc.filter(a => a.key === lineKey(x.t.id, x.n)).reduce((a, z) => a + M(z.qty), 0); return `<tr><td><a href="#/review/${x.t.id}">${x.t.id}</a> line ${x.n} · ${fmtD(x.date)}</td><td>${stateChip(x.t)}</td><td class="n num">${F(x.qty)} ${UNITS[x.unit] || ''}</td><td class="n num">${F(x.used)}</td><td class="n num">${F(here)}</td></tr>`; }).join('') : `<tr><td colspan="5" class="sub">No ticket ${esc(ln.ref)} from ${esc(vName(inv.vendor))} is in the register yet. Nothing is created to fill the gap.</td></tr>`}
      </tbody></table>
      ${ln.decision ? `<div class="note ${ln.status === 'accepted' ? 'ok' : 'w'}" style="margin-top:8px">${esc(ln.decision.by)} · ${fmtDT(ln.decision.at)} — “${esc(ln.decision.reason)}”</div>` : ''}
      <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap">
        ${st === 'missing' && !ln.task ? `<button class="btn s" data-mt="${ln.n}">Create missing-ticket task</button>` : ''}
        ${c.length && ln.status !== 'accepted' ? `<button class="btn s ${st === 'open' || st === 'over' ? 'p' : ''}" data-al="${ln.n}">Allocate quantity…</button>` : ''}
        ${st === 'matched' ? `<button class="btn s p" data-acc="${ln.n}">Accept evidence match…</button>` : ''}
        ${ln.status !== 'accepted' && ln.status !== 'discrepancy' && st !== 'missing' ? `<button class="btn s d" data-dis="${ln.n}">Flag discrepancy…</button>` : ''}
        ${ln.alloc.length && ln.status !== 'accepted' ? `<button class="btn s q" data-clr="${ln.n}">Clear allocation</button>` : ''}
      </div></div>`).join('')}</div>
  </div>`;
  if (innerWidth < 1100) $('#invg').style.gridTemplateColumns = '1fr';
  $('#addinv').onclick = invoiceDialog;
  $('#isel') && ($('#isel').onchange = e => { S.ui.inv = e.target.value; render(); });
  $('#delinv').onclick = () => modal('Remove this invoice?', `<p>Invoice ${esc(inv.number)} and its matches are removed. Tickets are not changed.</p>`, [{ label: 'Remove', cls: 'd', fn: () => { S.invoices = S.invoices.filter(i => i !== inv); audit(ME, 'Removed invoice ' + inv.number, inv.id); render(); } }]);
  const L_ = n => inv.lines.find(l => l.n === +n);
  $$('[data-mt]').forEach(b => b.onclick = () => { const ln = L_(b.dataset.mt); const id = 'TASK-' + String(take('TASK')).padStart(3, '0'); S.tasks.push({ id, type: 'Missing ticket evidence', ref: `${inv.number} · line ${ln.n} · ticket ${ln.ref}`, project: inv.project, dest: 'Invoice matching', owner: 'Casey', due: '', created: nowISO(), status: 'open', detail: `Invoice line ${ln.n} references ticket ${ln.ref}, which is not in the register.` }); ln.task = id; audit(ME, 'Created missing-ticket task ' + id, inv.id); toast(id + ' created'); render(); });
  $$('[data-al]').forEach(b => b.onclick = () => {
    const ln = L_(b.dataset.al), c = candidates(inv, ln);
    modal(`Allocate invoice line ${ln.n}`, `<p class="small">Invoice line ${ln.n} claims <b>${esc(ln.qty)} ${UNITS[ln.unit] || ''}</b> for ticket <span class="mono">${esc(ln.ref)}</span>.</p>
      ${c.map((x, i) => { const rem = (x.qty || 0) - x.used; return `<div class="card" style="padding:10px 12px;margin-bottom:8px"><div class="small"><b>${x.t.id}</b> line ${x.n} · ${F(x.qty)} ${UNITS[x.unit] || ''} on ticket · already used ${F(x.used)} · <b>remaining ${F(rem)}</b>${x.unit !== ln.unit ? ' · <span class="chip e">different unit</span>' : ''}</div>
      <label class="lb" for="aq${i}" style="margin-top:6px">Quantity to allocate (${UNITS[x.unit] || ''})</label><input id="aq${i}" data-ci="${i}" inputmode="decimal" value="${rem > 0 && x.unit === ln.unit ? F(Math.min(rem, M(ln.qty))) : '0.00'}"></div>`; }).join('')}
      <div id="aerr" class="small" style="color:var(--err)"></div>`, [{ label: 'Save allocation', cls: 'p', fn: r => {
        const next = []; let err = '';
        c.forEach((x, i) => { const q = M($('#aq' + i, r).value); if (q == null || q < 0) { err = 'Enter a number for each ticket line (0 is allowed).'; return; } const rem = (x.qty || 0) - x.used; if (x.unit !== ln.unit && q > 0) err = 'Units differ — tons and loads cannot support each other.'; if (q > rem) err = `Over-allocation blocked: ${x.t.id} line ${x.n} has ${F(rem)} ${UNITS[x.unit] || ''} left (${F(x.used)} of ${F(x.qty)} already supports another invoice line). Flag a discrepancy instead.`; if (q > 0) next.push({ key: lineKey(x.t.id, x.n), qty: F(q) }); });
        if (err) { $('#aerr', r).textContent = err; return false; }
        ln.alloc = next; audit(ME, `Allocated invoice line ${ln.n}: ${next.map(a => a.key + ' ' + a.qty).join(', ') || 'none'}`, inv.id); toast(`Line ${ln.n} allocation saved`); render();
      } }]);
  });
  $$('[data-acc]').forEach(b => b.onclick = () => { const ln = L_(b.dataset.acc); reasonModal(`Accept evidence for line ${ln.n}`, 'Accepting confirms the ticket evidence supports this line. It is not payment approval.', v => { ln.status = 'accepted'; ln.decision = { by: ME, at: nowISO(), reason: v }; audit(ME, `Accepted evidence for invoice line ${ln.n}`, inv.id); toast(`Line ${ln.n}: evidence accepted (not payment approval)`); render(); }); });
  $$('[data-dis]').forEach(b => b.onclick = () => { const ln = L_(b.dataset.dis); reasonModal(`Flag discrepancy on line ${ln.n}`, 'Describe the problem (for example, ticket already billed on another line). An internal task is created; nothing is sent to the vendor.', v => { ln.status = 'discrepancy'; ln.decision = { by: ME, at: nowISO(), reason: v }; S.tasks.push({ id: 'TASK-' + String(take('TASK')).padStart(3, '0'), type: 'Invoice discrepancy', ref: `${inv.number} · line ${ln.n} · ticket ${ln.ref}`, project: inv.project, dest: 'Invoice matching', owner: 'Casey', due: '', created: nowISO(), status: 'open', detail: v }); audit(ME, `Flagged discrepancy on invoice line ${ln.n}`, inv.id); toast(`Discrepancy flagged on line ${ln.n} — task created`); render(); }); });
  $$('[data-clr]').forEach(b => b.onclick = () => { const ln = L_(b.dataset.clr); ln.alloc = []; render(); });
};
function invoiceDialog() {
  modal('Enter a vendor invoice', `<div class="grid g2"><div><label class="lb" for="iv">Vendor</label><select id="iv">${Object.values(VENDORS).map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div>
    <div><label class="lb" for="inum">Invoice number</label><input id="inum"></div>
    <div><label class="lb" for="ip">Project</label><select id="ip">${Object.values(PROJECTS).map(p => `<option value="${p.id}">${p.id} · ${esc(p.name)}</option>`).join('')}</select></div>
    <div><label class="lb" for="iper">Period (optional)</label><input id="iper" placeholder="e.g. July 2026"></div></div>
    <label class="lb" for="il" style="margin-top:10px">Lines — one per row: ticket no, quantity, unit (tons / loads / hours), rate, amount</label>
    <textarea id="il" rows="6" placeholder="6107, 41.30, tons, , \n84345, 2, loads, , "></textarea><div id="ierr" class="small" style="color:var(--err);margin-top:4px"></div>`, [{ label: 'Save invoice', cls: 'p', fn: r => {
      const num = $('#inum', r).value.trim(); if (!num) { $('#ierr', r).textContent = 'Enter the invoice number.'; return false; }
      const um = { ton: 'short_ton', tons: 'short_ton', t: 'short_ton', load: 'loads', loads: 'loads', hour: 'hours', hours: 'hours', hr: 'hours', hrs: 'hours', yd: 'cubic_yard', yards: 'cubic_yard', cy: 'cubic_yard' };
      const rows = $('#il', r).value.split('\n').map(x => x.trim()).filter(Boolean); let err = '';
      const lines = rows.map((x, i) => { const [ref, qty, unit, rate, amt] = x.split(',').map(z => (z || '').trim()); const u = um[(unit || '').toLowerCase()]; if (!ref || M(qty) == null || !u) err = `Row ${i + 1}: needs a ticket number, a number for quantity and a unit (tons, loads or hours).`; return { n: i + 1, ref, qty, unit: u, rateOnInvoice: rate || '', amount: amt || '', alloc: [], status: 'not_matched' }; });
      if (!lines.length) err = 'Add at least one line.'; if (err) { $('#ierr', r).textContent = err; return false; }
      const id = 'INV-' + take('INV');
      S.invoices.push({ id, number: num, vendor: $('#iv', r).value, project: $('#ip', r).value, period: $('#iper', r).value.trim(), receivedAt: nowISO(), by: ME, lines });
      S.ui.inv = id; audit(ME, `Entered invoice ${num} (${lines.length} lines)`, id); toast(`Invoice ${num} saved`); render();
    } }], true);
}

/* ---------- HELP ---------- */
const FORMMAP = [
  ['Delivery / Tonnage Ticket No.', 'Ticket No. (text — leading zeros kept)', 'Captured'], ['Date', 'Service date (separate from received date)', 'Captured'],
  ['Truck # / Trailer #', 'Truck # / Trailer #', 'Captured'], ['Truck Type: Super Solo / Side Dump / T&T / Solo / Other', 'Truck type (as written)', 'Captured'],
  ['Customer', 'Customer (as written)', 'Captured'], ['Job Name / Job Number', 'Job name and number as written → Project', 'Captured'],
  ['Any on the job injury? Yes / No', 'Job injury box (as marked)', 'Captured'],
  ['Leave Yard / Back to Yard', 'Start / Stop, with overnight check', 'Captured'], ['Pre Trip / Post Trip', '—', 'Ask Jordan if needed'],
  ['Down Time / Reason', 'Lunch / down time (hrs); reason goes in Remarks', 'Captured'], ['Onsite Hours (first in – last out)', 'Onsite hours (as written)', 'Captured'],
  ['Travel Hours', '—', 'Ask Jordan if needed'], ['Total Daily Hours', 'Total hours (as written)', 'Captured'],
  ['MATERIAL', 'Line material: as written + reviewed name', 'Captured'], ['FROM + IN/OUT', 'Line From + in/out times', 'Captured'], ['HAULED TO + IN/OUT', 'Line To + in/out times', 'Captured'],
  ['COST CODE', 'Line cost code or allocations', 'Captured'], ['TONS (and scale-ticket number written above it)', 'Line quantity in tons + scale ticket #', 'Captured'],
  ['Driver Signature / Authorized Rep. Signature', 'Both recorded as present / not observed', 'Captured'],
  ['Vendor tickets: No. Loads, tally marks, run numbers', 'Line load count, with a confirm step for tally marks', 'Captured'], ['Vendor tickets: Start / Stop Odo, Mileage', 'Mileage / odometer start', 'Captured'],
  ['Vendor tickets: Remarks, foreman cost-code notes', 'Remarks + Foreman note → allocations', 'Captured'], ['Vendor tickets: Truck Rate', 'Rate (as written)', 'Captured']
];
const OPENQ = [
  ['Full HCSS cost code list for TC2507 (only 40000002 and 90000013–90000028 are on file). Harbor 7632 says “8000017” — which 8-digit code is it?', 'HCSS'],
  ['HCSS item code, vendor code and rate for Morgan, Birch, Foothill and Fast Lane (not in the Material-Sub-Expense list seen), and the rate and unit for 6LACY Harbor Trucking', 'HCSS'],
  ['Overtime rule: when do hours move from the regular code (6TCB $220) to overtime (6TCBOT $250) or double time (6TCBDT)? Same rule for Alder and Open Road?', 'HCSS'],
  ['Hours: Sept 1 Valley trucks were 7 HR in HCSS but 8 in Procore. Which hours go where, and why do they differ?', 'HCSS'],
  ['Sept 1: both Valley trucks reference ticket 0003672. One ticket for two trucks, or a typo?', 'HCSS'],
  ['Material from the pits: who is the supplier, which HCSS item (like 2AGGQAPG pea gravel), and where do the tons come from — truck ticket or scale ticket?', 'HCSS'],
  ['Is T&M checked for every 9000xxxx PCO/CE code? Is anything entered in the Loads column, or only in the note?', 'HCSS'],
  ['Invoice # in HCSS: entered when the vendor invoice arrives, or later in a separate pass?', 'HCSS'],
  ['Does HeavyJob “Import Tran” accept a file for Material-Sub-Expense lines, and in what format? Who is Cascade Civil’s HCSS admin for an API client?', 'HCSS'],
  ['Procore company for each hauler (Valley shows as “No Company”) and the full Location list (Material Pits > …)', 'Procore'],
  ['Procore: one Manpower row per company and location with workers = trucks, and every ticket image attached — correct?', 'Procore'],
  ['Own Cascade Civil trucks (e.g. 37077): HCSS time card only, or anything in Material-Sub-Expense or Manpower?', 'Procore'],
  ['Procore project ID, admin contact and a test project before connecting', 'Procore'],
  ['Can TC2507 and 2507 be treated as the same job? Official name and address (Seattle vs Shoreline)', 'Reference lists'],
  ['Material names; anyone else who hauls', 'Reference lists'], ['Do on-site moves count the same as imports?', 'Reference lists'],
  ['Billing basis per vendor (load, ton, hour); Foothill 25 tons — total or per load?', 'Quantities'], ['Do mine scale tickets come in, and should they be matched?', 'Quantities'],
  ['Hours rules (Cascade Civil 37077: 3 1/4 vs 10:45)', 'Quantities'], ['Partial runs, e.g. Fast Lane “Sold out of Type 22”', 'Quantities'],
  ['Fields required before approval; is a missing rep signature OK?', 'Approval'], ['Who reviews, approves and backs up', 'Approval'], ['Pink or yellow copy as the record', 'Approval'], ['How late a ticket can be accepted', 'Approval'],
  ['How tickets arrive today and who sends them', 'Intake'], ['Two or three real invoices', 'Intake'], ['Current tracker spreadsheet', 'Intake'],
  ['Who can see real ticket scans; is a sign-in OK?', 'Access']
];
VIEWS.help = () => {
  const tab = ['layouts', 'how', 'keys', 'map', 'open'].includes(S.ui.helpTab) ? S.ui.helpTab : 'layouts', tb = (k, l) => `<button role="tab" data-ht="${k}" aria-selected="${tab === k}">${l}</button>`;
  let body = '';
  if (tab === 'layouts') body = `<div class="grid g2" style="align-items:start">${Object.entries(LAYOUTS).map(([k, L]) => { const n = Object.values(S.tickets).filter(t => t.f.vendor.value === k).length; return `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(L.name)}</h3><span class="chip g">${n} ticket${n === 1 ? '' : 's'}</span></div>
    <dl class="kv small" style="margin-top:8px"><dt>Quantities</dt><dd>${esc(L.qty)}</dd><dt>Times</dt><dd>${esc(L.time)}</dd><dt>Ticket No.</dt><dd>${esc(L.id)}</dd><dt>Copies</dt><dd>${esc(L.copies)}</dd></dl>
    <div class="small" style="margin-top:6px"><b>Where to look</b><ul style="margin:4px 0 0;padding-left:18px">${L.where.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="small" style="margin-top:6px"><b>Watch for</b><ul style="margin:4px 0 0;padding-left:18px">${L.quirks.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`; }).join('')}</div>`;
  if (tab === 'how') body = `<div class="grid g2" style="align-items:start"><div class="card"><h2>How a ticket moves</h2><ol class="steps">
    <li><div class="tx"><b>Received</b><div class="small muted">Scanned PDF, phone photo or (later) the shared mailbox. Each file gets its own receipt.</div></div></li>
    <li><div class="tx"><b>Kept as the original</b><div class="small muted">The file stays as received. Zoom, rotation and corrections never change it.</div></div></li>
    <li><div class="tx"><b>Split into tickets</b><div class="small muted">A page with two tickets becomes two records, each pointing at its own half of the page.</div></div></li>
    <li><div class="tx"><b>Review</b><div class="small muted">The image sits beside the form. The vendor layout shows where each fact is and how that vendor counts. Blockers list exactly what is missing or unclear.</div></div></li>
    <li><div class="tx"><b>Approved version</b><div class="small muted">A person approves one exact version. Editing later creates a new version that needs approval again.</div></div></li>
    <li><div class="tx"><b>Outputs</b><div class="small muted">Register and CSV export, plus Daily Output: the HCSS Material-Sub-Expense lines and the Procore Daily Log Manpower rows for each day, with the ticket images. When a ticket changes or arrives late, it shows exactly which row to update.</div></div></li></ol></div>
    <div class="card warm"><h2>Ground rules</h2><ul class="small" style="padding-left:18px;margin:0;line-height:1.7"><li>Blank stays blank. A missing weight or quantity is never treated as zero.</li><li>Different units are never added together.</li><li>Batch defaults are labeled “Inherited” and never shown as if printed on the ticket.</li><li>Different vendors can reuse ticket numbers. That is shown as information, not a duplicate.</li><li>Every approval is a person’s decision. Nothing is auto-approved, posted to Procore or sent to a vendor.</li><li>Invoice matching is evidence review. It is not approval to pay.</li></ul></div></div>`;
  if (tab === 'keys') body = `<div class="card"><h2>Keyboard shortcuts (Review)</h2><div class="tw"><table class="t"><thead><tr><th>Key</th><th>Action</th></tr></thead><tbody><tr><td class="mono">n / p</td><td>Next / previous approval blocker (off while typing in a field)</td></tr><tr><td class="mono">Ctrl+S / ⌘S</td><td>Save draft</td></tr><tr><td class="mono">] / [</td><td>Next / previous ticket</td></tr><tr><td class="mono">Tab</td><td>Move between fields; the highlight on the ticket follows</td></tr><tr><td class="mono">← / →</td><td>On the pane divider: resize the image and form panes</td></tr><tr><td class="mono">Esc</td><td>Close a dialog</td></tr></tbody></table></div></div>`;
  if (tab === 'map') body = `<div class="card"><h2>Cascade Civil trucking form → Ticket Desk fields</h2><p class="small muted">From the blank Cascade Civil Delivery / Tonnage Ticket and the vendor examples.</p><div class="tw"><table class="t"><thead><tr><th>On the form</th><th>Ticket Desk field</th><th>Status</th></tr></thead><tbody>${FORMMAP.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td><span class="chip ${r[2] === 'Captured' ? 'ok' : 'w'}">${esc(r[2])}</span></td></tr>`).join('')}</tbody></table></div></div><div class="card" style="margin-top:14px"><h2>Approved ticket → HCSS and Procore</h2><p class="small muted">From the HeavyJob Material-Sub-Expense screen and the Procore Daily Log for Sept 1, 2026.</p><div class="tw"><table class="t"><thead><tr><th>HCSS HeavyJob (Material-Sub-Expense, Install)</th><th>Comes from</th></tr></thead><tbody>${[['Date / Foreman', 'Service date · ADMIN'], ['Cost Code', 'Line cost code (8-digit HCSS code)'], ['Matl-Sub-Exp', 'Vendor’s item code: trucking (6TCB, 6TTRB…) or material (2AGGQAPG…)'], ['Cost Type / Unit / Unit Cost', 'From the HCSS item list (S · HR · $220)'], ['Inst Qty', 'Hours billed for trucking; tons for material'], ['Inst Amt', 'Inst Qty × Unit Cost'], ['Vendor', 'HCSS vendor code (RIDGELINE, VALEYBROS, GRANITEAGG)'], ['T&M', 'Checked for 9000xxxx PCO / CE codes'], ['Note', 'Loads, truck and ticket: “3 Truck 003 Ticket 0003672”'], ['Invoice #', 'Vendor invoice number']].map(r => `<tr><td>${esc(r[0])}</td><td class="small">${esc(r[1])}</td></tr>`).join('')}</tbody></table></div>
    <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Procore Daily Log · Manpower</th><th>Comes from</th></tr></thead><tbody>${[['Company', 'Procore directory name, or “No Company”'], ['Workers', 'One per truck; trucks with the same company, location and hours share a row'], ['Hours / Total Hours', 'Hours per truck · workers × hours'], ['Location', 'e.g. Material Pits > Granite Aggregate'], ['Comments', '“Truck 004 Ticket 5823”, plus loads and tons when hauled in'], ['Attachments', 'The ticket image, cropped to that ticket']].map(r => `<tr><td>${esc(r[0])}</td><td class="small">${esc(r[1])}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (tab === 'open') body = `<div class="card"><h2>Open questions for Jordan</h2><p class="small muted">These shape the reference lists, approval rules and what goes into HCSS and Procore. Each stays open until answered.</p><div class="tw"><table class="t"><thead><tr><th>#</th><th>Question</th><th>Area</th><th>Status</th></tr></thead><tbody>${OPENQ.map((q, i) => `<tr><td>${i + 1}</td><td>${esc(q[0])}</td><td>${esc(q[1])}</td><td><span class="chip w">Open</span></td></tr>`).join('')}</tbody></table></div></div>`;
  main().innerHTML = `<div class="ph"><div><h1>Help</h1><p>Ticket Desk receives trucking tickets, keeps the originals, lets a project engineer review them next to the image, and prepares each approved ticket for HCSS HeavyJob, the Procore Daily Log and invoice checks.</p></div></div>
  <div class="tabs" role="tablist">${tb('layouts', 'Vendor layouts')}${tb('how', 'How it works')}${tb('keys', 'Shortcuts')}${tb('map', 'Field mapping')}${tb('open', 'Open questions')}</div>${body}`;
  $$('[data-ht]').forEach(b => b.onclick = () => { S.ui.helpTab = b.dataset.ht; render(); });
};

/* ---------- SETTINGS / HEALTH ---------- */
VIEWS.settings = () => {
  const tab = ['int', 'req', 'ref', 'hcss', 'data'].includes(S.ui.settingsTab) ? S.ui.settingsTab : 'int', tb = (k, l) => `<button role="tab" data-st="${k}" aria-selected="${tab === k}">${l}</button>`;
  const last = S.receipts.slice().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))[0];
  const backlog = Object.values(S.tickets).filter(t => reviewState(t) === 'needs_review').length;
  let body = '';
  if (tab === 'int') body = `<div class="tiles" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><div class="tile" style="cursor:default"><div class="l">Last receipt</div><div class="v num" style="font-size:20px">${last ? fmtDT(last.receivedAt) : '—'}</div><div class="s">${last ? esc(last.id) : ''}</div></div><div class="tile" style="cursor:default"><div class="l">Review backlog</div><div class="v num">${backlog}</div><div class="s">Tickets waiting for review</div></div><div class="tile" style="cursor:default"><div class="l">Saved</div><div class="v num" style="font-size:20px">${SAVED_AT ? fmtDT(SAVED_AT) : '—'}</div><div class="s">Shared workspace</div></div></div>
    <div class="tw"><table class="t"><thead><tr><th>Connection</th><th>Status</th><th>What that means</th></tr></thead><tbody>${[
      ['Shared mailbox', 'w', 'Not connected', 'Tickets come in through Capture (upload or camera) for now.'],
      ['Shared workspace', 'ok', 'Connected', 'Everyone using this link works in one shared workspace, saved on the Ticket Desk server. Export a backup any time from Data &amp; audit.'],
      ['Sign-in', 'w', 'Not set up', 'Pick your name at the top right. Every save and approval is recorded under that name.'],
      ['Reading tickets automatically (OCR)', 'w', 'Not connected', 'Values for the example set were keyed from the scans. New uploads are entered by hand next to the image.'],
      ['HCSS HeavyJob', 'w', 'Not connected', 'Daily Output lays out each Material-Sub-Expense line (cost code, item, unit, qty, rate, vendor, T&amp;M, note, invoice #) to copy in or download as a file. Connecting needs an HCSS API client set up by Cascade Civil’s HCSS admin.'],
      ['Procore', 'w', 'Not connected', 'Daily Output lays out each Daily Log Manpower row (company, workers, hours, location, comments) with the ticket images to attach. Connecting needs Procore admin approval and a test project.']
    ].map(r => `<tr><td><b>${r[0]}</b></td><td><span class="chip ${r[1]}">${r[2]}</span></td><td class="small">${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <div class="note" style="margin-top:12px">Nothing is approved automatically, written to HCSS or Procore, or sent to a vendor. Each needs a person’s decision.</div>`;
  if (tab === 'req') body = `<div class="note w" style="margin-bottom:12px"><b>Starting rules — to confirm with Jordan.</b> These decide what blocks approval and outputs. Change a box and the blockers in Review update right away.</div>
    <div class="tw"><table class="t"><thead><tr><th>Field</th><th>Capture</th><th>Approval</th><th>Daily output</th><th>Invoice match</th></tr></thead><tbody>${Object.entries(S.profile).map(([k, v]) => `<tr><td>${esc(({ costCode: 'Cost code / allocation', quantity: 'Quantity', unit: 'Unit', basis: 'Quantity basis' })[k] || LABELS[k])}</td>${['capture', 'approve', 'daily', 'invoice'].map(c => `<td><input type="checkbox" data-rq="${k}|${c}" ${v[c] ? 'checked' : ''} aria-label="${k} required for ${c}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if (tab === 'ref') body = `<div class="grid g2" style="align-items:start"><div class="card"><h3>Projects and cost codes</h3>${Object.values(PROJECTS).map(p => `<p class="small" style="margin:8px 0 4px"><b>${p.id}</b> · ${esc(p.name)} · job ${p.jobNo}<br><span class="xs muted">Also written as: ${p.aliases.map(esc).join(', ')}</span></p><ul class="small" style="margin:0">${(CODES[p.id] || []).map(c => `<li class="mono">${esc(c[0])} — ${esc(c[1])}</li>`).join('')}</ul>`).join('')}
      <div class="grid g2" style="margin-top:10px"><div><label class="lb" for="ncc">Add cost code</label><input id="ncc" placeholder="e.g. 90000029"></div><div><label class="lb" for="ncd">Description</label><input id="ncd"></div></div><button class="btn s" id="addcc" style="margin-top:6px">Add to TC-2507</button></div>
    <div class="card"><h3>Vendors</h3><ul class="small" style="margin:0">${Object.values(VENDORS).map(v => `<li><b>${esc(v.name)}</b> — also written as: ${v.aliases.map(esc).join(', ')}</li>`).join('')}</ul>
      <h3 style="margin-top:14px">Materials</h3><ul class="small" style="margin:0">${Object.entries(MAT_ALIAS).map(([a, b]) => `<li><span class="raw">${esc(a)}</span> → ${esc(b)}</li>`).join('')}</ul>
      <h3 style="margin-top:14px">Sources</h3><ul class="small" style="margin:0">${SOURCES.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="xs muted">Taken from the example tickets. Jordan’s official lists and Procore IDs will replace these.</p></div></div>`;
  if (tab === 'hcss') body = `<div class="note" style="margin-bottom:12px">Taken from HeavyJob Manager (TC2507 Riverside Park – Shoreline, Material-Sub-Expense) and the Procore Daily Log for Sept 1, 2026. Rates and units fill in each HCSS line automatically. Blank means not on file yet.</div>
    <div class="card"><h3>HCSS Material-Sub-Expense items</h3><div class="tw"><table class="t"><thead><tr><th>Code</th><th>Description</th><th>Cost type</th><th>Unit</th><th class="n">Unit cost</th></tr></thead><tbody>${Object.entries(S.hcss.mse).sort().map(([k, v]) => `<tr><td class="mono">${esc(k)}</td><td>${esc(v.d)}</td><td><input data-mse="${esc(k)}|type" value="${esc(v.type)}" style="width:60px" aria-label="${esc(k)} cost type"></td><td><input data-mse="${esc(k)}|unit" value="${esc(v.unit)}" style="width:70px" aria-label="${esc(k)} unit"></td><td class="n"><input data-mse="${esc(k)}|cost" value="${v.cost ?? ''}" inputmode="decimal" style="width:90px;text-align:right" aria-label="${esc(k)} unit cost"></td></tr>`).join('')}</tbody></table></div>
      <div class="grid g3" style="margin-top:10px"><div><label class="lb" for="nmc">Add item code</label><input id="nmc" placeholder="e.g. 6TJANKE"></div><div><label class="lb" for="nmd">Description</label><input id="nmd"></div><div style="align-self:end"><button class="btn s" id="addmse">Add item</button></div></div></div>
    <div class="card" style="margin-top:14px"><h3>Vendor → HCSS and Procore</h3><p class="small muted">Which HCSS vendor code and item codes each hauler uses, and how they appear in the Procore directory.</p><div class="tw"><table class="t"><thead><tr><th>Vendor</th><th>HCSS vendor</th><th>Regular item</th><th>Overtime item</th><th>Double-time item</th><th>Material item</th><th>Procore company</th></tr></thead><tbody>${Object.keys(VENDORS).filter(k => k !== 'V-CASCADE CIVIL').map(k => { const m = S.hcss.vend[k] || {}; const c = (f, w) => `<input data-vm="${k}|${f}" value="${esc(m[f] || '')}" style="width:${w}px" aria-label="${esc(VENDORS[k].name)} ${f}">`; return `<tr><td>${esc(VENDORS[k].name)}</td><td>${c('code', 110)}</td><td>${c('reg', 90)}</td><td>${c('ot', 90)}</td><td>${c('dt', 90)}</td><td>${c('mat', 90)}</td><td>${c('procore', 170)}</td></tr>`; }).join('')}</tbody></table></div><p class="xs muted">Cascade Civil’s own trucks are not listed: they are not a Material-Sub-Expense line.</p></div>
    <div class="grid g2" style="margin-top:14px;align-items:start"><div class="card"><h3>Procore locations</h3><ul class="small" style="margin:0">${S.hcss.locs.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="row" style="gap:6px;margin-top:8px"><input id="nloc" placeholder="e.g. Material Pits > Cedar Ridge Mine" aria-label="New Procore location"><button class="btn s" id="addloc">Add</button></div></div>
      <div class="card"><h3>Procore companies</h3><ul class="small" style="margin:0">${S.hcss.companies.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="row" style="gap:6px;margin-top:8px"><input id="nco" placeholder="As listed in the Procore directory" aria-label="New Procore company"><button class="btn s" id="addco">Add</button></div></div></div>`;
  if (tab === 'data') body = `<div class="card"><h3>Backup and hand-off</h3><p class="small muted">Work is saved to the shared team workspace. Export a backup file to keep your own copy, or import one to restore it.</p><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn p" id="exp">Export backup (.json)</button><label class="btn" for="imp">Import backup…</label><input id="imp" type="file" accept="application/json,.json" class="sr-only"><button class="btn d" id="clr">Start over with the example set…</button></div></div>
    <div class="card" style="margin-top:14px"><h3>Audit log</h3><div class="tw" style="max-height:420px"><table class="t"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Ref</th></tr></thead><tbody>${S.audit.map(a => `<tr><td class="num">${fmtDT(a.at)}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td class="mono">${esc(a.ref)}</td></tr>`).join('')}</tbody></table></div></div>`;
  main().innerHTML = `<div class="ph"><div><h1>Settings / Health</h1><p>Where each connection stands, the approval rules, reference lists, backups and the audit log.</p></div></div>
  <div class="tabs" role="tablist">${tb('int', 'Connections')}${tb('req', 'Required fields')}${tb('ref', 'Codes, vendors &amp; materials')}${tb('hcss', 'HCSS &amp; Procore lists')}${tb('data', 'Data &amp; audit')}</div>${body}`;
  $$('[data-st]').forEach(b => b.onclick = () => { S.ui.settingsTab = b.dataset.st; render(); });
  $$('[data-mse]').forEach(i => i.onchange = () => { const [k, f] = i.dataset.mse.split('|'); let v = i.value.trim(); if (f === 'cost') { if (v !== '' && n2(v) == null) { toast('Enter a number', true); return; } v = v === '' ? null : n2(v); } else v = v.toUpperCase(); S.hcss.mse[k][f] = v; audit(ME, `HCSS item ${k} ${f} = ${v ?? 'blank'}`); persist(); toast('Saved'); });
  $$('[data-vm]').forEach(i => i.onchange = () => { const [k, f] = i.dataset.vm.split('|'); const v = f === 'procore' ? i.value.trim() : i.value.trim().toUpperCase(); S.hcss.vend[k] = S.hcss.vend[k] || {}; S.hcss.vend[k][f] = v; audit(ME, `${vName(k)} ${f} = ${v || 'blank'}`); persist(); toast('Saved'); });
  $('#addmse') && ($('#addmse').onclick = () => { const c = $('#nmc').value.trim().toUpperCase(), d = $('#nmd').value.trim(); if (!c) { toast('Enter an item code.', true); return; } S.hcss.mse[c] = S.hcss.mse[c] || { d: d || c, type: '', unit: '', cost: null }; audit(ME, `Added HCSS item ${c}`); render(); });
  $('#addloc') && ($('#addloc').onclick = () => { const v = $('#nloc').value.trim(); if (v && !S.hcss.locs.includes(v)) { S.hcss.locs.push(v); audit(ME, `Added Procore location ${v}`); } render(); });
  $('#addco') && ($('#addco').onclick = () => { const v = $('#nco').value.trim(); if (v && !S.hcss.companies.includes(v)) { S.hcss.companies.push(v); audit(ME, `Added Procore company ${v}`); } render(); });
  $$('[data-rq]').forEach(c => c.onchange = () => { const [k, col] = c.dataset.rq.split('|'); S.profile[k][col] = c.checked; audit(ME, `Required-field rule: ${k} ${col} = ${c.checked}`); persist(); toast('Rule updated'); });
  $('#addcc') && ($('#addcc').onclick = () => { const c = $('#ncc').value.trim(), d = $('#ncd').value.trim(); if (!c) { toast('Enter a cost code.', true); return; } const list = CODES['TC-2507'] = CODES['TC-2507'] || []; const ex = list.find(x => x[0] === c); if (ex) ex[1] = d || ex[1]; else list.push([c, d || 'Description needed']); audit(ME, `Cost code ${c} added`, 'TC-2507'); render(); });
  $('#exp') && ($('#exp').onclick = () => { const blob = new Blob([JSON.stringify({ app: 'ticket-desk', v: 2, at: nowISO(), by: ME, S })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ticket-desk-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); audit(ME, 'Exported backup'); });
  $('#imp') && ($('#imp').onchange = e => { const fl = e.target.files[0]; if (!fl) return; const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(rd.result); if (o.app !== 'ticket-desk' || !o.S || !o.S.tickets) throw 0; modal('Replace current work with this backup?', `<p>Backup from ${esc(o.by || '—')} · ${fmtDT(o.at)} with ${Object.keys(o.S.tickets).length} tickets. Current shared work is replaced for everyone.</p>`, [{ label: 'Import', cls: 'p', fn: () => { S = o.S; CODES = S.codes || CODES; R = null; audit(ME, 'Imported backup from ' + (o.by || 'unknown')); render(); toast('Backup imported'); } }]); } catch (x) { toast('That file is not a Ticket Desk backup.', true); } }; rd.readAsText(fl); });
  $('#clr') && ($('#clr').onclick = () => modal('Start over?', '<p>This clears all shared work for the whole team and reloads the eight example tickets. Export a backup first if you want to keep anything.</p>', [{ label: 'Start over', cls: 'd', fn: () => { R = null; seed(); CODES = S.codes; render(); toast('Example set reloaded'); } }]));
};

/* ---------- saving (shared team workspace) ---------- */
const API = 'port/8000'.startsWith('__') ? 'http://localhost:8000' : 'port/8000';
let SAVED_AT = null, saveT = null, REV = 0, saving = false, again = false, ONLINE_STORE = true, LAST = '';
function persist() { clearTimeout(saveT); saveT = setTimeout(pushState, 500); }
async function pushState() {
  if (!S) return; if (saving) { again = true; return; }
  S.codes = CODES; const body = JSON.stringify(S); if (body === LAST && ONLINE_STORE) return;
  saving = true;
  try {
    const r = await fetch(`${API}/api/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: `{"base":${REV},"by":${JSON.stringify(ME)},"state":${body}}` });
    if (r.status === 409) {
      const rr = await fetch(`${API}/api/state`, { cache: 'no-store' }); const o = await rr.json();
      const merged = mergeState(LAST ? JSON.parse(LAST) : {}, JSON.parse(body), o.state || {});
      merged.ui = JSON.parse(body).ui; S = merged; CODES = S.codes || CODES; REV = o.rev; LAST = JSON.stringify(o.state || {});
      saving = false; render(); toast('A teammate saved at the same time. Both sets of changes are kept.'); return;
    }
    else if (r.ok) { REV = (await r.json()).rev; LAST = body; SAVED_AT = nowISO(); ONLINE_STORE = true; setSaved(); }
    else throw new Error(r.status);
  } catch (e) { ONLINE_STORE = false; setSaved(); }
  saving = false; if (again) { again = false; persist(); }
}
const POOL = { T: [], R: [], INV: [], TASK: [] };
const POOLMIN = () => ({ T: S.nextT || 1009, R: S.nextR || 1002, INV: 1001 + (S.invoices || []).length, TASK: 1 + (S.tasks || []).length });
async function reserve(k, n) { try { const r = await fetch(`${API}/api/next?k=${k}&n=${n}&min=${POOLMIN()[k]}`, { method: 'POST' }); const o = await r.json(); return o.start; } catch (e) { return null; } }
async function refill(k, n) { try { const r = await fetch(`${API}/api/next?k=${k}&n=${n}&min=${POOLMIN()[k]}`, { method: 'POST' }); const o = await r.json(); for (let i = 0; i < o.n; i++) POOL[k].push(o.start + i); } catch (e) { } }
function refillAll() { const want = { INV: 2, TASK: 2 }; for (const k in want) if (POOL[k].length < want[k] / 2) refill(k, want[k]); }
function take(k) { const v = POOL[k].shift(); setTimeout(refillAll, 50); if (v != null) return v; const m = POOLMIN()[k] + Math.floor(Math.random() * 900) + 100; return m; }
const J = x => JSON.stringify(x);
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
function mergeState(b, l, r) {
  if (J(l) === J(b)) return r; if (J(r) === J(b) || J(l) === J(r)) return l;
  if (isObj(l) && isObj(r)) { const o = {}; const bb = isObj(b) ? b : {}; for (const k of new Set([...Object.keys(r), ...Object.keys(l)])) { if (!(k in l) && k in bb && J(bb[k]) === J(r[k])) continue; if (!(k in r) && k in bb && J(bb[k]) === J(l[k])) continue; const v = mergeState(bb[k], l[k], r[k]); if (v !== undefined) o[k] = v; } return o; }
  if (Array.isArray(l) && Array.isArray(r)) {
    const bb = Array.isArray(b) ? b : []; const key = x => isObj(x) && x.id != null ? 'id:' + x.id : 'j:' + J(x);
    const bm = new Map(bb.map(x => [key(x), x])), lm = new Map(l.map(x => [key(x), x])), out = [], seen = new Set();
    for (const x of r) { const k = key(x); seen.add(k); if (!lm.has(k) && bm.has(k)) continue; out.push(lm.has(k) ? mergeState(bm.get(k), lm.get(k), x) : x); }
    for (const x of l) { const k = key(x); if (seen.has(k) || bm.has(k)) continue; out.push(x); }
    return out;
  }
  return l === undefined ? r : l;
}
async function pullState(rerender) {
  const r = await fetch(`${API}/api/state`, { cache: 'no-store' }); const o = await r.json();
  if (o.state && o.state.tickets) { const ui = S && S.ui; S = o.state; if (ui) S.ui = ui; CODES = S.codes || CODES; S.codes = CODES; LAST = JSON.stringify(S); REV = o.rev; SAVED_AT = o.at ? new Date(o.at * 1000).toISOString() : null; if (rerender) { if (R && !T(R.id)) R = null; if (R && !R.dirty) R = null; render(); } return true; }
  REV = o.rev || 0; return false;
}
function setSaved() { const el = document.querySelector('.side-foot'); if (!el) return; el.innerHTML = ONLINE_STORE ? `<div class="mode-pill"><span class="dot"></span> Shared team workspace</div><p>${SAVED_AT ? 'Saved ' + esc(fmtDT(SAVED_AT)) : 'Saving…'}. Procore not connected.</p>` : `<div class="mode-pill"><span class="dot" style="background:#C2410C"></span> Not saved</div><p>The server could not be reached. Keep this tab open; changes are retried on the next save.</p>`; }
setInterval(async () => { if (saving || (R && R.dirty) || document.hidden) return; try { const r = await fetch(`${API}/api/state?rev`, { cache: 'no-store' }); const o = await r.json(); if (o.rev && o.rev !== REV) { await pullState(false); if (!(R && R.dirty)) { R = null; render(); } } } catch (e) { } }, 8000);

/* ---------- start ---------- */
(async () => {
  let ok = false; try { ok = await pullState(false); } catch (e) { ONLINE_STORE = false; }
  if (!ok) { seed(); if (ONLINE_STORE) persist(); }
  if (!location.hash) history.replaceState(null, '', '#/inbox');
  lastHash = location.hash;
  render(); setSaved(); refillAll();
})();
})();
