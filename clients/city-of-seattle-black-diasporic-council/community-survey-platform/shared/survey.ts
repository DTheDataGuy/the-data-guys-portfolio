/**
 * Survey instrument: stable question IDs (Q01–Q37 follow the Microsoft Forms numbering reviewed by the project team),
 * option codes stored in the database, and display labels kept separately (keyed by language) so translations can be added
 * without changing stored data.
 */
export const SURVEY_VERSION = "2026.09-v1";
export type Lang = "en";
export type Opt = { code: string; label: string; hint?: string; exclusive?: boolean; other?: boolean };
export type QType = "single" | "multi" | "text" | "longtext" | "zip" | "likert" | "scale5" | "rank" | "pick_rank" | "assets" | "text3";
export type Question = {
  id: string; section: SectionId; type: QType; label: string; help?: string; options?: Opt[];
  max?: number; placeholder?: string; minLabel?: string; maxLabel?: string; scaleLabels?: string[];
  /** conditional follow-ups rendered under the question */
  followups?: { id: string; when: string; label: string; placeholder?: string }[];
  analysis?: string;
};
export type SectionId = "about" | "belonging" | "community" | "priorities" | "vision" | "followup";
export const SECTIONS: { id: SectionId | "review"; title: string; blurb: string }[] = [
  { id: "about", title: "About You", blurb: "A few questions about who you are and your connection to Seattle. Every question is optional." },
  { id: "belonging", title: "Community & Belonging", blurb: "How much do you agree or disagree with each statement? There are no right answers." },
  { id: "community", title: "Where You Find Community", blurb: "The places, groups and networks that matter to you, and what gets in the way." },
  { id: "priorities", title: "Community Priorities", blurb: "The issues that matter most, and how well City programs reach your community." },
  { id: "vision", title: "Vision & Future", blurb: "In your own words. Please avoid names or details that could identify you or others." },
  { id: "followup", title: "Follow-Up", blurb: "How you would like to stay involved. Contact details are collected separately, never with your answers." },
  { id: "review", title: "Review & Submit", blurb: "Check your answers. You can go back to any section before submitting." },
];

export const LIKERT: Opt[] = [
  { code: "4", label: "Strongly agree" },
  { code: "3", label: "Somewhat agree" },
  { code: "2", label: "Disagree" },
  { code: "1", label: "Strongly disagree" },
  { code: "na", label: "Prefer not to answer / not applicable" },
];

export type LikertMeta = { id: string; text: string; short: string; direction: "positive" | "negative" | "descriptive"; construct: string };
export const LIKERT_ITEMS: LikertMeta[] = [
  { id: "Q09", text: "I live in a community where many neighbors share my ethnicity.", short: "Neighbors share my ethnicity", direction: "descriptive", construct: "Ethnic community proximity" },
  { id: "Q10", text: "I live in a community where few people share my ethnicity, which can feel isolating.", short: "Isolated where I live", direction: "negative", construct: "Isolation" },
  { id: "Q11", text: "I feel connected to Seattle’s Black diasporic community.", short: "Connected to the diaspora", direction: "positive", construct: "Belonging" },
  { id: "Q12", text: "I can readily connect with people who share my ethnicity and background.", short: "Can connect with my community", direction: "positive", construct: "Community accessibility" },
  { id: "Q13", text: "Finding community in Seattle can be challenging.", short: "Finding community is hard", direction: "negative", construct: "Community accessibility" },
  { id: "Q14", text: "I have access to resources that build connections across Black diasporic communities.", short: "Access to cross-diaspora resources", direction: "positive", construct: "Cross-diaspora resource access" },
  { id: "Q15", text: "It is difficult to connect with people who share my concerns.", short: "Hard to find shared concerns", direction: "negative", construct: "Isolation" },
  { id: "Q16", text: "Seattle policy addresses issues important to me.", short: "Policy addresses my issues", direction: "positive", construct: "Government responsiveness" },
  { id: "Q17", text: "I know of Seattle organizations where people who share my ethnicity can connect.", short: "Know organizations for my community", direction: "positive", construct: "Community accessibility" },
  { id: "Q18", text: "I feel my voice is heard by local government.", short: "Voice heard by local government", direction: "positive", construct: "Civic voice" },
  { id: "Q19", text: "Seattle’s Black communities across ethnic origins are unified.", short: "Communities are unified", direction: "positive", construct: "Cross-diaspora unity" },
  { id: "Q20", text: "Seattle’s Black diasporic communities miss valuable opportunities for unity.", short: "Missed opportunities for unity", direction: "negative", construct: "Cross-diaspora unity" },
];

