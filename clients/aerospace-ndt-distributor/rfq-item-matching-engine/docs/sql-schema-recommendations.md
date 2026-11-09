Distributor RFQ Automation
SQL Schema Recommendations & Data Model Guide

Prepared for: the operations lead / Distributor NDT
Prepared by: The Data Guys(TM)
Purpose: Provide a direct implementation reference for the RFQ automation SQL layer inside Distributor IMS.

1. Executive Summary

This document defines the recommended SQL Server schema for the RFQ automation implementation. The goal is to give the operations lead a practical, implementation-ready data model that supports RFQ intake, raw email archiving, attachment processing, matcher output, operator review, audit history, and future reporting.

The recommended approach uses quote_* tables inside the existing Distributor IMS SQL Server environment. This keeps the RFQ automation domain separate from the existing inventory/catalog tables while still allowing the matcher to read from Distributor IMS catalog data.

The core design principle is:

Archive what arrived.
Version how it was interpreted.
Audit every operator decision.

2. Why These Tables Exist

2.1 quote_rfq_archive

Purpose:
This is the immutable record of every RFQ that enters the system. It stores the email-level intake data, including sender, subject, body text, received date, Graph message ID, processing status, and error details.

Why it exists:
The archive table preserves the original business request. Even if the matcher improves later, the system should never lose the original RFQ record.

What it answers:
- What RFQ came in?
- Who sent it?
- When was it received?
- Has it been processed?
- Did processing fail?
- Can we reprocess the original request later?

Retention recommendation:
Keep for at least 7 years unless Distributor has a different retention policy. RFQs are business records connected to quoting, customer communication, and potential order history.

2.2 quote_rfq_attachments

Purpose:
Stores metadata and extracted text for every attachment connected to an RFQ.

Why it exists:
RFQ data may arrive in PDFs, Excel files, Word documents, text files, or attached quote forms. Attachment-level storage keeps document parsing separate from email-level archiving.

What it answers:
- Which files came with the RFQ?
- Was text extracted successfully?
- Which attachment produced a matched line item?
- Did the extractor fail on a specific file?
- Can the file be reprocessed later?

Retention recommendation:
Retain for the same period as the archive record. If raw files are stored outside SQL, store the reference path and hash in SQL.

2.3 quote_rfq_matches

Purpose:
Stores the matcher output for every extracted RFQ line item.

Why it exists:
The matcher output is not the same as the original RFQ. It is the system's interpretation of a line item. This table allows results to be reviewed, corrected, rerun, and improved without overwriting the original archive.

What it answers:
- What part number or description was extracted?
- What category did the matcher assign?
- What Distributor part was suggested?
- What confidence score was returned?
- Did the item require review?
- Did an operator approve or correct the result?

Retention recommendation:
Retain for the same period as the RFQ archive. These records become a valuable training and quality-improvement dataset over time.

2.4 quote_audit_log

Purpose:
Records every important action taken on an RFQ or match result.

Why it exists:
RFQ automation needs traceability. If a match was changed, approved, rerun, or corrected, Distributor should know who made the change, when, and why.

What it answers:
- Who reviewed this RFQ?
- Who corrected the match?
- Was the matcher rerun?
- What changed between the original result and the final operator decision?
- Can we prove what happened during processing?

Retention recommendation:
Retain as long as the RFQ archive is retained.

2.5 quote_cross_references

Purpose:
Stores competitor part number to Distributor part number mappings.

Why it exists:
The Python notebook originally used a hardcoded OEM-to-DST mapping. In production, this should move into a SQL table so the operations lead can add or update mappings without changing code.

What it answers:
- Does this competitor part already map to an Distributor item?
- Which Distributor part should be quoted?
- Who created or updated the mapping?
- Which competitor references are still missing?

Retention recommendation:
Keep indefinitely while active. Deactivate rather than delete if a mapping becomes obsolete.

2.6 quote_extraction_noise_terms

Purpose:
Stores common RFQ words that should be ignored during part-number extraction.

Why it exists:
Words such as PN, QTY, DESCRIPTION, QUOTE, ATTACHED, ITEM, and LEAD TIME can appear in RFQs and should not be treated as item numbers.

What it answers:
- Which tokens should the extractor ignore?
- Can the operations lead tune extraction behavior without code changes?

Retention recommendation:
Keep indefinitely and manage through an admin/config view.

2.7 quote_extraction_junk_patterns

Purpose:
Stores regex patterns for values that look like part numbers but are not quoteable inventory items.

Examples include RFQ numbers, purchase request IDs, ASTM references, fractions, and serial numbers.

Why it exists:
This prevents false positives during extraction.

Retention recommendation:
Keep indefinitely and tune as new RFQ formats appear.

2.8 quote_out_of_scope_prefixes

Purpose:
Stores prefixes that classify an item as out of scope.

Current examples:
- RT-
- RS-

Why it exists:
The prototype identified X-Ray/radiation-related items as outside the current Distributor NDT quoting scope.

Retention recommendation:
Keep indefinitely and update as scope rules change.

2.9 quote_description_keywords

Purpose:
Stores keywords used for description-only matching.

Why it exists:
Some RFQs do not include a part number. Description matching helps identify likely catalog candidates while still requiring human review.

Retention recommendation:
Keep indefinitely and tune as the operations lead reviews live RFQ traffic.

2.10 quote_config

Purpose:
Stores runtime matcher settings such as fuzzy cutoff, candidate limits, and auto-approval flags.

Why it exists:
Thresholds should be tunable without redeploying code.

Retention recommendation:
Keep indefinitely. Use updates rather than deletes.

3. How the Tables Relate

High-level relationship:

