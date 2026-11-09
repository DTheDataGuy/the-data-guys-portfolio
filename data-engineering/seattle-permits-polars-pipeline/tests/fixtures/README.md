# Test fixtures

`permits_sample.json` holds real, public-domain records from the City of Seattle
[Building Permits](https://data.seattle.gov/Built-Environment/Building-Permits/76t5-zqzr) dataset in the
API's own JSON shape. It's a seeded random sample plus the rows that hit the quarantine rules and the
cost-outlier flag. Edge cases that the live data doesn't reliably contain (duplicates, 1900 sentinel dates,
negative costs, bad ZIPs, coordinates outside Seattle) are built in code inside the tests, so every rule
is exercised deliberately.

Contractor names in the sample are replaced with pseudonyms (`CONTRACTOR 001` ...) because some source "contractors" are private individuals.