export const IDENTITY_OPTS: Opt[] = [
  { code: "african_american", label: "African American / Black American" },
  { code: "african_immigrant", label: "African immigrant" },
  { code: "caribbean", label: "Caribbean / Afro-Caribbean" },
  { code: "afro_latino", label: "Afro-Latino / Black Latino" },
  { code: "mixed", label: "Mixed Black heritage" },
  { code: "other", label: "Another Black diasporic identity", other: true },
];

export const PRIORITY_OPTS: Opt[] = [
  ["housing", "Affordable housing"], ["homeownership", "Homeownership"], ["public_safety", "Public safety"], ["education", "Education"],
  ["black_business", "Black-owned businesses"], ["arts_culture", "Arts & culture"], ["mental_health", "Mental health"], ["healthcare", "Healthcare"],
  ["transportation", "Transportation"], ["environmental_justice", "Environmental justice"], ["youth", "Youth opportunities"], ["seniors", "Senior services"],
  ["employment", "Employment"], ["wealth", "Wealth building"], ["civic_participation", "Civic participation"], ["political_rep", "Political representation"],
  ["criminal_justice", "Criminal justice"], ["food_security", "Food security"], ["tech_access", "Technology access"], ["other", "Other"],
].map(([code, label]) => ({ code, label, other: code === "other" }));

export const ORG_TYPES = ["Faith", "Culture", "Business", "Civic", "Social justice", "Education", "Youth", "Professional", "Social / affinity", "Arts", "Mutual aid", "Community center", "Informal / online network", "Other"];

const opts = (pairs: [string, string][], extra: Partial<Record<string, Partial<Opt>>> = {}): Opt[] => pairs.map(([code, label]) => ({ code, label, ...(extra[code] || {}) }));
const scale5 = (a: string, b: string) => [a, "2", "3", "4", b];

