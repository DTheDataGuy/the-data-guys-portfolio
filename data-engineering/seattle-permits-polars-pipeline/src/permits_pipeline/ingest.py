"""Bronze layer: land the source exactly as received, plus a manifest that proves what was landed.

Bronze rules
- Every value is stored as a string. Typing happens in silver, where failures can be quarantined.
- Nested Socrata fields are flattened (``link.url``); the duplicate ``location1`` object is dropped.
- Each run writes one immutable, timestamped Parquet file and a JSON manifest (row count, SHA-256,
  source URL, page count), so any downstream number can be traced to the exact extract it came from.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

import polars as pl
import requests

from .config import SOURCE_URL, Paths

log = logging.getLogger(__name__)

PAGE_SIZE = 50_000
MAX_RETRIES = 5


def _flatten(record: dict) -> dict:
    out: dict[str, str | None] = {}
    for key, value in record.items():
        if key == "location1":
            continue
        if key == "link" and isinstance(value, dict):
            out["link_url"] = value.get("url")
        elif isinstance(value, (dict, list)):
            out[key] = json.dumps(value, sort_keys=True)
        else:
            out[key] = None if value is None else str(value)
    return out


def fetch_pages(url: str = SOURCE_URL, page_size: int = PAGE_SIZE, session: requests.Session | None = None,
                max_rows: int | None = None) -> Iterator[list[dict]]:
    """Yield pages from a Socrata endpoint with a stable sort, so paging never skips or repeats rows."""
    s = session or requests.Session()
    offset = 0
    while True:
        params = {"$limit": page_size, "$offset": offset, "$order": "permitnum"}
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = s.get(url, params=params, timeout=120)
                resp.raise_for_status()
                page = resp.json()
                break
            except (requests.RequestException, ValueError) as exc:
                if attempt == MAX_RETRIES:
                    raise
                wait = 2 ** attempt
                log.warning("page offset=%s failed (%s); retry %s in %ss", offset, exc, attempt, wait)
                time.sleep(wait)
        if not page:
            return
        yield page
        offset += len(page)
        if len(page) < page_size or (max_rows and offset >= max_rows):
            return


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def land(records: list[dict], paths: Paths, source: str, pages: int) -> dict:
    """Write one bronze extract and its manifest. Returns the manifest."""
    paths.ensure()
    pulled_at = datetime.now(timezone.utc)
    stamp = pulled_at.strftime("%Y%m%dT%H%M%SZ")
    rows = [_flatten(r) for r in records]
    columns = sorted({k for r in rows for k in r})
    df = pl.DataFrame(rows, schema={c: pl.Utf8 for c in columns}, infer_schema_length=None)
    df = df.with_columns(pl.lit(stamp).alias("_extract_id"))
    out = paths.bronze / f"permits_{stamp}.parquet"
    df.write_parquet(out, compression="zstd")
    manifest = {
        "extract_id": stamp,
        "source": source,
        "pulled_at_utc": pulled_at.isoformat(),
        "pages": pages,
        "rows": df.height,
        "columns": columns,
        "file": out.name,
        "sha256": _sha256(out),
    }
    (paths.bronze / f"permits_{stamp}.manifest.json").write_text(json.dumps(manifest, indent=2))
    log.info("bronze: landed %s rows -> %s", df.height, out)
    return manifest


def ingest_api(paths: Paths, max_rows: int | None = None) -> dict:
    records: list[dict] = []
    pages = 0
    for page in fetch_pages(max_rows=max_rows):
        records.extend(page)
        pages += 1
        log.info("fetched page %s (%s rows total)", pages, len(records))
    return land(records, paths, source=SOURCE_URL, pages=pages)


def ingest_file(path: Path, paths: Paths) -> dict:
    """Land a local JSON array (same shape as the API) — used for fixtures and offline runs."""
    records = json.loads(Path(path).read_text())
    return land(records, paths, source=f"file://{Path(path).name}", pages=1)


def latest_bronze(paths: Paths) -> Path:
    files = sorted(paths.bronze.glob("permits_*.parquet"))
    if not files:
        raise FileNotFoundError(f"no bronze extracts in {paths.bronze}; run ingest first")
    return files[-1]


def latest_manifest(paths: Paths) -> dict:
    """Manifest of the newest bronze extract, verified against its file hash before reuse."""
    manifests = sorted(paths.bronze.glob("permits_*.manifest.json"))
    if not manifests:
        raise FileNotFoundError(f"no bronze extracts in {paths.bronze}; run with --source api first")
    m = json.loads(manifests[-1].read_text())
    actual = _sha256(paths.bronze / m["file"])
    if actual != m["sha256"]:
        raise ValueError(f"bronze file {m['file']} does not match its manifest hash; refusing to replay")
    return m
