# Ticket Desk: system specification

Dei'Marlon Scisney · The Data Guys · October 2026

Project engineers at a heavy-civil contractor receive trucking and scale tickets from dozens of vendors as photos, scans and multi-page PDFs. Today someone sorts the images by hand and retypes quantities into HCSS and Procore. Ticket Desk replaces that with one workflow: receive the ticket, keep the original, pull out candidate values, have a person review them, approve a version, and prepare clean daily entries.

This document describes the target system. The `app/` folder is the working front-end prototype that runs on the synthetic data in this folder.

## Goals

- Every ticket that arrives is accounted for, including partial and failed deliveries.
- Every approved value traces back to a page and region on the original, or to a named reviewer's correction.
- Nothing posts to Procore without a human approval, and live writes stay off until a pilot signs off.
- Quantities keep their unit and basis. Loads, tons, yards and hours are never added together.

## Architecture

```text
shared mailbox ─► Power Automate receiver ─┐
browser upload / desk camera / mobile ─────┼─► intake API ─► private originals + receipt ledger
                                           │                     │
                                           │                     ▼
                                           │               job queue (leases, retries)
                                           │                     │
                                           │      validate ─► split pages ─► extract ─► rules
                                           │                     │
                                           │                     ▼
                                           └──────────────► review app ─► approved versions
                                                                 │
                                         register / CSV ◄────────┼────────► Procore (dry run first)
                                                                 ▼
                                                        invoice matching
```

Baseline stack: typed web front end, server API, PostgreSQL, private object storage and a database-backed job queue with leases. The OCR provider sits behind an adapter, so it can be swapped without touching review logic.

| Component | Responsibility |
|---|---|
| Mail receiver | Detects messages, fetches every attachment, retries transport, keeps message and attachment IDs |
| Intake API | Authenticates the source, saves bytes and metadata, returns receipt IDs |
| Document worker | Validates files, renders previews, splits and groups pages, calls the extractor, stores evidence |
| Rule engine | Required fields, code lookup, duplicates, quantity and consistency checks |
| Review app | Side-by-side correction, approval and audit |
| Register | Authoritative reviewed record versions and their sources |
| Output worker | CSV exports and the separately enabled Procore delivery |
| Integration ledger | Per-destination attempts, remote IDs and uncertain outcomes |

Extraction never approves a record or writes to Procore on its own. Ticket text and email bodies are treated as untrusted input, and links inside them are never fetched automatically.

## Email intake

Suggested subject convention, optional for senders:

```text
TICKETS | PROJECT=<project code> | DATE=<YYYY-MM-DD> | VENDOR=<name>
```

Messages that don't follow it still get processed; unresolved metadata goes to review. A sender's address is a routing hint, not proof of identity.

Receiver steps:

1. Trigger on new mail in the configured shared mailbox folder.
2. Keep mailbox, message ID, Internet Message-ID, sender, subject and received time.
3. Enumerate attachments and fetch the actual bytes for each one. A metadata-only object is not a saved file.
4. Post each attachment to the intake API with a stable idempotency key.
5. Mark the message delivered only when every attachment has a receipt or a documented rejection.
6. On failure, retry only the attachments that are still unresolved, using the same keys.

Outlook triggers can fire twice, arrive with an empty attachment list, or miss events. A scheduled catch-up job re-lists the last 48 hours of mail and compares it with the intake ledger, so nothing is silently skipped.

### Intake API

```text
POST /api/v1/intake/attachments
Idempotency-Key: <stable source delivery key>
Content-Type: multipart/form-data   (metadata JSON + file bytes)
```

```json
{
  "schema_version": "1.0",
  "channel": "email",
  "source": { "mailbox_key": "DEMO-MAILBOX", "message_key": "DEMO-MESSAGE-001", "attachment_key": "DEMO-ATTACHMENT-001" },
  "received_at": "2026-10-05T14:30:00Z",
  "original_filename": "tickets.pdf",
  "defaults": { "project_external_id": "DEMO-P001", "service_date": "2026-10-04", "vendor_external_id": null, "cost_code": null },
  "mode": "demo"
}
```

The response returns `receipt_id`, `document_id`, `intake_status`, `duplicate_delivery_of` and `received_bytes`. The same key with the same bytes returns the existing receipt. The same key with different bytes is a conflict. The server computes the checksum itself.

## Capture

PDF, JPEG and PNG to start. The capture screen supports single or mixed projects per batch, default project and date, thumbnails, rotate and crop on a processing copy, retake, and submit as one batch. The original file is always kept as received.

Receipt, page, ticket and ticket line are separate objects. One page can hold three tickets and one ticket can span two pages, so reviewers get split and merge controls that keep the evidence links.

## Extraction and evidence

```text
receipt committed → file validation → previews → ticket boundaries → classification
                  → extraction → reference lookup → deterministic checks → review queue
```

For every extracted field the system stores raw text, parsed value, unit, page, bounding box, extractor version and confidence when the provider gives a meaningful one. When it doesn't, confidence is null rather than a made-up percentage.