export const QUESTIONS: Question[] = [
  // ---------- About you ----------
  { id: "Q01", section: "about", type: "single", label: "Age", options: opts([["u18", "Under 18"], ["18_24", "18–24"], ["25_34", "25–34"], ["35_44", "35–44"], ["45_54", "45–54"], ["55_64", "55–64"], ["65_74", "65–74"], ["75p", "75+"], ["pns", "Prefer not to say"]]) },
  { id: "Q02", section: "about", type: "single", label: "Gender", options: opts([["female", "Female"], ["male", "Male"], ["nonbinary", "Nonbinary / gender diverse"], ["self", "Self-describe"], ["pns", "Prefer not to say"]], { self: { other: true } }),
    followups: [{ id: "Q02_self", when: "self", label: "Please describe", placeholder: "In your own words" }] },
  { id: "Q03", section: "about", type: "zip", label: "ZIP code", help: "Five digits. Used only to understand which parts of the region are represented, always in groups, never on its own.", placeholder: "98118" },
  { id: "Q04", section: "about", type: "multi", label: "How do you identify?", help: "Select all that apply. You are never limited to one identity.", options: IDENTITY_OPTS,
    followups: [
      { id: "Q04_african", when: "african_immigrant", label: "Country or region of heritage or origin (optional)", placeholder: "e.g. Ethiopia, Nigeria, Somalia, Ghana" },
      { id: "Q04_caribbean", when: "caribbean", label: "Country, island or heritage (optional)", placeholder: "e.g. Jamaica, Haiti, Trinidad and Tobago" },
      { id: "Q04_latino", when: "afro_latino", label: "Country or heritage (optional)", placeholder: "e.g. Dominican Republic, Colombia, Brazil" },
      { id: "Q04_other", when: "other", label: "Please describe", placeholder: "In your own words" },
    ] },
  { id: "Q05", section: "about", type: "single", label: "How long have you lived in the Seattle area?", options: opts([["lt1", "Less than 1 year"], ["1_2", "1–2 years"], ["3_5", "3–5 years"], ["6_10", "6–10 years"], ["11_20", "11–20 years"], ["gt20", "More than 20 years"], ["born", "Born and/or raised in the Seattle area"], ["not_resident", "I don’t currently live in the Seattle area"]]) },
  { id: "Q06", section: "about", type: "longtext", label: "How would you describe your specific ethnicity or heritage?",
    help: "If you had the full opportunity to describe your ethnicity, heritage or diasporic identity in your own words, how would you describe it? For example: Black with African roots descended from enslaved peoples in America; Black of African descent; an African immigrant from a specific country or region; Black with mixed European roots; or any description that fits you.", placeholder: "In your own words" },
  { id: "Q07", section: "about", type: "text", label: "What specific language(s) or dialect(s) are spoken within your household or cultural community?", placeholder: "e.g. English, Amharic, Somali, Haitian Creole, AAVE" },
  { id: "Q08", section: "about", type: "multi", label: "What best describes your relationship to Seattle?", help: "Select all that apply.",
    options: opts([["native", "Native Seattleite / lifelong Seattle resident"], ["long_term", "Long-term Seattle resident"], ["first_gen_us", "First generation born in America"], ["first_gen_sea", "First-generation Seattleite"], ["new", "New to the area / recent transplant"], ["former", "Former Seattle resident, still connected"], ["other", "Something else"]], { other: { other: true } }),
    followups: [{ id: "Q08_other", when: "other", label: "Please describe", placeholder: "In your own words" }] },

  // ---------- Belonging (Likert block) ----------
  ...LIKERT_ITEMS.map((l): Question => ({ id: l.id, section: "belonging", type: "likert", label: l.text, options: LIKERT, analysis: l.construct })),

  // ---------- Where you find community ----------
  { id: "Q21", section: "community", type: "multi", label: "Where do you find community?", help: "Select all that apply.",
    options: opts([
      ["meetings", "Community meetings and gatherings"], ["festivals", "Cultural festivals and events"], ["faith", "Faith-based activities"], ["networking", "Networking / business affiliations"],
      ["education", "Schools and education"], ["affinity", "Affinity groups"], ["affinity_new", "Newer affinity groups (e.g. Traveling While Black, Hey Black Seattle)"],
      ["affinity_est", "Established social / affinity groups (e.g. sororities, fraternities, Boulé, The Links)"], ["clubs", "Social groups / clubs"],
      ["development", "Personal / professional development"], ["social_justice", "Social justice organizations (e.g. NAACP, Urban League)"], ["civic", "Political / civic engagement"],
      ["issue", "Issue-specific discussions and actions"], ["volunteer", "Volunteer service"], ["none", "None of these"], ["other", "Other"],
    ], { none: { exclusive: true }, other: { other: true } }),
    followups: [{ id: "Q21_other", when: "other", label: "Where else?", placeholder: "Describe" }] },
  { id: "Q22", section: "community", type: "assets", label: "List up to three places or organizations where you find supportive community.", help: "Name, type and whether it’s newly formed or well established, if you know. Organizations are never listed publicly as speaking for a community." },
  { id: "Q23", section: "community", type: "multi", label: "Which barriers, if any, have you faced when trying to connect with Black community members outside your own ethnic or cultural group?", help: "Select all that apply.",
    options: opts([["opportunities", "Limited opportunities for inter-group interaction"], ["spaces", "Lack of shared physical spaces"], ["customs", "Differences in cultural customs or language"], ["information", "Not enough information about other groups’ events"], ["goals", "Perceived lack of common goals or interests"], ["none", "None, I feel well connected across the diaspora"]], { none: { exclusive: true } }) },

  // ---------- Priorities ----------
  { id: "Q25", section: "priorities", type: "pick_rank", label: "What are the most important issues facing your community?", help: "Choose up to five, in order of importance. The first one you choose is #1. You can reorder them after.", options: PRIORITY_OPTS, max: 5,
    followups: [{ id: "Q25_other", when: "other", label: "Other issue", placeholder: "Describe" }] },
  { id: "Q28", section: "priorities", type: "scale5", label: "How would you rate the effectiveness of current Seattle City programs in reaching and supporting diverse Black diasporic groups?", scaleLabels: scale5("Not effective at all", "Highly effective"), options: opts([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["na", "Not sure"]]) },
  { id: "Q29", section: "priorities", type: "scale5", label: "How would you characterize your level of engagement with current local civic activities or neighborhood councils?", scaleLabels: scale5("Not engaged", "Very active"), options: opts([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["na", "Not sure"]]) },
  { id: "Q30", section: "priorities", type: "scale5", label: "To what extent do current City outreach methods reach members of your specific diasporic community?", scaleLabels: scale5("Not effective", "Very effective"), options: opts([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["na", "Not sure"]]) },
  { id: "Q31", section: "priorities", type: "rank", label: "Rank the barriers you have encountered when trying to access City services or programs.", help: "Tap them in order, from most significant to least. Rank as many as apply.",
    options: opts([["information", "Lack of information / awareness"], ["language", "Language or communication barriers"], ["complex", "Complex application processes"], ["cultural", "Concerns about cultural relevance / sensitivity"], ["trust", "Lack of trust in government"]]) },

  // ---------- Vision ----------
  { id: "Q24", section: "vision", type: "text3", label: "What are the three greatest challenges facing Seattle’s Black communities that a Black Diasporic Council could help address?", help: "One challenge per box." },
  { id: "Q26", section: "vision", type: "longtext", label: "What do you believe is the greatest strength of Seattle’s Black diasporic communities?" },
  { id: "Q27", section: "vision", type: "longtext", label: "Complete this sentence: My vision for Seattle’s Black diasporic community is…", placeholder: "My vision is…" },
  { id: "Q36", section: "vision", type: "longtext", label: "Beyond a proposed council, what other resources or support should the City of Seattle prioritize to strengthen the Black diaspora?" },

  // ---------- Follow-up ----------
  { id: "Q32", section: "followup", type: "single", label: "Would you be interested in taking part in a follow-up focus group or listening session?", options: opts([["yes", "Yes"], ["no", "No"], ["maybe", "Maybe / I’d like more information"]]),
    help: "If yes, you’ll get a link to a separate sign-up form after you submit, so your name is never attached to these answers." },
  { id: "Q33", section: "followup", type: "scale5", label: "How comfortable would you feel sharing your experiences or feedback in an open community forum?", scaleLabels: ["Very uncomfortable", "Somewhat uncomfortable", "Neutral", "Somewhat comfortable", "Very comfortable"], options: opts([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]]) },
  { id: "Q34", section: "followup", type: "scale5", label: "How comfortable would you feel sharing your experiences or feedback in a small focus group?", scaleLabels: ["Very uncomfortable", "Somewhat uncomfortable", "Neutral", "Somewhat comfortable", "Very comfortable"], options: opts([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]]) },
  { id: "Q35", section: "followup", type: "multi", label: "Which formats would best encourage you to take part in future Black Diasporic Council discussions?", help: "Select all that apply.",
    options: opts([["town_hall", "In-person town halls"], ["webinar", "Virtual webinars"], ["small_group", "Small group focus sessions"], ["walking_tour", "Community walking tours"], ["message_board", "Online message boards"], ["workshop", "Interactive workshops"]]) },
  { id: "Q37", section: "followup", type: "single", label: "How would you prefer to receive updates about the potential formation of a Black Diasporic Council?",
    options: opts([["email", "Email newsletter"], ["text", "Text message alerts"], ["social", "Social media updates"], ["mail", "Mailers to home address"], ["none", "I don’t need updates"]]) },
];
export const Q = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<string, Question>;
export const optLabel = (qid: string, code: string | null | undefined) => (code == null ? "" : Q[qid]?.options?.find((o) => o.code === code)?.label ?? code);

