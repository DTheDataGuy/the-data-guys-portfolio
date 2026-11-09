import json
from datetime import date
from pathlib import Path

import polars as pl
import pytest

from permits_pipeline.ingest import _flatten

FIXTURE = Path(__file__).parent / "fixtures" / "permits_sample.json"
AS_OF = date(2026, 10, 20)

BASE = {"permitnum": "7000001-CN", "permitclass": "Multifamily", "permitclassmapped": "Residential",
        "permittypemapped": "Building", "permittypedesc": "New", "statuscurrent": "Completed",
        "housingunits": "4", "housingunitsadded": "4", "housingunitsremoved": "0",
        "estprojectcost": "1200000", "applieddate": "2024-01-10T00:00:00.000",
        "issueddate": "2024-03-01T00:00:00.000", "completeddate": "2025-02-01T00:00:00.000",
        "originalcity": " seattle ", "originalzip": "98122-1234", "latitude": "47.61", "longitude": "-122.30",
        "dependentbuilding": "0", "link": {"url": "https://example.org/7000001-CN"}}


def bronze_frame(records: list[dict]) -> pl.LazyFrame:
    rows = [_flatten(r) for r in records]
    cols = sorted({k for r in rows for k in r})
    return pl.DataFrame(rows, schema={c: pl.Utf8 for c in cols}).with_columns(
        pl.lit("TEST").alias("_extract_id")).lazy()


def make(**overrides) -> dict:
    r = dict(BASE)
    r.update(overrides)
    return {k: v for k, v in r.items() if v is not None}


@pytest.fixture
def sample_records() -> list[dict]:
    return json.loads(FIXTURE.read_text())