Each value carries its origin: printed on the ticket, inherited from the batch, suggested by a mapping, derived by formula, or entered by a reviewer. A subject-line default never displays as if it were printed on the ticket.

During the pilot every ticket needs human approval. Automatic acceptance can come later, but only for specific ticket types with measured field accuracy and a tested rollback.

## Data model

| Table | Purpose |
|---|---|
| `intake_receipts` | Channel, source keys, status, attachment counts |
| `source_documents` | Private object key, hash, size, media type, original name |
| `document_pages` | Page number, preview, quality flags |
| `tickets` / `ticket_versions` | Business ticket, current version, append-only versions with author and reason |
| `ticket_evidence` | Version ↔ page region links (supports split and merge) |
| `ticket_lines` | Quantity, unit, basis, material, time, evidence |
| `field_candidates` | Raw and parsed values, origin, confidence |
| `code_allocations` | Cost-code splits per line and measure |
| `jobs` / `outbox_events` | Leased work and committed events awaiting delivery |
| `output_lines` | Daily destination rows and the ticket lines behind them |
| `integration_operations` | Operation key, request hash, remote IDs, outcome |
| `invoices` / `invoice_ticket_allocations` | Invoice lines matched to ticket lines with allocated amounts |
| `audit_events` | Actor, action, before and after, correlation ID |

Quantities and money use decimal types, never binary floating point. External identifiers are strings, so leading zeros survive. Ticket numbers are not globally unique, because two vendors can issue the same number.

Approval records the accepted version and queues output work in the same transaction. Edits use optimistic concurrency, so a stale form is rejected instead of overwriting someone else's change. A new version after approval goes back to review and supersedes any unsent output.

## State machines

Each dimension moves independently:

- Receipt: awaiting attachments, receiving, partial, received, rejected, delivery failed
- Processing: queued, processing, extracted, needs reprocess, failed
- Review: needs review, approved, rejected, superseded
- Delivery: not requested, queued, sending, succeeded, failed, uncertain, correction required
- Invoice matching: not matched, partial, matched, discrepancy, accepted exception

Worker loop:

```text
claim job with lease and expected source version
if this stage already succeeded for that version: return stored result
check prerequisites
run one stage
commit result and next outbox event in one transaction
release lease
transient error  → retry with backoff and jitter (max 5)
exhausted retries → create an actionable failure task
```

A timeout after a write to Procore is "uncertain", not "failed". The system reconciles against the target before it tries again, so retries never create duplicate entries.

## Validation rules

| Rule | Behavior |
|---|---|
| Missing project, vendor or date | Keep the ticket, block the affected output until resolved |
| Unknown cost code | Suggest mapped codes, never guess the final one |
| Gross − tare ≠ printed net | Flag it and keep the printed numbers unchanged |
| Truck type but no weight | Weight stays null; no derived tonnage |
| Tally marks | Store the interpreted count with its evidence and require review |
| Multiple runs | Keep each line; compare their sum to the printed total |
| Mixed units | Never summed together |
| Delivered vs. placed | Basis must match what the destination expects |
| Cost-code split | Allocations of the same measure must reconcile to the line |
| Overnight shift | Date rollover and breaks handled explicitly, not end − start |
| Possible duplicate | Reviewer decides; provenance kept, nothing merged destructively |
| Invoice cites a missing ticket | Missing-evidence exception; no placeholder ticket created |

Each rule has an ID, severity, version, scope and the destinations it blocks. Required fields are configured per destination, because what a daily quantity entry needs differs from what invoice matching needs.

## Outputs

The default output is the reviewed register and its CSV export. The Procore adapter runs in dry-run mode first, with a payload preview and a test history.

| Destination | Content |
|---|---|
| Daily Log Quantities | Reviewed quantity, date, unit, material and location |
| Daily Log Manpower | Only separately approved worker and hour facts |
| Attachments | Original ticket evidence |
| Export | Reviewed register plus mapping-ready daily rows |

Crew counts are never inferred from truck counts. The existing HCSS daily automation stays the source for manpower and equipment, so Ticket Desk doesn't duplicate it.

Daily rows aggregate by project, service date, destination, material, unit, basis and cost code. Each row links back to the ticket-line versions behind it. A ticket that arrives late produces a correction against what was already posted, not a second full total.

## Invoice matching

Invoices are their own document type. Matching starts with vendor and ticket number, then narrows by project, date and line. One invoice line can draw on several tickets and one ticket can support several lines, with partial allocations tracked so the same quantity never backs two payments. A match is evidence for review, not a payment approval.

## Screens

- **Work inbox:** counts for received, awaiting attachments, needs review, failed and ready; every count filters the real rows.
- **Capture:** upload, camera, batch defaults and per-file progress.
- **Review:** source on the left (55%), fields on the right, with zoom, rotation and field highlights. Raw and reviewed values are shown side by side.
- **Register:** search by ticket, truck, vendor, project or material; service date and received date are filtered separately.
- **Daily output:** desired rows vs. already posted, warnings and the dry-run payload.
- **Invoice matching:** invoice lines next to candidate tickets, with allocations and discrepancies.
- **Exceptions:** type, owner, age, blocking action and resolution.
- **Settings and health:** mappings, required-field profiles, mailbox status, OCR provider, Procore mode and the processing backlog.

