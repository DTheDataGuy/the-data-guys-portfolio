# Safe File Organizer

Built for your iCloud Drive, Mac user folders, and the organizations and projects represented in your filenames. This is a local organizer, not a claim that your files have already been moved.

## Launch

Open Terminal and paste this exact command:

```sh
zsh "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Organizer v2/Start Organizer.command"
```

Choose **1** to create a fresh inventory and preview. Finder reveals `Preview.csv`; open it to review every proposed move and its reason. If you want any proposed files left where they are, enter their IDs or ranges when prompted; otherwise press Return.

Type **ORGANIZE** to perform the selected moves. This local confirmation prevents accidental execution when opening the tool. It does not require another approval message in the conversation.

The organizer uses the Ruby interpreter already verified on your Mac. It installs nothing, makes no network requests, and needs no password or administrator command. macOS may prompt for the relevant folder access when you run it from Terminal; do not disable system protections.

## The filing logic

Everything in the scanned locations gets an index entry, not necessarily a new folder. A useful standalone file may stay where it is, while a document clearly associated with a project can move into a shallow, named group.

- **Your organizations and projects:** explicit matches for CTAB, CDCPDA, iUrban Teen, NAACP and Read Rise & Thrive, AMPLIFY, the MLK coalition, Community One, Black Diasporic work, FIFA/World Cup, Cascade Civil/Enterprise Group/Executive, Client B and other named projects.
- **Your company:** documents explicitly naming The Data Guys are organized by purpose, such as finance, administration, brand, proposals or presentations.
- **Your career:** personal résumés and cover letters are identified separately from company proposals and civic documents.
- **Your media:** screen recordings and screenshots by year, camera originals and explicitly named AI images. All recordings are retained.
- **Uncertain ownership:** general tax, budget, contract and research files are not assumed to belong to your business. They remain in place with a review reason.
- **Existing groups:** folders, repositories, app libraries and their internal structures stay intact. Their indexed paths provide navigation without dismantling useful structures.

“High confidence” means a narrow filename rule matched, not that every document's contents were read. Multiple project names, uncertain names, linked assets, and content-sensitive decisions remain review items. This conservatism is intentional; the tool is not a substitute for reviewing ambiguous documents.

## What can move

Older, loose, clearly named standalone documents, presentations and media in iCloud's top level, Downloads, Desktop, Documents, home-root documents, and the specific historical Desktop/Documents dump folders found in your iCloud. Standalone installers may move into `99 To Review for Deletion/Installers`, where you can decide what to retain.

Files modified within the last 24 hours and files currently open in an app are skipped. Close documents before running and avoid working on the folders during the run; an app can open a file after the open-file check.

## What will not be moved automatically

- Existing folders or their members, repositories, Photos/Music/TV/Final Cut libraries and other app packages.
- Spreadsheets, CSVs, Power BI files, code, databases and design assets whose paths might be dependencies.
- Password/credential-related files, temporary/lock files, calendar attachments or incomplete downloads.
- Ambiguous filenames, unknown archives, symlinks, hidden files, system files or anything that changed since preview.
- Possible duplicates based on name and size. They are listed separately as **unverified**, and every copy remains preserved.

A presentation or ordinary document can still contain external links even if its filename looks standalone. Exclude known linked documents in the preview. The tool does not claim to detect every embedded dependency.

## Scope and honest coverage

The inventory includes iCloud Drive, Downloads, Desktop, Documents, Pictures, Movies, Music and Public, plus visible files directly in your home folder. Hidden directories, application package contents, system locations, other cloud providers, shared disks and external drives are not traversed.

The inventory has an explicit exclusions/error report. App packages are represented as intact entries, not thousands of internal files. This is not a whole-computer audit of every system or hidden file.

## Verification and recovery

- Moves use an atomic, no-overwrite rename. Cross-volume operations are blocked rather than using copy-and-delete.
- Each planned move is journaled before execution and checked afterward by filesystem identity, size and modification time.
- A changed source, occupied destination or unexpected error is skipped or stops the run. There is no bulk deletion or automatic cleanup.
- Launch again and choose **2** to verify or **3** to undo a particular run.
- Undo restores only unchanged files when the original location is free. It never overwrites new work; skipped items are reported.
- A separate backup of irreplaceable data remains advisable. iCloud synchronization is not independently verified by this tool.

Reports are saved under:

```text
iCloud Drive/00 Start Here - File Guide/Organizer v2/Runs/<timestamp>/
```

| Report | Use |
|---|---|
| `READ FIRST.md` | Preview totals and destination groups |
| `Preview.csv` | Every indexed item, proposed action, destination and reason |
| `Needs-review.csv` | Files needing identification, dependency or ownership review |
| `Where-Everything-Is.csv` | Actual checked locations and per-item verification status |
| `Verification.md` | Summary of moved, retained, changed and missing entries |
| `Possible-duplicates-NOT-confirmed.csv` | Name/size candidates only; not authorization to delete |
| `scan-scope.json` | Explicit scope, excluded items and scan errors |
| `plan.json`, `approved-plan.json`, `journal.jsonl` | Auditable preview, approved selection and recovery records |

Use **4** in the launcher to search the latest location index by filename, project or path. The CSV can also be searched in Numbers or Excel. The index is a snapshot; create a new preview to include files added later.

## Storage

The scan reads metadata, not file contents, and does not deliberately download cloud-only files. macOS/iCloud can still perform its own background synchronization.

Moving or staging a file is not the same as freeing storage. This organizer does not delete files, empty Trash, remove local downloads or change iCloud optimization settings. Confirmed storage recovery requires a separate review and verified cloud upload status.

## Prior script

Do not use the older `organize.sh`, `undo.sh` or `manifest.csv` in the parent guide folder. Those are superseded draft materials; the old organizer remains safety-paused. Use this version and its own run logs only.
