# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is the `mv3` branch of Resource Override — an in-progress, **untested** port of a Manifest V2 Chrome extension to Manifest V3. Upstream development was halted by the original author (see README.md). Treat the code as a work-in-progress: comments like `// TODO` and `todo.txt` describe known gaps. No releases are cut from this branch.

## Build / Tooling

There is **no build step, no package.json, no bundler, no lint config**. The extension is loaded directly as an unpacked extension from the repo root (`manifest.json` is at root).

- **Load in Chrome**: `chrome://extensions` → enable Developer mode → "Load unpacked" → select repo root.
- **Reload after edits**: hit the reload arrow on the extension card; for service worker changes, also click "Service worker" to restart it.
- **Run tests**: `node test/globMatchToDNRRegexTest.js` (the only test file; throws on failure, silent on pass).
- **Editor style**: 4-space indent, LF, UTF-8, final newline (see `.editorconfig`); 2-space for JSON.

## Architecture

Resource Override redirects/rewrites/injects web traffic via Chrome's `declarativeNetRequest` API plus `chrome.scripting` for file injection. Three runtime contexts cooperate:

1. **Service worker** (`src/background.js`, declared `type: "module"` in `manifest.json`)
   - Loads rule groups from `chrome.storage.local` on start; reloads on `{action: "sync"}` messages.
   - Listens to `chrome.webNavigation.onCommitted` and uses `chrome.scripting.executeScript` / `insertCSS` to apply `fileInject` rules (JS injected into `MAIN` world via a script element).
   - Opens the options page when the toolbar icon is clicked.

2. **DevTools panel + options page** (`src/devtools.js` creates the panel; `src/devtoolstab.html` + `src/devtoolstab.js` are the actual UI, also reused as `options_ui`)
   - Renders rule groups and rules, persists changes to `chrome.storage.local`, and calls `setupNetRequestRules` to push the resulting DNR rules via `chrome.declarativeNetRequest.updateDynamicRules`.
   - After every save it sends `{action: "sync"}` so the service worker reloads its in-memory copy (`util.js#saveDataAndSync` + `sendSyncMessage`).

3. **Storage**
   - Primary store is `chrome.storage.local` under key `ruleGroups` (array of `{id, name, on, rules: [...]}`).
   - File contents for `fileInject`/`fileOverride` rules are stored separately under `f<ruleId>` keys (large blobs kept out of the main object).
   - `src/mainStorage.js` + `src/keyvalDB.js` wrap IndexedDB; per `git log` ("Big refactor to use chrome.storage as main storage tool") this is residual from the older storage model — prefer `chrome.storage.local` for new code.

### Rule types & DNR translation

Rule objects (`{id, type, match, replace?, on, ...}`) live inside groups. `src/netRequestRules.js#setupNetRequestRules` converts them into DNR dynamic rules. Supported `type`s:
- `normalOverride` — `match` → `replace` URL redirect.
- `fileOverride` — replace response with an inline data URL containing the stored file (MIME guessed via `src/extractMime.js`).
- `fileInject` — not a DNR rule; handled in the service worker via `chrome.scripting` on navigation.
- `headerRule` — modifies request/response headers (`src/headers.js`, `src/headerRule.js`, parsed via `util.js#parseHeaderDataStr`).
- `webRule` — toggles a request on/off (block / allow).

Glob match strings (`*.example.com/path/*`) are converted to anchored DNR regex by `src/globMatchToDNRRegex.js`. Strings wrapped in `/.../` are treated as raw regex and passed through (`netRequestRules.js#transformMatchReplace`). When changing this transform, update `test/globMatchToDNRRegexTest.js`.

### UI modules

Roughly one file per UI concept, all plain DOM (no framework): `tabGroup.js` (domain group container), `moveableRules.js` (drag-reorder), `fileRule.js` / `headerRule.js` / `injectRule.js` / `webRule.js` (per-rule-type rendering), `editor.js` (Ace wrapper, lib in `lib/ace`), `suggest.js` (URL autocomplete using `chrome.devtools.inspectedWindow.getResources`), `onOffSwitch.js`, `options.js`, `importExport.js`. The `lib/` directory ships vendored copies of Ace, beautify, and jQuery — jQuery is legacy and per recent commits is being removed; do not introduce new jQuery usage.

## Conventions

- ES modules everywhere in `src/` — `import`/`export`, no CommonJS, no transpilation.
- `/* globals chrome */` or `/* global chrome */` comment at top of files that use the `chrome.*` APIs.
- IDs: rule and group IDs are integers; DOM elements prefix them (`#r<id>`, `#g<id>`, file keys are `f<id>`). Use the `getNext*Id` helpers in `util.js` when creating new ones.
- After mutating `ruleGroups`, always call `saveDataAndSync` (not `chrome.storage.local.set` directly) so the service worker reloads.

## Known landmines

- `background.js` is a service worker — it can be terminated at any time. State that must survive lives in `chrome.storage.local`; the in-memory `allRuleGroups` is rebuilt by `reloadData()` on start and on sync.
- DNR rule IDs collide with rule object IDs by design — `setupNetRequestRules` uses the same integer for both. Keep them in sync when adding rule types.
- `todo.txt` lists the original author's outstanding bugs (script inject timing, suggestion staleness after navigation, etc.) — useful context but not a roadmap.
