# Finish Filing: comprehensive second pass

This version addresses the remaining visible clutter, not just the easy files. It files every remaining visible loose file in the scoped locations unless the file is open, changing, unreadable, or part of an active download. It also moves ungrouped iCloud collections intact into logical parent folders.

No duplicate is removed and nothing is permanently deleted. Existing numbered folders from the first pass are retained.

## Run the approved filing

Save your work and quit Microsoft Word, Excel and PowerPoint. Close documents in Preview and other editors as well. Do not make changes to the source locations while this runs.

Paste this into Terminal:

```sh
zsh "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Finish Filing/Finish Filing.command"
```

**This command performs the approved filing.** It first saves a fresh preview and recovery plan, then makes verified moves without asking for another confirmation. To inspect a preview without moving anything instead, use:

```sh
ruby "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Finish Filing/complete_organizer.rb" preview
```

If Office is still running, it stops before starting moves so live lock files are not relocated. An open, changing, or incomplete file can remain as an explicitly reported exception.

## Scope

Visible loose files directly in:

- iCloud Drive
- Downloads, Desktop and Documents
- Pictures, Movies, Music and Public
- The top level of your home folder

Ungrouped folders at iCloud Drive's top level are moved **as complete collections**, preserving their internal structure, hidden members, filenames, versions, and relative paths within each collection. Files inside those collections are accounted for through the index and move verification; code is not dismantled.

The Mac and iCloud views of Desktop/Documents are recognized as aliases of the same directories, preventing duplicate operations. Separate hard-linked file names are preserved as separate names.

### Locations intentionally left functional

Operating-system locations, installed applications, hidden home folders, Photos and Photo Booth libraries, Music/TV/Fathom/Final Cut storage, Adobe settings, My Tableau Repository and the default Zoom location remain where their applications expect them. Existing numbered project folders remain in place.

Their visible entries are indexed where supported; application-package internals and system files are not individually recategorized. “Every file” does not mean breaking the operating system or rearranging a photo database's internal files.

## Filing logic

| Area | Use |
|---|---|
| 01 The Data Guys | Clearly identified company documents, named projects, partners and brand collections |
| 02 Civic & Community | Clearly identified civic organizations and community projects |
| 03 FIFA World Cup & Sports | The first pass's existing sports grouping remains intact |
| 04 Career & Professional | Applications, résumés and role information |
| 05 Personal | Identifiable personal/property records and sensitive records, without opening their contents |
| 06 Media | Images, recordings, video, audio and complete media collections |
| 07 Working Materials | Cross-project contracts, finance, proposals, meetings, policies, presentations and planning |
| 07 Archives | Intact older-computer collections, saved web pages and downloaded archives |
| 08 Data & Code | Source-preserving data/code workspaces and complete technical collections |
| 09 Reference & Research | Filename-identifiable AI/technology and economic/community material |
| 10 Filed Documents | Otherwise unidentified PDFs, editable documents, notes and other formats, divided by modification year |
| 99 To Review for Deletion | Office lock files, installers and older incomplete downloads, retained for review |

Project names are matched narrowly. When a filename does not establish ownership, purpose-based folders are used instead of assuming the document belongs to your company or a particular board. Ambiguous documents still get a physical filing location; they are not left loose.

For a subset of generic filenames, existing Spotlight titles and download domains provide additional hints. No document contents or credentials are read. A document's authoring title can be stale, so these hints are not presented as a content audit.

### Data and code workspaces

Loose spreadsheets, CSVs, Power BI files, scripts, databases and design assets are grouped by their **original source**, rather than separated solely by type or guessed project affiliation. For example, loose iCloud data assets and selected intact technical folders share:

`08 Data & Code/Workspaces/iCloud Loose Workspace`

This preserves co-location where possible. The master index has a separate **Topic** column for project/category searching without moving related source files into incompatible locations.

**Absolute references and links to relocated material may still need updating.** The organizer does not edit workbook formulas, Power BI source paths, code configuration, saved links or application settings. The relocation map and undo mechanism are provided for this reason. Preserve a separate backup of critical active work.

## Verification and recovery

Each operation is logged before the move. The move uses an atomic no-overwrite rename on the same volume; there is no copy-then-delete fallback. A whole collection is checked against the recorded identities and metadata of its members before and after moving.

Changed files, occupied destinations and open items are skipped. Unexpected move errors stop the run rather than causing cascading changes. Finder's `.DS_Store` and `.localized` metadata are retained but excluded from content-identity checks because browsing can modify them.

Reports live in:

`iCloud Drive/00 Start Here - File Guide/Finish Filing/Runs/<timestamp>/`

| Report | Purpose |
|---|---|
| `Preview.csv` | Original path, destination, category, topic and reason for each operation |
| `Where-Everything-Is.csv` | Fresh master index of actual current locations, searchable by name, category or topic |
| `Move-verification.csv` | Independently checked status of every planned move or collection |
| `Remaining-loose-files.csv` | Visible loose files still requiring attention; no silent leftovers |
| `Preserved-locations.csv` | App/user locations intentionally retained |
| `Verification.md` | Actual results, residual count and scan errors |
| `plan.json` and `journal.jsonl` | Recovery plan and append-only move history |
| `scan-scope-*.json` | Inventory exclusions and any read errors |

To check the latest second-pass run:

```sh
ruby "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Finish Filing/complete_organizer.rb" verify
```

To undo the latest second-pass run:

```sh
ruby "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Finish Filing/complete_organizer.rb" undo
```

Undo requires typing `UNDO`. It restores only unchanged files/collections whose old locations are free; it never overwrites new work. A changed collection is left intact for manual review. Reverse this pass **before** reversing the first pass.

## Storage and privacy

Nothing is permanently erased, Trash is not emptied, and iCloud optimization settings are not changed. The inventory/verification reads metadata rather than downloading file contents. macOS may perform background synchronization independently.

Filing and staging do not themselves establish recovered disk space. Cloud upload status is not verified. Reports contain filenames and paths, not document contents, and stay in your iCloud tools folder.

## Tested behavior

The second-pass test suite passed 19 tests and 80 assertions in both the development environment and on your Mac, using synthetic temporary files. Tests covered zero loose-file residue for normal fixtures, full restore, intact collection moves, hidden members, symlinks, hard links, collisions, changed/open files, Office gating, sensitive filenames, paired webpage resources and explicit preservation of app-managed locations.

A read-only live preview found **4,937 loose files and 108 intact collections** eligible for filing, covering 21,980 filesystem members including collection internals. No collection was blocked by a read error in that preview. These are pre-execution counts, not a completed-filing claim; the local run generates fresh counts.
