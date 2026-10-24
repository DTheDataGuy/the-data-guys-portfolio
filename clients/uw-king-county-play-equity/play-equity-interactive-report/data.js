/* ------------------------------------------------------------------
   King County Play Equity Report — concept prototype data
   IMPORTANT: Everything in SAMPLE is illustrative placeholder data used
   to demonstrate the experience. Final figures will come from the UW
   research team's de-identified analysis files.
   BASELINE values are real, published 2019 State of Play figures.
------------------------------------------------------------------- */
window.PE = window.PE || {};

PE.BASELINE = [
  { value: "19%", label: "of King County youth met the CDC's 60-minutes-a-day activity guideline", src: "Seattle Parks & Recreation summary of State of Play (2019)", url: "https://www.seattle.gov/Documents/Departments/ParksAndRecreation/PoliciesPlanning/SPR_Strategic_Plan.03.27.2020.pdf" },
  { value: "D", label: "grade given to Seattle–King County for getting youth physically active", src: "Seattle Parks Foundation", url: "https://www.seattleparksfoundation.org/king-county-play-equity-coalition-centering-youth-access-to-the-outdoors/" },
  { value: "13%", label: "of youth had never joined organized sports or activities because of cost", src: "Seattle Parks & Recreation summary of State of Play (2019)", url: "https://www.seattle.gov/Documents/Departments/ParksAndRecreation/PoliciesPlanning/SPR_Strategic_Plan.03.27.2020.pdf" },
  { value: "~3×", label: "more likely to have never played organized sports if English isn't spoken at home", src: "Aspen Institute, State of Play Seattle–King County", url: "https://www.aspeninstitute.org/blog-posts/key-findings-on-youth-sports-in-seattle-king-county-washington/" }
];

PE.FILTERS = {
  age:    { label: "Age",                options: [["all","All ages"],["5-9","Ages 5–9"],["10-13","Ages 10–13"],["14-18","Ages 14–18"]] },
  gender: { label: "Gender",             options: [["all","All youth"],["girls","Girls"],["boys","Boys"],["nb","Nonbinary / another identity"]] },
  region: { label: "Region",             options: [["all","All of King County"],["seattle","Seattle"],["north","North King County"],["east","East King County"],["south","South King County"]] },
  income: { label: "Household income",   options: [["all","All incomes"],["low","Under $50K"],["mid","$50K–$100K"],["high","$100K+"]] },
  lang:   { label: "Language at home",   options: [["all","All languages"],["en","English"],["other","Language other than English"]] }
};

/* share of sample in each group (for n + small-cell suppression demo) */
PE.SHARE = {
  age:    { "5-9": .34, "10-13": .33, "14-18": .33 },
  gender: { girls: .48, boys: .49, nb: .03 },
  region: { seattle: .32, north: .12, east: .27, south: .29 },
  income: { low: .27, mid: .31, high: .42 },
  lang:   { en: .71, other: .29 }
};
PE.N_TOTAL = 2412; // placeholder sample size
PE.SUPPRESS_BELOW = 10;

PE.SPORTS = [
  // name, base %, modifiers per filter value
  { k: "Basketball",          b: 31, m: { girls: .7, boys: 1.3, low: 1.15, high: .9, south: 1.15, "14-18": 1.1 } },
  { k: "Soccer",              b: 29, m: { "5-9": 1.3, "14-18": .75, other: 1.25, south: 1.1 } },
  { k: "Swimming",            b: 26, m: { low: .55, high: 1.3, other: .7, "5-9": 1.35, east: 1.2 } },
  { k: "Running / track",     b: 19, m: { "14-18": 1.4, "5-9": .6 } },
  { k: "Baseball / softball", b: 15, m: { boys: 1.25, girls: .75, low: .7, high: 1.2, north: 1.15 } },
  { k: "Dance",               b: 14, m: { girls: 1.9, boys: .25, nb: 1.6, other: 1.1 } },
  { k: "Volleyball",          b: 12, m: { girls: 1.75, boys: .35, "14-18": 1.4, "5-9": .4, south: 1.1 } },
  { k: "Bicycling",           b: 12, m: { high: 1.3, low: .7, east: 1.25, north: 1.15 } },
  { k: "Martial arts",        b: 9,  m: { "5-9": 1.4, "14-18": .7, east: 1.2 } },
  { k: "Tackle / flag football", b: 9, m: { boys: 1.75, girls: .25, south: 1.25, "10-13": 1.2 } },
  { k: "Gymnastics",          b: 8,  m: { girls: 1.6, boys: .45, "5-9": 1.6, "14-18": .4, low: .6 } },
  { k: "Tennis / pickleball", b: 7,  m: { high: 1.5, low: .45, east: 1.3 } },
  { k: "Skateboarding",       b: 6,  m: { boys: 1.3, nb: 1.8, seattle: 1.3, "10-13": 1.3 } },
  { k: "Ultimate frisbee",    b: 5,  m: { seattle: 1.4, high: 1.3, "14-18": 1.2 } }
];

