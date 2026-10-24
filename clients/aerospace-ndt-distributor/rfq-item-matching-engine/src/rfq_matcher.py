"""RFQ -> Item Matching prototype. Distributor demo (v2 - extended)."""
import re
import pandas as pd
from difflib import get_close_matches

# --- Hardcoded OEM->DST cross-ref (from Distributor Estimate #10001) ---
OEM_TO_DST = {
    "OEM9087L": "DST-0615L",
    "OEM9087R": "DST-0615R",
    "OEM9110L": "DST-0616L",
    "OEM9110R": "DST-0616R",
}

# Out-of-scope product prefixes (X-Ray, radiation signs - not Distributor NDT line)
OUT_OF_SCOPE_PREFIXES = ("RT-", "RS-")

# --- Normalization ---
def normalize(s):
    if s is None:
        return ""
    return re.sub(r"[\s\-_/.,:]+", "", str(s)).upper()

# --- Noise vocabulary ---
NOISE = {
    "PN", "QTY", "EA", "UM", "UOM", "CONDITION", "DESCRIPTION", "DESC",
    "PART", "NUMBER", "PARTNUMBER", "REMARKS", "ITEM", "BIDS", "BID",
    "RFQ", "PLEASE", "EQUIVALENT", "FREQUENCY", "DIAMETER", "WORKING",
    "LENGTH", "TIP", "COIL", "DISTANCE", "MM", "KHZ", "MHZ", "TO", "OF",
    "C", "TDS", "TEST", "REPORT", "FLEXIBLE", "ROTO", "PROBE", "SUBMIT",
    "FOR", "FROM", "AND", "THE", "WITH", "BLOCK", "REFERENCE", "STANDARD",
    "BNC", "UHF", "CABLE", "ULTRASONIC", "TRANSDUCER", "CURRENCY",
    "UNIT", "PRICE", "LEAD", "TIME", "CERTIFICATE", "USML", "ECCN",
    "ALTERNATE", "MOQ", "WARRANTY", "OEM", "FAA", "EASA", "INV",
    "SHELF", "LIFE", "CURE", "DATE", "VALIDITY", "EXPORT", "LICENCE",
    "SME", "MILITARY", "SENSITIVE", "STRATEGIC", "GOODS", "ACT",
    "TREASURY", "PROGRAM", "NATIONS", "SANCTIONS", "INDICATE",
    "STATEMENT", "COMMERCIAL", "AUTHORIZED", "GOVERNMENT", "DESTINATION",
    "USER", "TRANSFERRED", "DISPOSED", "ORIGINAL", "FORM", "INCORPORATED",
    "DEPARTMENT", "STATE", "QUOTATION", "VENDOR", "ADDRESSED", "AEROSPACE",
    "SECTOR", "ENTITY", "ACCEPTED", "ANOTHER", "PROVIDE", "DOCUMENTARY",
    "PROOF", "QUOTED", "ADVISE", "SPECIFY", "CONTRACTORS", "SUPPLIERS",
    "DECLARE", "CONFLICT", "INTEREST", "COMPLY", "LEGAL", "OTHER",
    "REQUIREMENTS", "PERTAINING", "ENVIRONMENT", "HEALTH", "SAFETY",
    "ISSUES", "REGION", "CONTROL", "TREASURY", "DESIGNATED", "LIST",
    "UNITED", "COUNTRY", "ULTIMATE", "USE", "TRANSSHIPPED", "VOYAGE",
    "OTHERWISE", "ANY", "EITHER", "AFTER", "BEING", "INTO", "END",
    "ITEMS", "WITHOUT", "PRIOR", "WRITTEN", "APPROVAL",
    "MFR", "CAGE", "NSN", "APPLICABLE", "ATTACHMENT", "INFORMATION",
    "HELLO", "HELP", "MAY", "GET", "QUOTE", "ATTACHED", "ADVISE",
    "DEAR", "COULD", "SEND", "FOLLOWING",
    "TRANDUCER",
    "CLOSING",
}

UNIT_RE = re.compile(
    r"^\d+(\.\d+)?(MM|CM|IN|HZ|KHZ|MHZ|GHZ|EA|PCS|G|KG|LB|OZ|V|W|MA)"
    r"(-\d+(\.\d+)?(MM|CM|IN|HZ|KHZ|MHZ|GHZ|EA|PCS|G|KG|LB|OZ|V|W|MA))?$"
)

