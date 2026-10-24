# Confidentiality & Redaction Policy

This repository shows engineering work. It does not publish client data.

Anonymized before publication:
- Private business clients appear under descriptive names: "Multi-Company Construction Enterprise" and "Regional Heavy-Civil Contractor". Their company names, subsidiary names, entity codes, email domains and staff names are replaced with fictional ones, such as "Summit", "Cascade Civil" and "Executive Sponsor".
- Vendor, project, driver and staff names in sample data are fictional.
- Personal names of client and partner staff are replaced with role titles.
- Live links to private client applications are removed.

Removed before publication:
- Client seed workbooks, general-ledger extracts, WIP schedules and real control totals (replaced with `null` targets in `server/repro.ts`)
- Survey responses, staff credential files and any respondent contact data
- Private source documents, vendor tickets and invoices (only labeled DEMO data remains)
- Personal email addresses and file inventories
- Compiled builds that embed client financial figures (see Case Studies)

Any remaining figures are clearly labeled demo or sample data, or come from public sources cited in the project.
