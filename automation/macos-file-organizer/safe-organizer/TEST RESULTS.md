# Organizer verification

The replacement organizer was tested with synthetic files, not by moving the user's documents. A separate live audit inspected filenames and metadata without moving user files.

## Tests

The Mac's built-in Ruby 2.6.10 successfully ran 18 automated tests with 59 assertions and no failures on September 28, 2026. The same suite also passed in the development sandbox.

The tests cover:

- Preview leaves originals unchanged.
- Move verification and restoration.
- Same-name/size files with different contents remain preserved.
- Destination collisions before and after preview.
- Source changes after preview.
- Undo refuses occupied original locations and modified destinations.
- Linked spreadsheets/data, sensitive names, temporary files and ambiguous names.
- Existing folder structures, packages and symlinks.
- Recording years and narrowly matched project names.
- Case-insensitive destination reservations.
- No-overwrite rename behavior on macOS.
- Unsafe destination paths and destination symlinks.
- Recovery after a move whose completion record was not written.
- Spreadsheet formula-safe CSV export.
- Re-running an already applied plan without moving files twice.

The test harness suppresses open-application inspection only for temporary synthetic fixtures. The actual organizer checks open files before execution and refreshes that list between batches.

## Scope of verification

These tests establish the tested safety behaviors, not a guarantee of perfect document classification. The tool uses filenames and filesystem metadata; it does not read every document's contents, prove that duplicates are byte-identical, verify iCloud upload status, or detect all embedded document links.

The live inventory excludes system/hidden locations and package internals, records scan errors, and does not claim to have reorganized the machine. All real moves require the user's local launch.

## Live metadata preview

At approximately 11:15 PM Pacific on September 28, the live read-only preview indexed 23,969 entries: 21,281 files plus 2,688 directories, packages and links. It reported no scan errors within its declared scope.

The preview proposed 2,896 individual-file moves and retained 21,073 entries in their current locations. Of the retained loose files, 5,478 were marked for identification or dependency review rather than forced into an unverified category. These counts are a snapshot, not a promise that the later local run will have identical totals.

The real open-file enumeration also completed successfully. No user documents were moved during these checks.
