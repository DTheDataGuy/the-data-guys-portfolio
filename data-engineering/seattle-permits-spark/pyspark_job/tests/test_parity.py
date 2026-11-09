"""The parity comparator must catch drift, not just report agreement."""
import sys
from pathlib import Path

import polars as pl

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "parity"))
import parity_check as p  # noqa: E402

BASE = pl.DataFrame({"zip": ["98101", "98122"], "issued_year": [2024, 2024],
                     "housing_permits": [3.0, 4.0], "units_added": [10.0, 5.0],
                     "units_removed": [0.0, 1.0], "net_units": [10.0, 4.0]})


def test_identical_frames_match():
    assert p.compare(BASE, BASE.clone(), p.HP_KEYS, p.HP_VALS)["match"]


def test_value_drift_is_detected():
    other = BASE.with_columns(pl.when(pl.col("zip") == "98122").then(5.0).otherwise(pl.col("net_units")).alias("net_units"))
    r = p.compare(BASE, other, p.HP_KEYS, p.HP_VALS)
    assert not r["match"] and r["mismatched_values"] == 1 and r["max_abs_diff"] == 1.0


def test_missing_rows_are_detected():
    r = p.compare(BASE, BASE.head(1), p.HP_KEYS, p.HP_VALS)
    assert not r["match"] and r["only_in_base"] == 1