/** Open-text fields that go into the qualitative review queue. */
export const OPEN_TEXT_FIELDS: { id: string; label: string; kind: "identity" | "challenge" | "strength" | "vision" | "resources" | "other" }[] = [
  { id: "Q06", label: "Heritage in own words", kind: "identity" },
  { id: "Q24_1", label: "Challenge 1", kind: "challenge" }, { id: "Q24_2", label: "Challenge 2", kind: "challenge" }, { id: "Q24_3", label: "Challenge 3", kind: "challenge" },
  { id: "Q26", label: "Greatest strength", kind: "strength" },
  { id: "Q27", label: "Vision", kind: "vision" },
  { id: "Q36", label: "Other resources / support", kind: "resources" },
];

/* ---------------- Analytical classification (never replaces self-identification) ---------------- */
export type BdCode = "BD-01" | "BD-02" | "BD-03" | "BD-04" | "BD-05" | "BD-06";
export const BD_GROUPS: { code: BdCode; name: string; short: string; desc: string }[] = [
  { code: "BD-01", name: "African American / Black American", short: "African American", desc: "Multigenerational Black Americans and descendants of people enslaved in the United States, where applicable." },
  { code: "BD-02", name: "East African", short: "East African", desc: "e.g. Somali, Ethiopian, Eritrean, Oromo, Amhara, Tigrayan, Sudanese, South Sudanese, Kenyan." },
  { code: "BD-03", name: "West / Central African", short: "West / Central African", desc: "e.g. Nigerian, Ghanaian, Liberian, Sierra Leonean, Cameroonian, Congolese, Senegalese, Gambian." },
  { code: "BD-04", name: "Caribbean / Afro-Caribbean", short: "Caribbean", desc: "e.g. Jamaican, Haitian, Trinidadian and Tobagonian, Barbadian, Bahamian, Guyanese." },
  { code: "BD-05", name: "Afro-Latino / Black Latino", short: "Afro-Latino", desc: "People who identify both as Black and with Latin American or Hispanic heritage." },
  { code: "BD-06", name: "Other Black Diaspora / Mixed Black Heritage", short: "Other / Mixed", desc: "Multiracial Black identities and identities not adequately represented by the other five groups." },
];
export const BD_NAME = Object.fromEntries(BD_GROUPS.map((g) => [g.code, g.name])) as Record<BdCode, string>;
export const BD_SHORT = Object.fromEntries(BD_GROUPS.map((g) => [g.code, g.short])) as Record<BdCode, string>;

