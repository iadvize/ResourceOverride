# Resource Override

## MV3 fork status

This is a personal fork of the upstream `mv3` branch with the goal of
getting Resource Override working again under Manifest V3 — same
feature set as the V2 extension, no new features. Not on the Web
Store; load it as an unpacked extension. The following known MV3
regressions have been fixed:

- **Service worker / DNR** — dynamic rules are now rebuilt on SW startup
  and `onInstalled`, so rules survive a worker termination or a fresh
  install/import (`src/background.js`, `src/netRequestRules.js`).
- **Script & CSS injection** — `webNavigation.onCommitted` awaits the
  ruleset ready promise before injecting, and `executeScript` /
  `insertCSS` calls are wrapped so CSP/permission failures surface in
  the service worker console instead of being silently dropped.
- **File override size cap** — `fileOverride` payloads above 8KB are
  flagged via `ruleErrors` instead of producing invalid DNR rules.
- **Import / Export** — `Save Rules` now awaits `exportData()` (was
  serializing a pending Promise into an empty `{}` file); the importer
  accepts both the new `{v, ruleGroups}` shape and the legacy `data`
  shape.
- **Editor sync** — open editors are closed on `sync` messages so a
  stale buffer can't overwrite freshly synced state (was the
  "Close editors when we get a sync update" item in `todo.txt`).
- **Dead code removed** — residual IndexedDB layer
  (`src/mainStorage.js`, `src/keyvalDB.js`) deleted; storage is now
  exclusively `chrome.storage.local`.

### Known gaps

Items from `todo.txt` not yet addressed: v2 import / migration tool,
suggestion staleness after navigation, body-script injection timing
edge cases, drag-reorder for tab URL groups, help text overhaul.

---

## !!! Development on RO has stopped indefinitely !!!

If you still need to override stuff - see how chrome can override content natively: https://www.youtube.com/watch?v=KxjGYcHZ_uI

You can try to use my half baked [MV3 branch here](https://github.com/kylepaulsen/ResourceOverride/tree/mv3), but it is untested and I won't be supporting it.

I don't plan to work on RO anymore so it's very unlikly this will ever be
finished. I'm not the biggest fan of what MV3 is forcing upon
people, so I don't have very much motivation to finish this.
Additionally, most modern web development doesn't really need/work
with an extension like this, and even if there are use cases,
Chrome supports overriding content natively within their debug
tools: https://www.youtube.com/watch?v=KxjGYcHZ_uI

Anyway, I apologize if this is disappointing news. You are welcome
to build the extension yourself or use the source code in other
ways, as it is under the MIT license. Maybe someday I will really
wish I finished this and have a bad need for it - but until that
day, this will be my last commit.

Thanks everyone for using RO.

I wish you the best.

### Branding assets

The official iAdvize logo lives in `assets/iadvize_logo.jpeg` and is
tracked in git. The `assets/` directory is the canonical place for any
branded source asset that should ship with the repo.

Default extension icons in `icons/` are still the upstream kylepaulsen
PNGs. To run the extension locally with iAdvize icons without committing
them, follow this workflow:

1. Resize `assets/iadvize_logo.jpeg` into the three required sizes,
   overwriting the icons locally. On macOS:

   ```sh
   sips -s format png -z 16 16   assets/iadvize_logo.jpeg --out icons/icon-16x16.png
   sips -s format png -z 48 48   assets/iadvize_logo.jpeg --out icons/icon-48x48.png
   sips -s format png -z 128 128 assets/iadvize_logo.jpeg --out icons/icon-128x128.png
   ```

2. Tell git to ignore worktree changes to the three icon files:

   ```sh
   git update-index --skip-worktree icons/icon-16x16.png icons/icon-48x48.png icons/icon-128x128.png
   ```

   To revert: `git update-index --no-skip-worktree icons/icon-*.png && git checkout icons/`.

### Old Readme text:

Resource Override is an extension to help you gain full control of any website by redirecting traffic, replacing, editing, or inserting new content.

[Get the chrome extension here](https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii).

### Now on firefox!
[Get the FireFox extension here](https://addons.mozilla.org/en-US/firefox/addon/resourceoverride/)