PE.BARRIERS = [
  { k: "Costs too much",                 b: 34, m: { low: 1.55, high: .55, other: 1.25, south: 1.2 } },
  { k: "Schedules don't work for family", b: 31, m: { mid: 1.1, "14-18": 1.15 } },
  { k: "No way to get there",             b: 22, m: { low: 1.6, high: .6, south: 1.3, east: .85, other: 1.3 } },
  { k: "No program close by",             b: 20, m: { south: 1.35, north: 1.1, seattle: .7 } },
  { k: "Doesn't feel welcome",            b: 17, m: { girls: 1.25, nb: 2.1, other: 1.4, low: 1.3, "14-18": 1.25 } },
  { k: "Worried about getting hurt",      b: 15, m: { low: 1.4, girls: 1.2, "5-9": 1.2 } },
  { k: "Info not in our language",        b: 9,  m: { other: 2.6, en: .2 } },
  { k: "Not accessible for disability",   b: 7,  m: {} }
];

PE.ACTIVITY = [ // % meeting 60 minutes, sample by age
  { k: "Ages 5–9", b: 34 }, { k: "Ages 10–13", b: 25 }, { k: "Ages 14–18", b: 16 }
];
PE.ACT_MOD = { girls: .8, boys: 1.18, nb: .7, low: .82, high: 1.12, other: .8, south: .9, east: 1.08 };

/* Hex tile map of King County sub-areas (sample values) */
PE.AREAS = [
  // q,r axial-ish grid positions (col,row), region, name, metrics
  { c:2, r:0, reg:"north",   n:"Shoreline / Lake Forest Park", park:78, prog:3.1, none:14 },
  { c:3, r:0, reg:"north",   n:"Bothell / Kenmore",            park:64, prog:2.6, none:18 },
  { c:4, r:0, reg:"east",    n:"Woodinville",                  park:41, prog:2.2, none:21 },
  { c:1, r:1, reg:"seattle", n:"NW Seattle",                   park:91, prog:4.4, none:9  },
  { c:2, r:1, reg:"seattle", n:"NE Seattle",                   park:88, prog:4.1, none:10 },
  { c:3, r:1, reg:"east",    n:"Kirkland / Redmond",           park:72, prog:3.6, none:12 },
  { c:4, r:1, reg:"east",    n:"Sammamish",                    park:55, prog:3.0, none:15 },
  { c:5, r:1, reg:"east",    n:"Snoqualmie Valley",            park:33, prog:1.4, none:31 },
  { c:1, r:2, reg:"seattle", n:"Central & Downtown Seattle",   park:95, prog:5.2, none:8  },
  { c:2, r:2, reg:"seattle", n:"SE Seattle",                   park:83, prog:3.0, none:19 },
  { c:3, r:2, reg:"east",    n:"Bellevue / Mercer Island",     park:76, prog:3.9, none:11 },
  { c:4, r:2, reg:"east",    n:"Issaquah",                     park:58, prog:2.8, none:16 },
  { c:0, r:3, reg:"south",   n:"Vashon-Maury Island",          park:38, prog:1.1, none:29 },
  { c:1, r:3, reg:"seattle", n:"West Seattle / White Center",  park:74, prog:2.4, none:23 },
  { c:2, r:3, reg:"south",   n:"Tukwila / SeaTac / Burien",    park:52, prog:1.6, none:33 },
  { c:3, r:3, reg:"south",   n:"Renton",                       park:57, prog:1.9, none:27 },
  { c:2, r:4, reg:"south",   n:"Des Moines / Federal Way",     park:46, prog:1.5, none:35 },
  { c:3, r:4, reg:"south",   n:"Kent",                         park:44, prog:1.7, none:32 },
  { c:4, r:4, reg:"south",   n:"Covington / Maple Valley",     park:36, prog:1.3, none:30 },
  { c:3, r:5, reg:"south",   n:"Auburn",                       park:42, prog:1.6, none:34 },
  { c:4, r:5, reg:"south",   n:"Enumclaw & rural SE",          park:24, prog:0.9, none:38 }
];
PE.AREA_METRICS = {
  park: { label: "Youth within a 10-minute walk of a park or field", unit: "%", higherIsBetter: true },
  prog: { label: "Low- or no-cost youth programs per 1,000 youth",   unit: "",  higherIsBetter: true },
  none: { label: "Families who say there's no program near them",   unit: "%", higherIsBetter: false }
};

