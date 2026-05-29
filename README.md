# Resource Override

Redirect traffic, replace, edit, or inject content on any website. MV3 Chrome extension (unpacked — not on the Web Store).

## Installation

```sh
git clone https://github.com/iadvize/ResourceOverride.git
cd ResourceOverride
git checkout mv3
```

Then in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the cloned repo folder

After edits: hit the reload arrow on the extension card. For service worker changes, also click **Service worker** to restart it.

## MV3 fork status

Personal fork of the upstream `mv3` branch. Goal: restore parity with the V2 feature set under Manifest V3. Not on the Web Store; no new features planned. The following regressions have been fixed:

- **Service worker / DNR** — dynamic rules rebuilt on SW startup and `onInstalled`; rules survive worker termination or fresh install/import.
- **Script & CSS injection** — `webNavigation.onCommitted` awaits ruleset ready before injecting; CSP/permission failures surface in the SW console instead of being silently dropped.
- **File override size cap** — `fileOverride` payloads above 8KB flagged via `ruleErrors` instead of producing invalid DNR rules.
- **Import / Export** — `Save Rules` now awaits `exportData()`; importer accepts both `{v, ruleGroups}` and legacy `data` shapes.
- **Editor sync** — open editors closed on `sync` messages so stale buffers can't overwrite freshly synced state.
- **Dead code removed** — residual IndexedDB layer (`src/mainStorage.js`, `src/keyvalDB.js`) deleted; storage is exclusively `chrome.storage.local`.

### Known gaps

From `todo.txt`: v2 import/migration tool, suggestion staleness after navigation, body-script injection timing edge cases, drag-reorder for tab URL groups, help text overhaul.

## Branding

Official iAdvize logo: `assets/iadvize_logo.jpeg`. To run locally with iAdvize icons without committing them:

```sh
sips -s format png -z 16 16   assets/iadvize_logo.jpeg --out icons/icon-16x16.png
sips -s format png -z 48 48   assets/iadvize_logo.jpeg --out icons/icon-48x48.png
sips -s format png -z 128 128 assets/iadvize_logo.jpeg --out icons/icon-128x128.png
git update-index --skip-worktree icons/icon-16x16.png icons/icon-48x48.png icons/icon-128x128.png
```

To revert: `git update-index --no-skip-worktree icons/icon-*.png && git checkout icons/`.
