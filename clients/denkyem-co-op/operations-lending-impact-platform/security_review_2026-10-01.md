## Security Review Results

### BLOCK (must fix before publishing)
- None found.

### WARN (inform user, let them decide)
- **No real authentication; role and data-scope are caller-controlled.** `server/routes.ts:33-38` trusts `x-denkyem-role`, `x-denkyem-demo`, or query parameters, defaulting to `admin` and demo mode. Mutation routes apply role checks against this caller-supplied role (`server/routes.ts:216-240`), and `demo=0` selects non-demo records. Anyone who can reach the app/API can impersonate admin and turn demo mode off. For this review-only presentation, keep access restricted and do not enter/import real data; add server-verified authentication/authorization before production or any use with real data.
- **High-severity dependency vulnerability in uploaded spreadsheet parser.** `npm audit` reports one high vulnerability in direct dependency `xlsx` (SheetJS), with prototype-pollution and ReDoS advisories; audit says no fix is available. The app parses uploaded workbook contents at `server/routes.ts:279-303`, so arbitrary uploaded files reach this dependency. Upgrade/replace with a patched parser before accepting untrusted uploads; otherwise disable spreadsheet upload during the review.

### PASS
- Dependency audit found no critical vulnerabilities; one high vulnerability is reported above.
- Secret-pattern search found no matches; no non-example `.env` files/secrets were present.
- Dangerous-pattern review found only `dangerouslySetInnerHTML` in `client/src/components/ui/chart.tsx:80-95`; it builds chart CSS from component configuration and there is no evidence of untrusted user input flowing into it.
- No open-CORS configuration was found.
- `.gitignore` excludes `.env*` and SQLite database files.
