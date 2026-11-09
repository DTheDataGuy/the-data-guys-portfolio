"""Sample RFQ texts used to exercise the matcher (13 RFQs, varied layouts)."""
# --- All 13 RFQs (4 original + 9 new) ---
RFQS = {
    "RFQ 1": """Can you please help me out with a sales quote on the following:
PN: 2-164-551 BLOCK, REFERENCE STANDARD
QTY: 1""",

    "RFQ 2": """Please submit your Bids for the items listed below:
PartNumber Description Condition Qty/UM
SC-BNC-UHF-6  BNC to UHF CABLE FOR ULTRASONIC TRANSDUCER  2 EA""",

    "RFQ 3": """Flexible roto probe
DS-5007/7.8MM equivalent to KD1H52408-2
QTY: 1
Specs: Frequency 100KHZ-2MHZ, Diameter 7.8 mm, working length 90mm

Flexible roto probe
DS-5007/6.1MM equivalent to KD1H52404-2
QTY: 1
Specs: Frequency 100KHZ-2MHZ, Diameter 6.1 mm, working length 90mm""",

    "RFQ 4": """Please quote the following PN:
NDT3317
NDT3318
NDT3310-A
NDT3310-B
NDT3310-C
OEM-9087L
OEM-9087-R
OEM-9110L
OEM-9110R""",

    "RFQ 5 (Ex1 X-Ray mix)": """Description Part No Quantity Note
Package of 26 Letters A Through Z, Unmounted Ray-Check Lead Letters | RT-RC-LL-U26AZ-Master | 1 | X-RAY processing equipment
Package of 10 Single Number, Unmounted Ray-Check Lead Letters | RT-RC-LL-U10N-Master | 1
NDS Products Plastic Radiation Area Sign Caution X-Ray | RS-NDS-PL4 | 3
X-Rite 331C Portable Transmission Densitometer | RT-XTDM-331C | 1
Kowotest BAM 15 Step Density Tablet | RT-KT-13-40205 | 1
ASTM-E-1742 IQI Sets Plaque Type | RT-RC-PK-ASTM-E-1742-A-Master | 1""",

    "RFQ 6 (Ex2 PR-0000-00001)": """PR-0000-00001
ITEM 1: DST-1371 ULTRASONIC TRANSDUCER 5MHZ 45 DEG SHEAR WAVE IN TITANIUM. QTY 1 EA
ITEM 2: NDT777A NEW ULTRASONIC REFERENCE STANDARD PER B777 PART 4 54-51-06 FIG 2. QTY 1 EA
Closing Date: 07 May 2026""",

    "RFQ 7 (Ex3 DCQ377367)": """RFQ Number: DCQ377367
Item 12: AUR.875SE/3.0WL  PROBE PROBE BOLT HO  Qty 2  NE
Item 17: 8382199  BUMPER  Qty 11  NE""",

    "RFQ 8 (Ex4 custom blocks)": """Requesting a quote for 10 total calibration blocks all provided with a Delrin holding block, test report, and certificate of conformance.
5 of 8 steps, thicknesses 0.020", 0.025", 0.030", 0.040", 0.100", 0.200", 0.300", 0.500", 1"x1" pad, +/- 0.001" tolerance, 304 Stainless Steel.
5 of 8 steps, same thicknesses and pad, Ti64.
For reference, similar to DSNDT-3406AL-1 from previous Quote #37733.""",

    "RFQ 9 (Ex5 NDT list)": """Could you send a quote for following PN?
NDT6109 (REFERENCE STANDARD NDT) QTY 2
NDT666A (REFERENCE STANDARD NDT) QTY 1
NDT666B (REFERENCE STANDARD NDT) QTY 1
NDT666C (REFERENCE STANDARD NDT) QTY 1""",

    "RFQ 10 (Ex6 NDT6131)": """Our NDI partners at Boeing designed a new reference standard NDT6131 for medium frequency eddy current (MFEC) inspection. Please provide quote for 1 standard and 3 probes.""",

    "RFQ 11 (Ex7 mixed PNs)": """Can you please assist us with a quote?
1: SUS921L TRANSDUCER QTY 2
2: SUS921R TRANSDUCER QTY 2
3: NEC1062 PROBE: S/N-358 QTY 2
4: NEC1062 PROBE: S/N-359 QTY 2
5: 291-719-800 TRANSDUCER QTY 2
6: SUSM570AT TRANSDUCER QTY 2
7: A109S-RM TRANSDUCER QTY 2""",

    "RFQ 12 (Ex8 rototest kit)": """I need a rototest kit for eddy current inspection with 1/4", 5/16", and 7/16" Probets, or Kit de probets 1/4, 5/16 and 7/16""",

    "RFQ 13 (Ex9 mixed list)": """1: NDT777A Reference standard QTY 1 (B777 NDT PART 4, SUBJECT 54-51-06)
2: DST-1371 Ultrasonic transducer QTY 2
3: NDT771 Reference standard QTY 1 (B777 NDT PART 4, SUBJECT 57-10-05)
4: NDT774 Reference standard QTY 1
5: OEM-5127L-I Ultrasonic transducer QTY 1
6: OEM-5127L-O Ultrasonic transducer QTY 1
7: OEM-5127R-I Ultrasonic transducer QTY 1
8: OEM-5127R-O Ultrasonic transducer QTY 1
9: NDT6130-1 Reference standard QTY 1 (B777 NDT PART 4, SUBJECT 57-20-17)
10: NDT6130-2 Reference standard QTY 1
11: NDT6130-3 Reference standard QTY 1""",
}