# Patterns to reject — these look like PNs but aren't quoteable items
JUNK_PATTERNS = [
    re.compile(r"^PR-\d{2,4}-\d+$"),          # PR-0000-00001
    re.compile(r"^DCQ\d+$"),                  # DCQ377367
    re.compile(r"^RFQ\d+$"),                  # RFQ12345
    re.compile(r"^B-?7\d{2}$"),               # B777, B-787
    re.compile(r"^A-?3\d{2}$"),               # A320, A-380
    re.compile(r"^\d{2}-\d{2}-\d{2}$"),       # 54-51-06 (NDT manual sections)
    re.compile(r"^\d{2}-\d{2}-\d{3}$"),       # 57-20-150 variant
    re.compile(r"^S/N-?\d+$"),                # S/N-358
    re.compile(r"^ASTM-?E?-?\d+$"),           # ASTM-E-1742
    re.compile(r"^\d+/\d+$"),                 # 5/16, 7/16 (fractions)
    re.compile(r"^TI-?6-?4\.?$"),             # Ti64, Ti-6-4
    re.compile(r"^AL\d{4}$"),                 # AL6061, AL2024
    re.compile(r"^\d{4}-?T\d$"),              # 2024-T3, 7075-T6
]

PN_TOKEN = r"[A-Za-z0-9][A-Za-z0-9\-_/\.]{3,}"
EQUIV_RE = re.compile(
    rf"({PN_TOKEN})\s+(?:equivalent\s+to|equivalent|equiv\.?\s*to|eq\.?\s*to)\s+({PN_TOKEN})",
    re.IGNORECASE,
)

# Description keywords for description-only RFQ matching
DESC_KEYWORDS = {
    "probe", "probet", "transducer", "kit", "reference standard",
    "calibration block", "step", "cable", "rototest", "eddy current",
    "ultrasonic", "surface wave", "shear wave",
}

def _valid_pn(u):
    if u in NOISE: return False
    if not re.search(r"\d", u): return False
    if re.fullmatch(r"\d+(\.\d+)?", u): return False
    if UNIT_RE.match(u): return False
    if len(u) < 4: return False
    for pat in JUNK_PATTERNS:
        if pat.match(u): return False
    return True

def extract_rfq_items(text):
    """Return list of {'pn', 'customer_ref'}. Detects 'X equivalent to Y' linkage."""
    primary_to_ref, skip_norm = {}, set()
    for m in EQUIV_RE.finditer(text):
        p, e = m.group(1), m.group(2)
        if not _valid_pn(p.upper().strip(".,:")) or not _valid_pn(e.upper().strip(".,:")):
            continue
        primary_to_ref[normalize(p)] = e
        skip_norm.add(normalize(e))

    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9\-_/\.]{3,}", text)
    seen, out = set(), []
    for t in tokens:
        u = t.upper().strip(".,:")
        if not _valid_pn(u): continue
        n = normalize(t)
        if n in skip_norm or n in seen: continue
        seen.add(n)
        out.append({"pn": t, "customer_ref": primary_to_ref.get(n)})
    return out

def is_out_of_scope(rfq_pn):
    """Check if part number prefix indicates out-of-scope product line."""
    upper = rfq_pn.upper().strip()
    return any(upper.startswith(pfx) for pfx in OUT_OF_SCOPE_PREFIXES)

def description_match(text, catalog_df, top_n=3):
    """When no PNs found, search description for keyword hits in catalog."""
    text_lower = text.lower()
    found_keywords = [kw for kw in DESC_KEYWORDS if kw in text_lower]
    if not found_keywords:
        return []
    # rank catalog rows by how many keywords appear in their Item Name
    scores = []
    for i, row in catalog_df.iterrows():
        name = str(row.get("Item Name", "")).lower()
        score = sum(1 for kw in found_keywords if kw in name)
        if score > 0:
            scores.append((score, i))
    scores.sort(reverse=True)
    return [(catalog_df.iloc[i], found_keywords) for _, i in scores[:top_n]]