const EAST = ["somali", "somalia", "ethiopia", "ethiopian", "eritrea", "eritrean", "oromo", "amhara", "tigray", "tigrayan", "sudan", "sudanese", "kenya", "kenyan", "uganda", "ugandan", "tanzania", "tanzanian", "rwanda", "rwandan", "burundi", "djibouti", "habesha", "east africa"];
const WEST_CENTRAL = ["nigeria", "nigerian", "ghana", "ghanaian", "liberia", "liberian", "sierra leone", "cameroon", "cameroonian", "congo", "congolese", "senegal", "senegalese", "gambia", "gambian", "ivory coast", "cote d'ivoire", "côte d’ivoire", "ivorian", "togo", "togolese", "benin", "mali", "malian", "guinea", "guinean", "burkina", "niger", "chad", "gabon", "angola", "angolan", "yoruba", "igbo", "west africa", "central africa"];
const CARIB = ["jamaica", "jamaican", "haiti", "haitian", "trinidad", "tobago", "barbados", "barbadian", "bajan", "bahamas", "bahamian", "guyana", "guyanese", "grenada", "st. lucia", "saint lucia", "antigua", "dominica", "st. vincent", "virgin islands", "belize", "caribbean", "west indian", "bermuda"];
const LATINO = ["dominican", "puerto ric", "cuba", "cuban", "colombia", "brazil", "brazilian", "panama", "honduras", "garifuna", "venezuela", "peru", "mexic", "afro-latin", "afrolatin", "latino", "latina", "latinx", "hispanic"];
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whole-word match at the start of a word (so "mali" never matches inside "somali", while "puerto ric" still matches "puerto rican"). */
const has = (t: string, words: string[]) => words.some((w) => new RegExp(`(^|[^a-z\u00c0-\u024f])${esc(w)}`, "i").test(t));

/**
 * Suggest analytical codes from the respondent's own selections and text. Returns codes plus the reason for each, so analysts can review.
 * Rules are deterministic and documented on the Methodology page. African heritage that cannot be placed by region is left for analyst review.
 */
