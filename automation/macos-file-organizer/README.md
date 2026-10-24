# Safe macOS File Organizer

**Client / organization:** The Data Guys (internal tooling)  
**Built by:** Dei'Marlon Scisney · The Data Guys

## Overview

A safety-first file-organization toolkit for macOS and iCloud Drive. It classifies and files thousands of documents into a project-aware structure, and every move is reversible.

## Tech stack

`Ruby` · `Shell (.command)` · `Unit tests`

## Engineering highlights

- **Safety core** (`safety_core.rb`): dry-run planning, collision handling, protected system and app-managed locations, and a move journal for rollback.
- **Reconcile and restore** (`restore-layout/reconcile.rb`): rebuilds the intended layout from the journal.
- **Test suites** (`test_*.rb`) with recorded results.
- Double-click `.command` launchers for non-technical users.
- ~3,450 lines of Ruby.

## Run it

Each tool ships with a double-click `.command` launcher and a `READ ME FIRST.md`. Every tool plans in dry-run mode first and journals each move, so any run can be reversed.

```bash
ruby safe-organizer/test_organizer.rb      # organizer test suite
ruby finish-filing/test_complete.rb        # second-pass filing tests
ruby restore-layout/test_reconcile.rb      # journal reconcile and restore tests
```

## Code footprint

| Language | Authored lines |
|---|---:|
| Ruby | 3,454 |
| Shell | 16 |

## Confidentiality

Personal file inventories excluded.
