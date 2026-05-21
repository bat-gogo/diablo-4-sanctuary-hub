# D4 Public Data Sources — Probe Report

Probed 24 endpoints across 6 hosts on 2026-05-20. Raw responses in
`./responses/`, full status table in `./probe-report.json`.

## TL;DR

| Source                                        | Status | What we use it for                             |
|-----------------------------------------------|--------|------------------------------------------------|
| **diablo4.life** REST API                     | ✅ 200 | Live event timers + world-boss / helltide history |
| **Fandom Wiki** MediaWiki API + image CDN     | ✅ 200 | Class portraits + 26 unique-item icons + Warlock |
| **sunderarmor.com** (d4builds CDN)            | ✅ 200 | Real D4 skill icons (already wired)            |
| d4api.dev                                     | ❌ DNS | Domain no longer resolves                      |
| DiabloTools/d4data on GitHub                  | ❌ 404 | Repo doesn't exist at that org                 |
| blizzhackers/d4data JSON                      | ❌ ∅   | Repo exists but `data/base/meta/*` is empty (`.gitkeep` only). README says "Development halted; use the linked repo instead" |
| helltides.com Firebase (3 shards)             | ❌ 401 | Realtime DB requires auth                      |
| d4armory.io `/api/*`                          | ⚠️  SPA | Returns the SPA HTML, not actual JSON          |
| files.blizzhackers.dev/d4tex                  | ⏱  TO  | Times out                                      |

## diablo4.life — the gold standard

Public, unauthenticated, well-formed JSON. Used in Sanctuary Hub for:

- **`/api/trackers/list`** — current snapshot of every event:
  ```json
  {
    "helltide":      { "time": 1779364500000 },
    "worldBoss":     { "name": "Avarice, the Gold Cursed", "time": 1779370200000 },
    "nextWorldBoss": { "name": "Avarice, the Gold Cursed", "time": 1779370200000, "_id": "…" },
    "zoneEvent":     { "time": 1779364200000 },
    "chestRespawn":  1779368400000
  }
  ```
  `time` values are Unix-ms timestamps of the next spawn. We proxy this
  via `apps/web/app/api/events/route.ts` and the response is cached
  60s on our server. `EventTracker` consumes it and shows a green "Live"
  badge.

- **`/api/trackers/worldBoss/reportHistory`** — recent boss spawns:
  ```json
  {"reports":[
    {"_id":"…","name":"Avarice, the Gold Cursed",
     "location":"Fields of Desecration - Hawezar",
     "spawnTime":1716735600000,"reportTime":1716735520580,
     "user":{"displayName":"MiketheMason#1924", …}}
  ]}
  ```
  We mirror the last N reports into our own `world_boss_history` table
  so the `/events` page works even when diablo4.life is down.

- **`/api/trackers/helltide/reportHistory`** — recent helltide locations,
  same shape as `worldBoss/reportHistory` but for helltides.

- `/api/trackers/zone/reportHistory` — returns `[]` currently
  (no community reports in the polling window).

## Fandom Wiki

- **MediaWiki API** (`https://diablo.fandom.com/api.php?action=…`) — used
  by `scripts/upload-assets.ts` to look up the page images for each
  named D4 unique / mythic item plus class articles. Hits include
  Warlock (`Warlock-D4cncpt.jpg`).
- **CDN** (`static.wikia.nocookie.net/diablo/images/…`) — direct file
  URLs returned by the API. Note: the CDN always serves WebP regardless
  of the URL extension.

## sunderarmor.com

d4builds.gg's CDN. Unauthenticated. Used for skill icons:
- `/DIABLO4/Classes/2/{lowercase_class}.png` (small planner icon)
- `/DIABLO4/Skills/{snake_case_name}.png` (e.g. `bone_spear.png`)
Covers the 5 base classes; Paladin / Spiritborn / Warlock skill icons
aren't on this CDN — we fall back to game-icons SVGs for those.

## What we are NOT doing

- **No item / skill schema enrichment**: would have come from
  blizzhackers/d4data, but that repo is now an empty shell pointing at
  a UI (`https://blizzhackers.dev/#/d4data`) instead of a data source.
  Our seed descriptions stay faker-generated.
- **No Aspects / Affixes tables**: no public dump available.
- **Helltide zones data**: helltides.com keeps it in Firebase behind
  auth. We render a static list in `/events` instead.
