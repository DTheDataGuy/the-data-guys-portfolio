"""Command line: ``python -m permits_pipeline run`` executes bronze -> silver -> quality gate -> gold."""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from datetime import date
from pathlib import Path

import polars as pl

from . import gold, ingest, quality, transform
from .config import Paths

log = logging.getLogger("permits_pipeline")


def run(source: str, file: Path | None, reports: Path, as_of: date | None, max_rows: int | None) -> int:
    paths = Paths().ensure()
    timings: dict[str, float] = {}
    t0 = time.perf_counter()
    if source == "file":
        manifest = ingest.ingest_file(file, paths)
    elif source == "replay":
        manifest = ingest.latest_manifest(paths)  # rebuild silver/gold from the last landed extract
    else:
        manifest = ingest.ingest_api(paths, max_rows)
    timings["bronze_s"] = round(time.perf_counter() - t0, 2)

    t1 = time.perf_counter()
    stats = transform.to_silver(paths.bronze / manifest["file"], paths, as_of)
    timings["silver_s"] = round(time.perf_counter() - t1, 2)

    silver = pl.read_parquet(paths.silver / "permits.parquet")
    checks = quality.run_checks(silver, stats["quarantined_rows"], stats["bronze_rows"], as_of)
    run_info = {"extract_id": manifest["extract_id"], "source": manifest["source"],
                "bronze_sha256": manifest["sha256"], **stats}
    report = quality.write_report(checks, reports, run_info)
    if not report["passed"]:
        log.error("quality gate FAILED; gold not built. See %s", reports / "quality_report.md")
        return 1

    t2 = time.perf_counter()
    g = gold.build_gold(paths.silver / "permits.parquet", paths.gold, reports / "gold")
    timings["gold_s"] = round(time.perf_counter() - t2, 2)
    timings["total_s"] = round(time.perf_counter() - t0, 2)
    if not g["reconciliation"]["ok"]:
        log.error("gold reconciliation failed: %s", g["reconciliation"])
        return 1
    summary = {**run_info, "gold_tables": g, "timings": timings, "polars_version": pl.__version__}
    (reports / "run_manifest.json").write_text(json.dumps(summary, indent=2, default=str))
    log.info("done in %ss: %s silver rows, gold tables %s", timings["total_s"], stats["silver_rows"],
             {k: v for k, v in g.items() if k != "reconciliation"})
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="permits-pipeline", description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="bronze -> silver -> quality -> gold")
    r.add_argument("--source", choices=["api", "file", "replay"], default="api")
    r.add_argument("--file", type=Path, help="JSON array with the API's shape (for --source file)")
    r.add_argument("--reports", type=Path, default=Path("reports"))
    r.add_argument("--as-of", type=date.fromisoformat, default=None, help="freeze 'today' for reproducible runs")
    r.add_argument("--max-rows", type=int, default=None, help="cap API rows (smoke runs)")
    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    return run(args.source, args.file, args.reports, args.as_of, args.max_rows)


if __name__ == "__main__":
    sys.exit(main())