quote_rfq_archive
    one RFQ email/request
        |
        |-- quote_rfq_attachments
        |       many attachments per RFQ
        |
        |-- quote_rfq_matches
        |       many extracted line items per RFQ
        |
        |-- quote_audit_log
                many actions per RFQ and/or match

Configuration tables do not depend on a single RFQ. They support the matcher engine globally:

quote_cross_references
quote_extraction_noise_terms
quote_extraction_junk_patterns
quote_out_of_scope_prefixes
quote_description_keywords
quote_config

These configuration tables make the matcher maintainable and adjustable over time.

4. Data Flow

Step 1 - Intake
An RFQ arrives in rfq@distributor.example or another approved intake method.

Step 2 - Archive
The system creates one row in quote_rfq_archive. This row stores the email subject, sender, body, message identifiers, and processing status.

Step 3 - Attachment Processing
For each attachment, the system creates one row in quote_rfq_attachments. The extractor stores file metadata, extracted text, status, and any extraction errors.

Step 4 - Extraction
The RFQ body and/or attachment text are parsed into candidate line items.

Step 5 - Matching
Each candidate line item is processed through the matcher decision flow:
Normalize -> Out of Scope -> Exact Match -> Cross Reference -> Cross Reference Needed -> Partial Match -> Description Match -> No Match.

Step 6 - Match Storage
The system writes one row per extracted item into quote_rfq_matches.

Step 7 - Operator Review
The review queue reads from quote_rfq_matches. Operators can approve, correct, mark out of scope, create cross references, or rerun matching.

Step 8 - Audit
Every important action writes to quote_audit_log.

Step 9 - Reporting
The same tables support dashboards for RFQ volume, match rate, no-match volume, operator review time, frequent requested parts, and cross-reference gaps.

5. Recommended Indexes

quote_rfq_archive
- UX_quote_rfq_archive_GraphMessageId
  Prevents duplicate mailbox processing.
- IX_quote_rfq_archive_ReceivedAtUtc
  Supports date-based RFQ review and reporting.
- IX_quote_rfq_archive_ProcessingStatus
  Supports processing queues.
- IX_quote_rfq_archive_OriginalSenderEmail
  Supports customer/RFQ frequency reporting.

quote_rfq_attachments
- IX_quote_rfq_attachments_RfqArchiveId
  Supports retrieval of all attachments for one RFQ.
- IX_quote_rfq_attachments_FileHashSha256
  Supports duplicate file detection if file hashing is used.

quote_rfq_matches
- IX_quote_rfq_matches_RfqArchiveId
  Supports viewing all matched lines for an RFQ.
- IX_quote_rfq_matches_AttachmentId
  Supports tracing matches back to attachments.
- IX_quote_rfq_matches_MatchCategory
  Supports match-rate reporting.
- IX_quote_rfq_matches_RequiresReview
  Supports review queue filtering.
- IX_quote_rfq_matches_MatchedDistributorPartNumber
  Supports frequently requested part reporting.
- IX_quote_rfq_matches_ParsedPartNumberNormalized
  Supports rerun/comparison and troubleshooting.
- IX_quote_rfq_matches_RunId
  Supports grouping results from a matcher run.

quote_cross_references
- UX_quote_cross_references_CompetitorPartNumberNormalized
  Prevents duplicate active mappings.
- IX_quote_cross_references_DistributorPartNumber
  Supports mapping review by Distributor item.

quote_audit_log
- IX_quote_audit_log_RfqArchiveId
- IX_quote_audit_log_MatchId
- IX_quote_audit_log_ActionType
- IX_quote_audit_log_PerformedAtUtc

6. Retention Recommendations

Recommended default:
- RFQ archive: 7 years
- Attachments: 7 years, or according to Distributor document retention policy
- Matches: 7 years
- Audit log: 7 years
- Configuration tables: retain indefinitely; deactivate rather than delete
- Raw attachment files: retain according to business/legal policy; store path/hash in SQL

Reasoning:
RFQs are business records. They may relate to quotes, customer interactions, pricing decisions, and future orders. The system should preserve enough history to support audit, reporting, and process improvement.

7. Data Flow Principle

The archive is the source of truth for what arrived.
The matches table is the system's interpretation.
The audit log is the record of human and system actions.
Configuration tables are the adjustable rules that make the matcher maintainable.

Do not overwrite the original RFQ.
Do not delete match history unless retention policy requires it.
Do not hardcode tunable rules if they can live in configuration tables.

8. Implementation Notes for the operations lead

Recommended build order:
1. Create configuration tables.
2. Create operational tables.
3. Seed initial config values.
4. Create the review queue view.
5. Wire the C# matcher to read configuration.
6. Save RFQ archive rows during intake.
7. Save attachment rows during extraction.
8. Save match rows during matcher execution.
9. Write audit rows during review and correction.
10. Add reporting views once live data exists.

Recommended C# integration pattern:
- RfqArchiveRepository
- RfqAttachmentRepository
- RfqMatchRepository
- RfqAuditRepository
- RfqConfigurationRepository
- RfqCrossReferenceRepository

Recommended caution:
This SQL script is implementation-ready but should still be reviewed against Distributor IMS naming conventions, migration strategy, and any existing table standards before deployment to TEST or PROD.

9. Acceptance Criteria

The SQL layer is ready when:
- Duplicate RFQ emails cannot be processed twice by GraphMessageId.
- Every RFQ creates one archive row.
- Every attachment creates one attachment row.
- Every extracted RFQ line creates one match row.
- Review-required items can be queried quickly.
- Operator decisions can be written back to quote_rfq_matches.
- Every operator decision creates an audit row.
- Configuration values can be updated without code changes.
- The matcher can be rerun without overwriting the original RFQ archive.
- Reporting can summarize match category, no-match volume, and cross-reference gaps.