/* Youth Action Mapping — sample observations placed on the places illustration */
PE.PINS = [
  { x: 22, y: 18, t: "Court", title: "Hoops with no nets", who: "Team Rainier, age 15", note: "Two of three hoops have no nets and the lights shut off at 7 p.m. in winter — exactly when older kids are done with school and jobs.", tag: "Facility condition" },
  { x: 62, y: 30, t: "Field", title: "Field is always booked", who: "Team Duwamish, age 13", note: "Every weekday slot was reserved by club teams. We couldn't find a single open-play hour on the permit calendar.", tag: "Access & scheduling" },
  { x: 40, y: 52, t: "Lake",  title: "Free swim, but nobody knows", who: "Team Cedar, age 16", note: "The pool has free youth swim on Saturdays, but the flyer is only online and only in English.", tag: "Information & language" },
  { x: 74, y: 64, t: "Station", title: "Light rail = freedom", who: "Team Green River, age 17", note: "The station two blocks from the courts is the reason we can get here without a parent driving. More of this.", tag: "Transportation" },
  { x: 30, y: 80, t: "Park", title: "Best playground in the area", who: "Team Rainier, age 12", note: "Shade, water fountain, adaptive swings. Our younger siblings come here every day in summer.", tag: "Bright spot" }
];

/* Community Advisory Board — video placeholders */
PE.CAB = [
  { name: "CAB member — Parent, South King County", q: "“I joined because my kids were the ones on the sidelines.”", len: "1:42", pos: "10% 40%" },
  { name: "CAB member — Youth coach, Seattle",      q: "“Coaches are the front door to sport. Train us and the door stays open.”", len: "2:05", pos: "45% 35%" },
  { name: "CAB member — High school student",       q: "“They actually listened. Our map is in the report.”", len: "1:18", pos: "62% 70%" },
  { name: "CAB member — Parks & rec leader",        q: "“Data like this is how we make the case for a field in our neighborhood.”", len: "2:31", pos: "88% 40%" },
  { name: "CAB member — Community organizer",       q: "“Equity means the information shows up in Somali, Spanish and Vietnamese, too.”", len: "1:56", pos: "30% 55%" },
  { name: "CAB member — Adaptive sports advocate",  q: "“Every kid includes kids who use a wheelchair.”", len: "1:33", pos: "75% 30%" }
];

PE.LIBRARY = [
  { t: "Can Screens and Physical Activity Co-Exist?", topic: "Families", fmt: "Brief", status: "Published", url: "https://www.kcplayequity.org/resources/can-screens-and-physical-activity-co-exist", d: "Coalition resource on how cost, safety and infrastructure shape screen time vs. play." },
  { t: "State of Play Seattle–King County (2019)", topic: "Baseline", fmt: "Full report", status: "Published", url: "https://www.aspeninstitute.org/news/state-of-play-seattle-king-county/", d: "The original Aspen Institute / UW / King County Parks landscape study this report builds on." },
  { t: "Girls in Motion: Keeping Girls in Sport Past Age 13", topic: "Girls & gender", fmt: "Data brief", status: "Coming 2027", d: "Sample supplemental brief — dropout patterns and what keeps girls playing." },
  { t: "Every Kid Includes Kids with Disabilities", topic: "Disability & adaptive", fmt: "Data brief", status: "Coming 2027", d: "Sample brief on adaptive programming, facility access and family experience." },
  { t: "Getting There: Transportation and Play", topic: "Transportation", fmt: "Map story", status: "Coming 2027", d: "Sample interactive map story pairing transit access with program locations." },
  { t: "Youth Action Mapping: Full Team Findings", topic: "Youth voice", fmt: "Youth report", status: "Coming 2027", d: "Youth-authored findings from each mapping team, with photos and recommendations." },
  { t: "Coaches as the Front Door", topic: "Coaching", fmt: "Data brief", status: "Coming 2027", d: "Sample brief drawing on the 35 stakeholder interviews about coach recruitment and training." },
  { t: "Methods & Technical Appendix", topic: "Methods", fmt: "Technical", status: "With launch", d: "Survey instruments, weighting, sample sizes, suppression rules and limitations." }
];