export function suggestBd(identity: string[], txt: { african?: string; caribbean?: string; latino?: string; other?: string; heritage?: string }): { code: BdCode | "REVIEW"; reason: string }[] {
  const out: { code: BdCode | "REVIEW"; reason: string }[] = [];
  const add = (code: BdCode | "REVIEW", reason: string) => { if (!out.some((o) => o.code === code)) out.push({ code, reason }); };
  if (identity.includes("african_american")) add("BD-01", "Selected African American / Black American");
  if (identity.includes("african_immigrant")) {
    const t = `${txt.african || ""} ${txt.heritage || ""}`.toLowerCase();
    const e = has(t, EAST), w = has(t, WEST_CENTRAL);
    if (e) add("BD-02", `Selected African heritage; origin text mentions an East African country or people`);
    if (w) add("BD-03", `Selected African heritage; origin text mentions a West or Central African country or people`);
    if (!e && !w) add("REVIEW", "Selected African heritage; region not stated or not recognised — analyst review");
  }
  if (identity.includes("caribbean")) add("BD-04", "Selected Caribbean / Afro-Caribbean");
  if (identity.includes("afro_latino")) add("BD-05", "Selected Afro-Latino / Black Latino");
  if (identity.includes("mixed")) add("BD-06", "Selected Mixed Black heritage");
  if (identity.includes("other")) add("BD-06", "Selected another Black diasporic identity");
  return out;
}

/* ---------------- Geography (approximate; ZIP codes cross neighborhood boundaries) ---------------- */
export type Sector = "North" | "Central" | "South" | "West Seattle" | "Downtown" | "Outside Seattle";
export const SEATTLE_ZIPS: Record<string, { area: string; sector: Sector; cd?: boolean; x: number; y: number }> = {
  "98177": { area: "Broadview / Richmond Beach", sector: "North", x: 1, y: 0 },
  "98133": { area: "Bitter Lake / Northgate W", sector: "North", x: 2, y: 0 },
  "98125": { area: "Lake City / Northgate", sector: "North", x: 3, y: 0 },
  "98117": { area: "Crown Hill / Loyal Heights", sector: "North", x: 0, y: 1 },
  "98103": { area: "Greenwood / Fremont / Wallingford", sector: "North", x: 1, y: 1 },
  "98115": { area: "Wedgwood / Ravenna / Maple Leaf", sector: "North", x: 2, y: 1 },
  "98105": { area: "University District / Laurelhurst", sector: "North", x: 3, y: 1 },
  "98107": { area: "Ballard", sector: "North", x: 0, y: 2 },
  "98199": { area: "Magnolia", sector: "North", x: 0, y: 3 },
  "98119": { area: "Queen Anne", sector: "North", x: 1, y: 2 },
  "98109": { area: "South Lake Union / E Queen Anne", sector: "Central", x: 1, y: 3 },
  "98102": { area: "Eastlake / N Capitol Hill", sector: "Central", x: 2, y: 2 },
  "98112": { area: "Madison Park / Montlake", sector: "Central", cd: true, x: 3, y: 2 },
  "98121": { area: "Belltown", sector: "Downtown", x: 0, y: 4 },
  "98101": { area: "Downtown", sector: "Downtown", x: 1, y: 4 },
  "98104": { area: "Pioneer Square / Chinatown-ID", sector: "Downtown", x: 1, y: 5 },
  "98122": { area: "Central District / Capitol Hill", sector: "Central", cd: true, x: 2, y: 3 },
  "98144": { area: "Mount Baker / Leschi / Judkins Park", sector: "Central", cd: true, x: 2, y: 4 },
  "98134": { area: "SoDo", sector: "South", x: 1, y: 6 },
  "98116": { area: "Alki / Admiral", sector: "West Seattle", x: 0, y: 5 },
  "98126": { area: "Delridge / High Point", sector: "West Seattle", x: 0, y: 6 },
  "98136": { area: "Fauntleroy / Morgan Junction", sector: "West Seattle", x: 0, y: 7 },
  "98106": { area: "Highland Park / South Park", sector: "South", x: 1, y: 7 },
  "98108": { area: "Beacon Hill / Georgetown", sector: "South", x: 2, y: 5 },
  "98118": { area: "Columbia City / Rainier Valley", sector: "South", x: 3, y: 5 },
  "98178": { area: "Rainier Beach / Skyway", sector: "South", x: 3, y: 6 },
  "98146": { area: "White Center / Burien N", sector: "South", x: 1, y: 8 },
  "98168": { area: "Tukwila / Boulevard Park", sector: "South", x: 2, y: 7 },
};
export function geoOf(zip: string | null | undefined): { zip: string | null; area: string; sector: Sector | "Not given"; cd: boolean } {
  if (!zip) return { zip: null, area: "Not given", sector: "Not given", cd: false };
  const z = SEATTLE_ZIPS[zip];
  if (z) return { zip, area: z.area, sector: z.sector, cd: !!z.cd };
  return { zip, area: /^98[0-4]/.test(zip) ? "Elsewhere in the Puget Sound region" : "Outside the Puget Sound region", sector: "Outside Seattle", cd: false };
}

