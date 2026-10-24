"""Unit tests for the RFQ matcher. Run: pytest -q (from this folder)."""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from rfq_matcher import normalize, extract_rfq_items, is_out_of_scope, run_pipeline

CATALOG = pathlib.Path(__file__).resolve().parents[1] / "sample_data" / "catalog_sample.csv"


def test_normalize_strips_separators_and_case():
    assert normalize("dst-0615 l") == "DST0615L"
    assert normalize(None) == ""


def test_extracts_part_number_and_ignores_noise():
    items = extract_rfq_items("PN: SC-BNC-UHF-6 BNC to UHF CABLE\nQTY: 2 EA")
    assert [i["pn"] for i in items] == ["SC-BNC-UHF-6"]


def test_out_of_scope_prefixes():
    assert is_out_of_scope("RT-KT-13-40205")
    assert not is_out_of_scope("DST-1371")


def test_cross_reference_resolves_competitor_part():
    df = run_pipeline({"x": "OEM9087L Ultrasonic transducer QTY 1"}, CATALOG)
    row = df.iloc[0]
    assert row["Match Type"] == "Cross Ref"
    assert row["Internal Part Number"] == "DST-0615L"


def test_exact_match():
    df = run_pipeline({"x": "DST-1371 Ultrasonic transducer QTY 2"}, CATALOG)
    assert df.iloc[0]["Match Type"] == "Exact"
