# Restore the organized iCloud layout

This repair uses the successful first- and second-pass move histories to identify files that were subsequently moved or restored. It returns matching loose files to their exact earlier destinations, including files that belong inside a code project or archived collection.

The file's current contents are preserved, even if it has been edited. This is path reconciliation, not restoration of an older file version. If a destination is occupied, the incoming file receives a separate retained-copy name; nothing is overwritten or deleted.

## Run

Save and close documents, quit Word/Excel/PowerPoint, and stop other Finder moves or restores. Then run:

```sh
zsh "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Restore Layout/Restore Organized Layout.command"
```

This performs the already-authorized reconciliation. Do not launch the older organizers or move files simultaneously.

## What it does

- Matches returned files to their successful filing records by filesystem identity.
- Preserves current edits and every version.
- Files unknown loose files using the existing project/purpose/type rules.
- Keeps iCloud as the destination for ordinary personal documents and media.
- Preserves app-managed and operating-system locations.
- Creates a new preview, verification report and undo journal.
- Refreshes `START HERE.md`, `CURRENT FILE INDEX.csv`, `CURRENT EXCEPTIONS.csv` and `HISTORICAL FILE AUDIT.csv` in the main file-guide folder.

The final audit compares every historical file identity with its actual indexed location and checks known hidden project members at their recorded paths. Files found elsewhere or not located are explicitly flagged. “Not located” does not prove deletion; a file may have been copied with a new identity, moved outside the scanned scope, or changed by synchronization.

Missing or removed items are not automatically recovered from Trash, and the tool does not pretend to verify intentional deletion. It does not download file contents, change iCloud optimization settings, or prove that synchronization has completed.

## Why files can still appear in Recents

Recents is a Finder search view, not another folder containing extra copies. Files correctly stored in iCloud can appear there; moving or deleting them from Recents changes the actual files ([Apple Support Community](https://discussions.apple.com/thread/254063196)).

Use iCloud Drive and the current index to navigate. Do not drag all Recents items back into the iCloud root.

## Storage

Your 6 TB iCloud capacity is the preferred destination for personal documents and media. Some app/system files must remain in supported local locations, and iCloud files can still have local downloaded copies. Apple's Optimize Mac Storage and Remove Download options address local storage, but removing a download should follow verified synchronization, not replace it ([Apple Support](https://support.apple.com/guide/mac-help/work-with-folders-and-files-in-icloud-drive-mchl1a02d711/mac)).

## Verify or undo

```sh
ruby "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Restore Layout/reconcile.rb" verify
```

```sh
ruby "$HOME/Library/Mobile Documents/com~apple~CloudDocs/00 Start Here - File Guide/Restore Layout/reconcile.rb" undo
```

Undo requires typing `UNDO` and skips changed files or occupied original paths. Reverse this repair before reversing either earlier pass. The journals remain the recovery record.

## If using the downloaded package

Unzip `Restore Layout.zip`. Move the resulting **Restore Layout** folder into:

`iCloud Drive → 00 Start Here - File Guide`

Then use the launch command above. Do not overwrite an existing folder containing prior `Runs`; keep that history. No file moves occur merely from downloading or unzipping the package.

This repair's additional tests passed in the development environment. The underlying first- and second-pass safety engines were previously tested on the Mac. A fresh real-file run and verification are still required; the package is not a claim that the returned files have already been corrected.