# --- Matching engine ---
def match_one(rfq_pn, catalog_df, norm_index, norm_list):
    n = normalize(rfq_pn)

    # Step 0: Out-of-scope check (X-Ray, etc.)
    if is_out_of_scope(rfq_pn):
        return {
            "Match Type": "Out of Scope",
            "Internal Part Number": "",
            "Confidence": "Low",
            "Notes": "X-Ray / non-NDT product - outside Distributor scope",
        }

    # Step 1: Exact
    if n in norm_index:
        row = catalog_df.iloc[norm_index[n]]
        return {
            "Match Type": "Exact",
            "Internal Part Number": row["Item Number"],
            "Confidence": "High",
            "Notes": f"Exact catalog match ({row['Item Name']})",
        }

    # Step 2: Cross Ref (hardcoded OEM->DST map)
    if n in OEM_TO_DST:
        return {
            "Match Type": "Cross Ref",
            "Internal Part Number": OEM_TO_DST[n],
            "Confidence": "High",
            "Notes": "Mapped from OEM to DST (per Estimate #10001)",
        }

    # Step 2b: Generic OEM pattern (no specific mapping yet)
    if n.startswith("OEM"):
        return {
            "Match Type": "Cross Ref Needed",
            "Internal Part Number": "",
            "Confidence": "Low",
            "Notes": "OEM competitor part - DST equivalent not yet mapped, needs lookup",
        }

    # Step 3: Partial
    candidates = get_close_matches(n, norm_list, n=2, cutoff=0.6)
    if not candidates and len(n) >= 4:
        candidates = [x for x in norm_list if n in x or x in n][:2]
    if candidates:
        picks = [f"{catalog_df.iloc[norm_index[c]]['Item Number']} ({catalog_df.iloc[norm_index[c]]['Item Name']})" for c in candidates]
        return {
            "Match Type": "Partial",
            "Internal Part Number": "; ".join(catalog_df.iloc[norm_index[c]]["Item Number"] for c in candidates),
            "Confidence": "Medium",
            "Notes": "Similar item, needs review: " + " | ".join(picks),
        }

    # Step 4: No Match
    return {
        "Match Type": "No Match",
        "Internal Part Number": "",
        "Confidence": "Low",
        "Notes": "Not found in catalog - manual review required",
    }

# --- Pipeline ---
def run_pipeline(rfq_texts, catalog_path):
    cat = pd.read_csv(catalog_path, skiprows=2)
    cat = cat.dropna(subset=["Item Number"]).reset_index(drop=True)
    norm_index = {}
    for i, pn in enumerate(cat["Item Number"]):
        n = normalize(pn)
        if n and n not in norm_index:
            norm_index[n] = i
    norm_list = list(norm_index.keys())

    rows = []
    for label, text in rfq_texts.items():
        items = extract_rfq_items(text)

        if not items:
            # Description-only RFQ (Ex 4, 8)
            desc_hits = description_match(text, cat)
            if desc_hits:
                picks = [f"{r['Item Number']} ({r['Item Name']})" for r, _ in desc_hits]
                kws = desc_hits[0][1]
                rows.append({
                    "Source RFQ": label,
                    "RFQ Item": "(description-only - no PN given)",
                    "Customer Reference": "",
                    "Match Type": "Description Match",
                    "Internal Part Number": "; ".join(r["Item Number"] for r, _ in desc_hits),
                    "Confidence": "Medium",
                    "Notes": f"Keyword match on [{', '.join(kws)}]: " + " | ".join(picks),
                })
            else:
                rows.append({
                    "Source RFQ": label,
                    "RFQ Item": "(no part number or recognizable spec)",
                    "Customer Reference": "",
                    "Match Type": "No Match",
                    "Internal Part Number": "",
                    "Confidence": "Low",
                    "Notes": "Custom build request - engineering review required",
                })
            continue

        for item in items:
            pn, cref = item["pn"], item["customer_ref"]
            r = match_one(pn, cat, norm_index, norm_list)
            if cref:
                r["Notes"] = f"{r['Notes']}; customer also referenced equivalent '{cref}'"
            rows.append({"Source RFQ": label, "RFQ Item": pn,
                         "Customer Reference": cref or "", **r})

    return pd.DataFrame(rows, columns=["Source RFQ", "RFQ Item", "Customer Reference",
                                        "Match Type", "Internal Part Number",
                                        "Confidence", "Notes"])


def summarize(result: pd.DataFrame) -> pd.DataFrame:
    """Match-type distribution for a pipeline run."""
    summary = result["Match Type"].value_counts().to_frame("Count")
    summary["%"] = (summary["Count"] / len(result) * 100).round(1)
    return summary


if __name__ == "__main__":
    import argparse
    from sample_rfqs import RFQS

    ap = argparse.ArgumentParser(description="Match RFQ line items to an internal parts catalog.")
    ap.add_argument("catalog", help="Catalog export CSV (two header rows, then Item Number / Item Name ...)")
    ap.add_argument("-o", "--out", default="rfq_match_output.csv")
    args = ap.parse_args()

    result = run_pipeline(RFQS, args.catalog)
    print(summarize(result).to_string())
    print(f"\n{len(result)} RFQ items across {len(RFQS)} RFQs -> {args.out}")
    result.to_csv(args.out, index=False)
