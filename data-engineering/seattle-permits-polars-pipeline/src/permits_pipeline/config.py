"""Pipeline configuration. Paths are relative to the project root unless overridden."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

SOCRATA_DOMAIN = "data.seattle.gov"
DATASET_ID = "76t5-zqzr"  # City of Seattle "Building Permits" (public domain)
SOURCE_URL = f"https://{SOCRATA_DOMAIN}/resource/{DATASET_ID}.json"

# Seattle city limits, padded slightly. Coordinates outside this box are treated as bad geocodes.
SEATTLE_BBOX = {"lat_min": 47.48, "lat_max": 47.74, "lon_min": -122.46, "lon_max": -122.22}


@dataclass(frozen=True)
class Paths:
    root: Path = field(default_factory=lambda: Path(os.environ.get("PERMITS_DATA_DIR", "data")))

    @property
    def bronze(self) -> Path:
        return self.root / "bronze"

    @property
    def silver(self) -> Path:
        return self.root / "silver"

    @property
    def quarantine(self) -> Path:
        return self.root / "quarantine"

    @property
    def gold(self) -> Path:
        return self.root / "gold"

    def ensure(self) -> "Paths":
        for p in (self.bronze, self.silver, self.quarantine, self.gold):
            p.mkdir(parents=True, exist_ok=True)
        return self
