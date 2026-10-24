(() => {
  const P = window.PROJECTS || [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  const GH = "https://github.com/DTheDataGuy/the-data-guys-portfolio";

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = prefersDark ? "dark" : "light";
  $("#theme").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  });

  /* ---------- nav ---------- */
  const nav = $(".nav");
  let lastY = 0;
  addEventListener("scroll", () => {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 8);
    nav.classList.toggle("is-hidden", y > 400 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
  }, { passive: true });
  const secs = ["featured", "work", "capabilities", "about"].map((id) => document.getElementById(id));
  const navObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) $$(".nav__links a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach((s) => s && navObs.observe(s));

  /* ---------- helpers ---------- */
  const stackHTML = (arr, n = 99) => `<div class="stack">${arr.slice(0, n).map((s) => `<span>${esc(s)}</span>`).join("")}</div>`;
  const ghIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>';
  const links = (p) => `${p.live ? `<a class="btn btn--teal" href="${p.live}" target="_blank" rel="noopener">Open live app ↗</a>` : ""}<a class="btn btn--line" href="${p.code}" target="_blank" rel="noopener">${ghIcon} View code</a>`;

  /* ---------- featured ---------- */
  const FEAT = [
    ["seattle-permits-polars-pipeline", "An end-to-end data platform on 193,747 public Seattle building permits, built four ways and proven to agree.",
      ["<strong>Polars medallion pipeline</strong> with a data contract, quarantine with reasons and a 17-check quality gate.", "<strong>dbt + DuckDB warehouse</strong>: incremental, contract-enforced fact table, SCD2 snapshot, 48 tests, 61/61 nodes passing.", "<strong>PySpark and Scala Spark</strong> jobs: windows, exact percentiles, typed Datasets.", "<strong>Four-engine parity:</strong> Polars = DuckDB = PySpark = Scala, with 0 mismatches."],
      { title: "Seattle Permits Data Platform", stack: ["Polars", "dbt", "DuckDB", "PySpark", "Scala", "Apache Spark"], code: "https://github.com/DTheDataGuy/the-data-guys-portfolio/tree/main/data-engineering" }],
    ["enterprise-wip-command-center", "Governed WIP reporting across 18+ operating companies, replacing a month-end spreadsheet marathon with one auditable system.",
      ["<strong>One calculation library</strong> shared by the API, interface and exports.", "<strong>Reconciliation</strong> across Costpoint, HCSS and Procore, with tolerance-based auto-clearing.", "<strong>Locked month-end versions</strong>, overrides with reasons, and a full audit trail.", "<strong>56 REST endpoints</strong> and 24 screens."]],
    ["wc2026-seattle-economic-dashboard", "The evidence product Seattle's sports commissioners use to talk about the FIFA World Cup 2026's local impact.",
      ["<strong>Five-method triangulation</strong> of economic impact.", "<strong>A metric register</strong> recording the source, method and evidence class of every number.", "<strong>Observed, reported and modeled figures</strong> kept visibly separate."]],
    ["community-survey-platform", "A public survey and restricted dashboard to inform whether the City of Seattle should form a Black Diasporic Council.",
      ["<strong>Small-cell suppression (k = 5)</strong> enforced in code, not policy.", "<strong>Contact details stored apart</strong> from responses.", "<strong>A versioned instrument</strong>, so translations never change stored data."]],
    ["operations-lending-impact-platform", "One operations, lending and impact platform for a community co-op, replacing scattered spreadsheets.",
      ["<strong>Contract-driven design:</strong> one dataset registry generates forms, imports, validation and the data dictionary.", "<strong>An import pipeline</strong> that accepts legacy and misspelled headers.", "<strong>Role-based views</strong> for lending, programs, finance, leadership and the board."]],
  ];
  $("#featured-list").innerHTML = FEAT.map(([id, lead, pts, ov], i) => {
    const p = ov ? { ...byId[id], ...ov } : byId[id];
    return `<article class="feat rv">
      <a class="feat__media" href="${p.live || p.code}" target="_blank" rel="noopener" aria-label="Open ${esc(p.title)}">
        <img src="${p.img}" alt="Screenshot of ${esc(p.title)}" loading="lazy" decoding="async" width="1200" height="750">
      </a>
      <div>
        <span class="feat__num">0${i + 1} / 0${FEAT.length}</span><br>
        <span class="feat__client">${esc(p.client)}</span>
        <h3>${esc(p.title)}</h3>
        <p class="sum">${lead}</p>
        <ul>${pts.map((x) => `<li>${x}</li>`).join("")}</ul>
        ${stackHTML(p.stack, 6)}
        <div class="feat__links">${links(p)}<button class="btn btn--line" data-open="${p.id}">Details</button></div>
      </div>
    </article>`;
  }).join("");

  /* ---------- grid ---------- */
  let cat = "all", q = "";
  const counts = P.reduce((a, p) => ((a[p.cat] = (a[p.cat] || 0) + 1), a), { all: P.length });
  $$(".chip").forEach((c) => ($("span", c).textContent = counts[c.dataset.cat] || 0));
  const card = (p) => `<button class="card rv" data-open="${p.id}" aria-label="${esc(p.title)}: view details">
      <div class="card__img">${p.img ? `<img src="${p.img}" alt="" decoding="async" width="1200" height="750">` : `<div class="card__ph"><span class="mono">${esc(p.stack.slice(0, 2).join(" · "))}</span><b>${esc(p.title.split(":")[0].replace(/ \(case study\)/i, ""))}</b></div>`}</div>
      <div class="card__body">
        <span class="card__client">${esc(p.client)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        <div class="card__foot">${stackHTML(p.stack, 3)}${p.live ? '<span class="badge-live">Live</span>' : ""}</div>
      </div>
    </button>`;
  const render = () => {
    const t = q.trim().toLowerCase();
    const list = P.filter((p) => (cat === "all" || p.cat === cat) && (!t || [p.title, p.client, p.summary, p.stack.join(" ")].join(" ").toLowerCase().includes(t)));
    $("#grid").innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0;
    observe($$("#grid .rv"));
  };
  $$(".chip").forEach((c) => c.addEventListener("click", () => {
    $$(".chip").forEach((x) => x.classList.toggle("is-on", x === c));
    cat = c.dataset.cat; render();
  }));
  $("#q").addEventListener("input", (e) => { q = e.target.value; render(); });

  /* ---------- drawer ---------- */
  const dlg = $("#drawer");
  const open = (id) => {
    const p = byId[id]; if (!p) return;
    $("#d-body").innerHTML = `
      <span class="feat__client">${esc(p.client)}</span>
      <h2 id="d-title">${esc(p.title)}</h2>
      ${p.img ? `<div class="d-img"><img src="${p.img}" alt="Screenshot of ${esc(p.title)}" width="1200" height="750"></div>` : ""}
      <p class="d-sum">${esc(p.summary)}</p>
      <h4>Engineering highlights</h4>
      <ul class="d-hl">${p.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
      <h4>Tech stack</h4>${stackHTML(p.stack)}
      ${p.loc ? `<h4>Code footprint</h4><p class="d-sum mono" style="font-size:14px">${p.loc.toLocaleString()} authored lines</p>` : ""}
      ${p.note ? `<p class="d-note">${esc(p.note)}</p>` : ""}
      <div class="d-links">${links(p)}</div>`;
    dlg.showModal(); dlg.scrollTop = 0;
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) { e.preventDefault(); open(b.dataset.open); } });
  $("#d-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- code excerpts ---------- */
  const SNIPS = {
    polars: { file: "seattle-permits-polars-pipeline/src/permits_pipeline/transform.py", note: "A lazy Polars plan: nothing runs until collect(), so Polars can push filters down and prune columns. Bad values become flagged nulls; rows that break a hard rule go to quarantine with the rule's name, never silently dropped.",
      code: "def split_quarantine(silver: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame]:\n    \"\"\"Quarantined rows carry the names of every rule they broke.\"\"\"\n    flagged = silver.with_columns(\n        pl.concat_list([pl.when(expr).then(pl.lit(name)).otherwise(None)\n                        for name, expr in HARD_RULES.items()])\n          .list.drop_nulls().alias(\"_violations\")\n    )\n    bad = flagged.filter(pl.col(\"_violations\").list.len() > 0)\n    good = flagged.filter(pl.col(\"_violations\").list.len() == 0).drop(\"_violations\")\n    # Cast to the contract: any drift fails the quality gate downstream.\n    return good.select([pl.col(c).cast(t) for c, t in SILVER_SCHEMA.items()]), bad\n\n# In the lazy silver plan: sentinel dates and off-map points become flagged nulls.\nin_bbox = (pl.col(\"lat_raw\").is_between(47.48, 47.74)\n           & pl.col(\"lon_raw\").is_between(-122.46, -122.22)).fill_null(False)\nplan = (typed\n    .with_columns(\n        (pl.col(\"issued_date\") - pl.col(\"applied_date\")).dt.total_days().alias(\"days_to_issue\"),\n        pl.when(in_bbox).then(pl.col(\"lat_raw\")).alias(\"latitude\"),\n        (~in_bbox).alias(\"flag_bad_geo\"),\n    )\n    .unique(subset=\"permit_num\", keep=\"last\"))" },
    dbt: { file: "seattle-permits-dbt-duckdb/models/marts/analytics/mart_contractor_concentration.sql", note: "A dbt mart on DuckDB: market concentration per year as top-10 share and the Herfindahl-Hirschman Index. It's aggregate only, because some contractors in the source are private individuals. A singular test bounds the results.",
      code: "-- How concentrated is the contractor market each year?\nwith by_contractor as (\n    select applied_year, contractor, count(*) as permits\n    from {{ ref('fct_permits') }}\n    where contractor is not null and applied_year is not null\n    group by all\n),\n\nshares as (\n    select\n        *,\n        permits::double / sum(permits) over (partition by applied_year) as share,\n        row_number() over (partition by applied_year\n                           order by permits desc, contractor) as rnk\n    from by_contractor\n)\n\nselect\n    applied_year,\n    count(*)                                           as active_contractors,\n    round(sum(case when rnk <= {{ var('top_n_contractors') }}\n                   then share else 0 end), 4)          as top_n_share,\n    round(sum(share * share) * 10000, 1)               as hhi\nfrom shares\ngroup by applied_year" },
    scala: { file: "seattle-permits-spark/scala_job/src/main/scala/com/thedataguys/permits/PermitJobs.scala", note: "Typed Scala Spark: a Dataset of case classes reduced with groupByKey and mapGroups, using a hand-written exact percentile. The parity check confirms it matches Polars, DuckDB and PySpark on every row.",
      code: "def cycleTimes(permits: Dataset[Permit], minYear: Int = 2010, minN: Int = 20): Dataset[CycleTime] = {\n  import permits.sparkSession.implicits._\n  permits\n    .filter(p => p.daysToIssue.isDefined && p.appliedYear.exists(_ >= minYear))\n    .groupByKey(p => (p.permitType, p.permitTypeDesc.getOrElse(Keys.NullDesc), p.appliedYear.get))\n    .mapGroups { case ((ptype, desc, year), rows) =>\n      val group = rows.toVector\n      val days   = group.flatMap(_.daysToIssue)\n      val cycles = group.flatMap(_.reviewCycles)\n      CycleTime(\n        permit_type       = ptype,\n        permit_type_desc  = if (desc == Keys.NullDesc) None else Some(desc),\n        applied_year      = year,\n        issued_permits    = group.size.toLong,\n        p50_days_to_issue = Stats.percentile(days, 0.5),\n        p90_days_to_issue = Stats.percentile(days, 0.9),\n        avg_review_cycles =\n          if (cycles.isEmpty) None else Some(Stats.round2(cycles.sum.toDouble / cycles.size))\n      )\n    }\n    .filter(_.issued_permits >= minN)\n}" },
    calc: { file: "enterprise-wip-command-center/shared/calc.ts", note: "Contract (C), revenue (R), estimate at completion (E), actual cost (A) and billings (B) go in. Every derived metric comes out of one function, with a stated reason whenever a value can't be computed.",
      code: `/* Governed calculation library, shared by the server, the UI and exports.
   Source values are never overwritten; derived values are recalculated here. */
export function metrics(r: Pick<Row, "C" | "R" | "E" | "A" | "B">): Metrics {
  const C = n(r.C), R = n(r.R), E = n(r.E), A = n(r.A), B = n(r.B);
  const remC = sub(C, R), remCost = sub(E, A), itdGP = sub(R, A);
  const remGP = remC === null || remCost === null ? null : remC - remCost;
  let remGM: number | null = null, remGMReason: string | null = null;
  if (remC === null || remGP === null) remGMReason = "Missing inputs";
  else if (Math.abs(remC) < 0.01) remGMReason = "Remaining contract is zero";
  else { remGM = remGP / remC; if (remC < 0) remGMReason = "Negative remaining contract"; }
  const ob = B === null && R === null ? null : (B ?? 0) - (R ?? 0);
  return {
    remC, remCost, itdGP, remGP, remGM, remGMReason, ob,
    under: ob === null ? null : Math.max(-ob, 0),
    over:  ob === null ? null : Math.max(ob, 0),
    eacBelowActual: E !== null && A !== null && E + 0.005 < A,
  };
}` },
    privacy: { file: "community-survey-platform/shared/analytics.ts · defaults.ts", note: "Any group with fewer than five respondents is hidden from every chart and export, so no one can be identified, and the rule can't be skipped by mistake.",
      code: `/** Reusable calculation functions. Every dashboard number is computed
 *  here from stored responses; nothing is hard-coded. */

/** Small-cell suppression: counts between 1 and k-1 are hidden
 *  (0 is shown — it reveals no one). */
export const hide = (n: number, k: number) => n > 0 && n < k;

export const DEFAULT_SETTINGS = {
  survey_status: "open" as "open" | "closed",
  /** collection: public findings hidden · internal: team analysis only
   *  · public: aggregate findings published */
  mode: "collection" as "collection" | "internal" | "public",
  suppression_k: 5,
  target_n: 450,
};` },
    contracts: { file: "operations-lending-impact-platform/shared/contracts.ts", note: "Each dataset declares its grain, keys, owner and fields once. Forms, import mappings, validation, templates and the data dictionary are all generated from that one declaration.",
      code: `// Every dataset declares its grain, keys, source, owner and field contract.
// Forms, import mapping, validation, templates and the data dictionary
// are all generated from this file.
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  aliases?: string[];   // legacy header names accepted at import
  restricted?: boolean; // personal / sensitive — never in aggregate output
}

export interface DatasetDef {
  key: string;
  domain: Domain;
  kind: "dimension" | "fact" | "snapshot" | "reference";
  grain: string;
  uniqueKey: string[];  // business key within approved data
  owner: string;
  cadence: string;
  fields: FieldDef[];
}` },
    python: { file: "rfq-item-matching-engine/src/rfq_matcher.py", note: "Messy RFQ emails come in, and every line comes out with a match type, a confidence level and a note for the reviewer. Condensed here; the full module ships with sample RFQs and a pytest suite.",
      code: "\"\"\"RFQ -> catalog item matching. Each RFQ line is classified, never guessed.\"\"\"\ndef match_one(rfq_pn, catalog_df, norm_index, norm_list):\n    n = normalize(rfq_pn)\n\n    # Step 0: out of scope (X-ray, radiation signage)\n    if is_out_of_scope(rfq_pn):\n        return {\"Match Type\": \"Out of Scope\", \"Confidence\": \"Low\", ...}\n\n    # Step 1: exact match on the normalized part number\n    if n in norm_index:\n        row = catalog_df.iloc[norm_index[n]]\n        return {\"Match Type\": \"Exact\", \"Internal Part Number\": row[\"Item Number\"],\n                \"Confidence\": \"High\"}\n\n    # Step 2: competitor cross-reference (OEM -> internal)\n    if n in OEM_TO_DST:\n        return {\"Match Type\": \"Cross Ref\", \"Internal Part Number\": OEM_TO_DST[n],\n                \"Confidence\": \"High\"}\n\n    # Step 3: fuzzy partial match for operator review\n    candidates = get_close_matches(n, norm_list, n=2, cutoff=0.6)\n    if candidates:\n        return {\"Match Type\": \"Partial\", \"Confidence\": \"Medium\",\n                \"Notes\": \"Similar item, needs review: \" + ...}\n\n    return {\"Match Type\": \"No Match\", \"Confidence\": \"Low\"}" },
    sql: { file: "rfq-item-matching-engine/sql/rfq_automation_schema.sql", note: "T-SQL for SQL Server, condensed here: configuration tables with filtered unique indexes, so a mapping can be retired without losing its history. The full schema adds the RFQ archive, line items, match results and audit.",
      code: "-- Configuration tables let operators tune matching without a code deploy.\nCREATE TABLE dbo.quote_cross_references (\n    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_cross_references PRIMARY KEY,\n    CompetitorName NVARCHAR(100) NULL,\n    CompetitorPartNumber NVARCHAR(100) NOT NULL,\n    CompetitorPartNumberNormalized NVARCHAR(100) NOT NULL,\n    DistributorPartNumber NVARCHAR(100) NOT NULL,\n    ConfidenceLevel NVARCHAR(30) NOT NULL\n        CONSTRAINT DF_quote_cross_references_Confidence DEFAULT ('High'),\n    IsActive BIT NOT NULL\n        CONSTRAINT DF_quote_cross_references_IsActive DEFAULT (1),\n    CreatedAtUtc DATETIME2(0) NOT NULL\n        CONSTRAINT DF_quote_cross_references_CreatedAt DEFAULT (SYSUTCDATETIME())\n);\n\n-- One active mapping per normalized competitor part number.\nCREATE UNIQUE INDEX UX_quote_cross_references_CompetitorPartNumberNormalized\nON dbo.quote_cross_references (CompetitorPartNumberNormalized)\nWHERE IsActive = 1;" },
  };

  const hl = (src) => {
    const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|--[^\n]*|#[^\n]*)|("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|\b(export|const|let|function|return|if|else|interface|type|as|null|true|false|def|in|not|and|or|None|select|from|where|with|group|by|over|partition|order|case|when|then|end|val|object|import|filter|CREATE|TABLE|UNIQUE|INDEX|ON|WHERE|NOT|NULL|PRIMARY|KEY|CONSTRAINT|DEFAULT)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Z][A-Za-z]+)\b|\b([a-zA-Z_]\w*)(?=\()/g;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      const [t] = m;
      const cls = m[1] ? "t-c" : m[2] ? "t-s" : m[3] ? "t-k" : m[4] ? "t-n" : m[5] ? "t-t" : "t-f";
      out += `<span class="${cls}">${esc(t)}</span>`;
      last = m.index + t.length;
    }
    return out + esc(src.slice(last));
  };
  const showSnip = (k) => {
    const s = SNIPS[k];
    $("#code-file").textContent = s.file;
    $("#code-body").innerHTML = hl(s.code);
    $("#code-note").textContent = s.note;
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.snip === k)));
  };
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showSnip(b.dataset.snip)));
  showSnip("polars");

  /* ---------- languages ---------- */
  const LANGS = [["TypeScript", 43615, "#2F6FB3"], ["HTML", 13751, "#D9643A"], ["JavaScript", 3849, "#D8B11E"], ["CSS", 3810, "#7A5BB5"], ["Ruby", 3454, "#B8323A"], ["Python", 2244, "#3B7A57"], ["SQL", 699, "#8A6D3B"], ["Scala", 182, "#C2344D"]];
  const tot = LANGS.reduce((a, l) => a + l[1], 0);
  $("#langbar").innerHTML = LANGS.map(([n, v, c]) => `<i style="width:${(v / tot) * 100}%;background:${c}" title="${n}"></i>`).join("");
  $("#langkey").innerHTML = LANGS.map(([n, v, c]) => `<li><i style="background:${c}"></i>${n}<b>${v.toLocaleString()} · ${(v / tot * 100 < 1 ? "<1" : Math.round((v / tot) * 100))}%</b></li>`).join("");

  /* ---------- reveal + counters ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" }) : null;
  function observe(els) { els.forEach((el) => (io ? io.observe(el) : el.classList.add("in"))); }
  observe($$(".rv"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cObs.unobserve(e.target);
    const el = e.target, end = +el.dataset.count; if (reduce) return;
    const t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString(); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$("[data-count]").forEach((el) => cObs.observe(el));

  render();
})();