/* ---------------- Default qualitative codebook (editable; themes should emerge from responses) ---------------- */
export const DEFAULT_CODEBOOK: { code: string; name: string; keywords: string }[] = [
  ["TH-HOUS", "Housing / displacement", "housing, rent, afford, displace, gentrif, homeless, evict, homeowner, priced out"],
  ["TH-ECON", "Economic opportunity", "job, employ, wage, income, wealth, economic, career, poverty, unemploy"],
  ["TH-CONN", "Community connection", "connect, gather, together, belong, isolat, community space, network, relationship"],
  ["TH-REP", "Representation", "represent, voice, seat at the table, heard, leadership, visibility, overlooked"],
  ["TH-TRUST", "Government trust", "trust, government, city hall, accountab, promise, bureaucra, transparen"],
  ["TH-SAFE", "Public safety", "safety, safe, violence, police, crime, gun"],
  ["TH-EDU", "Education", "school, educat, student, teacher, college, literacy, tutor"],
  ["TH-HLTH", "Health / mental health", "health, mental, therapy, wellness, clinic, medical, trauma"],
  ["TH-YOUTH", "Youth", "youth, young, kids, children, teen, mentor"],
  ["TH-CULT", "Culture / arts", "culture, cultural, art, music, heritage, tradition, festival, language"],
  ["TH-BIZ", "Business ownership", "business, entrepreneur, black-owned, owner, small business, capital, loan"],
  ["TH-POWER", "Political power", "political, vote, elect, policy, council, power, advocacy"],
  ["TH-INTERGEN", "Intergenerational connection", "elder, generation, grandparent, senior, legacy, history"],
  ["TH-IMMIG", "Immigrant / refugee services", "immigra, refugee, asylum, citizenship, newcomer, language access, interpret"],
  ["TH-RACISM", "Anti-Black racism", "racism, racist, discriminat, anti-black, bias, prejudice"],
  ["TH-SOLID", "Cross-diaspora solidarity", "unity, unified, solidarity, diaspora, across, divide, division, bridge"],
].map(([code, name, keywords]) => ({ code, name, keywords }));

export const FLAG_LABEL: Record<string, string> = { review: "Requires review", internal: "Internal only", aggregate: "Safe for aggregate report" };

/* ---------------- Governance framework ---------------- */
export const GOV_DIMENSIONS = ["Representation", "Access", "Coordination", "Policy influence", "Government responsiveness", "Accountability", "Community trust", "Resource access", "Cross-diaspora coordination", "Youth representation", "Immigrant / refugee representation", "Geographic representation", "Institutional continuity"];
export const GOV_PATHWAYS = ["Strengthen existing bodies", "Coordinated network", "Formal appointed advisory council", "Chartered / formal commission"];
export const ENGAGEMENT_SOURCES = ["survey", "focus_group", "listening_session", "key_informant_interview", "community_review"] as const;
export const ENGAGEMENT_LABEL: Record<string, string> = { survey: "Survey", focus_group: "Focus group", listening_session: "Listening session", key_informant_interview: "Key-informant interview", community_review: "Community review" };