## API

| Endpoint | Result |
|---|---|
| `POST /api/v1/intake/attachments` | Durable receipt, queued processing |
| `GET /api/v1/receipts/{id}` | Per-attachment state |
| `GET /api/v1/tickets` | Scoped, paginated register |
| `GET /api/v1/tickets/{id}` | Current version, evidence and history |
| `PATCH /api/v1/tickets/{id}/draft` | Edit against an expected version |
| `POST /api/v1/tickets/{id}/approve` | Approve the current version |
| `POST /api/v1/tickets/{id}/split-or-merge` | Change page and ticket boundaries |
| `GET /api/v1/daily-outputs` | Desired vs. posted by project and day |
| `POST /api/v1/daily-outputs/{id}/dispatch` | Send an approved output |
| `POST /api/v1/invoice-matches` | Record an evidence allocation |
| `POST /api/v1/exports` | Version-specific export |
| `GET /api/v1/integrations/health` | Status and actionable failures |

Example reviewed ticket (synthetic):

```json
{
  "ticket_id": "DEMO-T001",
  "version": 1,
  "project_id": "DEMO-P001",
  "vendor_id": "DEMO-V001",
  "ticket_number": "000123",
  "service_date": "2026-10-04",
  "truck_number": "T-12",
  "truck_type_raw": "super solo",
  "review_status": "needs_review",
  "lines": [
    {
      "line_id": "DEMO-L001",
      "material": "Demo aggregate",
      "quantity": "18.50",
      "unit": "short_ton",
      "quantity_basis": "delivered",
      "load_count": 1,
      "cost_code": null,
      "evidence": [{ "document_id": "DEMO-D001", "page": 1 }]
    }
  ],
  "delivery_status": "not_requested",
  "exceptions": ["COST_CODE_UNRESOLVED", "PROCORE_QUANTITY_BASIS_PENDING"]
}
```

Decimals travel as strings to keep precision. Null means unknown and never becomes zero.

## Security

- Organization sign-in with server-side role checks: submitter, project reviewer, operations lead, integration admin, read-only auditor.
- Private storage with short-lived download links, scoped to the user's projects.
- File signature and size validation; malformed files are quarantined.
- The intake credential can only create receipts. Only approved service identities can backfill or dispatch.
- CSV exports neutralize cells that start with formula characters.
- Secrets live in the deployment environment. `PROCORE_WRITES_ENABLED=false` and `DEMO_MODE=true` are the defaults.

## Acceptance tests

| Scenario | Expected result |
|---|---|
| Three attachments, the second fails | Two saved, one failed; only that one is retried |
| Same event delivered twice | Existing receipt returned; one job per document |
| Empty attachment list, populated later | Message waits, then completes |
| Three tickets on one page | Reviewer splits them; evidence regions kept |
| One ticket across two pages | One ticket with two evidence links |
| Gross/tare/net mismatch | Exception raised; printed values unchanged |
| Loads and tons in one batch | Separate measures, no mixed total |
| Two cost codes on one ticket | Allocations reconcile; quantity not duplicated |
| Job crashes after commit | Retry recognizes the finished stage |
| Procore timeout after a possible write | Marked uncertain and reconciled before retry |
| Ticket corrected after approval | New version back in review; queued output superseded |
| Late ticket after the daily total posted | Delta correction, not a duplicate total |
| Invoice cites a ticket that doesn't exist | Missing-evidence exception |
| Reviewer saves a stale version | Conflict response, no lost update |
| User opens another project's file URL | Denied server-side |
| App and worker restart | Receipts, versions and queue survive |

The full checklist, with status per test, is in [`ACCEPTANCE_CHECKLIST.csv`](ACCEPTANCE_CHECKLIST.csv).

## Delivery plan

1. **Receive and retain:** intake API, private storage, upload and camera, mail receiver, receipt ledger, catch-up job.
2. **Extract and review:** OCR adapter, evidence, ticket boundaries, rules, split-pane review, versioned approval. Manual entry works when OCR is offline.
3. **Register and output:** search, CSV exports, daily grouping, audit. This is the first release a field team can use.
4. **Procore pilot:** verified field mapping, sandbox project, one-ticket dry run, then reviewed live posting.
5. **Invoices and scale:** invoice ingestion, allocations, more vendor layouts and projects.

## Files in this folder

| File | Contents |
|---|---|
| `ACCEPTANCE_CHECKLIST.csv` | Acceptance tests and their status |
| `FIELD_MAPPING_REVIEW.csv` | Source field to normalized field mapping, per vendor layout |
| `INTEGRATION_CAPABILITIES.csv` | Mailbox, OCR, storage and Procore integration status |
| `DECISIONS.csv` | Open decisions, owners and evidence |
| `intake_metadata_DEMO.json`, `tickets_DEMO.json` | Synthetic examples of the intake and ticket schemas |
