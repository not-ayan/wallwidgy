# WallWidgy State Machines, Invariants, and Transition Audit

This document catalogs every explicit and implicit state machine across the WallWidgy web application (`app/`, `hooks/`, `lib/`, `public/sw.js`) and its companion Telegram notification bot (`bot.py`), documents their states, invariants, and transition tables, and records confirmed invalid states and transitions (including concurrency and retry hazards) grouped into prioritized issues.

---

## Inventory of State Machines

| ID | Name | Kind | Primary Files |
|---|---|---|---|
| **SM-1** | Telegram Notification Wizard & Gist RMW | Explicit FSM (`aiogram.fsm`) + Serialized RMW | `bot.py` |
| **SM-2** | User Favorites, Auth Sync & Conflict Resolution | Implicit (React Context + Serialized Queue + Clerk API + `localStorage`) | `hooks/use-favorites.tsx`, `lib/favorites-state.ts`, `app/components/FavoritesSyncModal.tsx`, `app/api/favorites/route.ts` |
| **SM-3** | Server Wallpaper & Color Index Cache | Implicit (Module-level singleton + Single-flight) | `lib/wallpapers.ts`, `lib/colors.ts`, `app/api/wallpapers/index/route.ts`, `app/api/colors/route.ts`, `app/api/wallpapers/route.ts`, `app/api/random-wallpapers/route.ts`, `app/api/wallpapers/search/route.ts`, `app/api/downloads/route.ts` |
| **SM-4** | Client Wallpaper Store & Parsed Cache | Implicit (Memory + `sessionStorage` + Single-flight + Fallback) | `lib/wallpaper-store.ts` |
| **SM-5** | Global Back-Button / History Interception Stack | Implicit (Singleton Manager + `window.history` Guard) | `hooks/use-back-handler.ts`, `lib/back-handler-manager.ts` |
| **SM-6** | Wallpaper Modal, Image Quality & Similar Tray | Implicit (Modal UI + History Stack + Request-Guarded Recs) | `app/components/WallpaperModal.tsx`, `app/components/SimilarWallpapers.tsx`, `lib/ui-state-helpers.ts` |
| **SM-7** | Wallpaper Grid Gallery, Pagination & Downloads | Implicit (Fetch/Retry + Filter + Selection + Counter-Guarded Download) | `app/components/WallpaperGrid.tsx`, `lib/ui-state-helpers.ts` |
| **SM-8** | Search Console & Infinite Results | Implicit (Debounced Request-Guarded Search + Infinite Scroll) | `app/components/SearchBar.tsx`, `lib/ui-state-helpers.ts` |
| **SM-9** | Notification Center & Toast Queue | Implicit (Feed Fetch + Read/Dismissed Persistence + Managed Timers) | `app/components/NotificationCenter.tsx`, `lib/ui-state-helpers.ts` |
| **SM-10** | PWA Service Worker Lifecycle & Fetch Strategy | Implicit (SW Lifecycle + Cache-First/Network-First/SWR) | `public/sw.js` |

---

## SM-1: Telegram Notification Wizard & Gist RMW (`bot.py`)

### States
1. `IDLE` (`FSMContext` state = `None`)
2. `CreateNotification.title` (awaiting title text)
3. `CreateNotification.message` (awaiting body text)
4. `CreateNotification.type` (awaiting one of `info`, `success`, `warning`, `announcement`)
5. `CreateNotification.link` (awaiting link URL or Skip)
6. `CreateNotification.linkLabel` (awaiting button label or Skip)
7. Sub-process: `GIST_RMW` (`fetch_notifications()` -> mutate list -> `update_notifications()`)

### Invariants
- **I1.1**: Only `ADMIN_CHAT_ID` can trigger any state transition (`AdminOnlyMiddleware`).
- **I1.2**: Non-text Telegram messages (photos, stickers, empty whitespace) must not crash FSM handlers or corrupt `state.get_data()`.
- **I1.3**: Switching out of wizard via `/cancel`, `/start`, `/help`, or `/list` must leave FSM in a consistent state (`None` when leaving wizard).
- **I1.4**: Concurrent Gist operations (`/new` publish and `del:<id>` callback) must serialize so one write cannot clobber the other, and generated notification IDs must be unique even within the same second.

### Transition Table

| Current State | Event / Trigger | Guard | Next State | Side Effects |
|---|---|---|---|---|
| `ANY` | `Command("start" \| "help")` | Admin user | `IDLE` | `state.clear()`, send main menu |
| `ANY` | `Command("cancel")` / `"❌ Cancel"` | Admin user | `IDLE` | `state.clear()`, send main menu |
| `IDLE` | `Command("new")` / `"➕ New Notification"` | Admin user | `CreateNotification.title` | `state.clear()`, set `title` state |
| `CreateNotification.title` | Message | Non-empty text, not cancel | `CreateNotification.message` | Store `title` |
| `CreateNotification.message` | Message | Non-empty text, not cancel | `CreateNotification.type` | Store `message` |
| `CreateNotification.type` | Message | Contains `info\|success\|warning\|announcement` | `CreateNotification.link` | Store `type` |
| `CreateNotification.type` | Message | Invalid text | `CreateNotification.type` | Prompt valid type |
| `CreateNotification.link` | Message | `"⏭️ Skip"` or `"/skip"` | `IDLE` | `compile_and_publish()`, `state.clear()` |
| `CreateNotification.link` | Message | Non-empty URL text | `CreateNotification.linkLabel` | Store `link` |
| `CreateNotification.linkLabel` | Message | Text or skip | `IDLE` | `compile_and_publish()`, `state.clear()` |
| `IDLE` | `CallbackQuery("del:<id>")` | Admin user | `IDLE` | Serialized Gist RMW removing `<id>` |

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B1 (Crash on non-text / empty input)**: `bot.py:279, 294, 310, 342, 364` call `message.text.strip()` / `message.text.lower()` unconditionally; sending a photo, sticker, or document makes `message.text is None`, raising `AttributeError` and stranding the FSM in the active state. Whitespace-only strings also produce blank `title`/`message`.
- **B2 (Orphaned wizard state on `/list`)**: `bot.py:189-223` handles `/list` even while inside `CreateNotification.*` without clearing or warning, leaving inline delete UI active while the next text reply is still captured by `CreateNotification`.
- **B3 (Lost updates & ID collisions in Gist RMW)**: `bot.py:88-121, 226-249, 374-417` use synchronous `requests` without locking; overlapping `del:` callbacks or `/new` + `del:` interleave `fetch_notifications()` -> `update_notifications()`, dropping updates. `del:` also used `split(":")[1]` (`bot.py:227`), truncating IDs containing `:`, and `notice-{int(time.time())}` (`bot.py:384`) collides on same-second publications.

---

## SM-2: User Favorites, Auth Sync & Conflict Resolution (`hooks/use-favorites.tsx`, `app/api/favorites/route.ts`, `app/components/FavoritesSyncModal.tsx`)

### States
1. `UNLOADED`: Clerk `!isLoaded`, `isLoading = true`, `favorites = []`.
2. `GUEST_READY`: `isLoaded && (!isSignedIn || !userId)`, `isLoading = false`, `isSyncModalOpen = false`, `favorites` backed by `localStorage`.
3. `SYNCING_CLOUD`: `isLoaded && isSignedIn && userId`, `isLoading = true`, fetching `GET /api/favorites`.
4. `CLOUD_SYNCED`: `isLoaded && isSignedIn && userId`, `isLoading = false`, `isSyncModalOpen = false`, `favorites` synchronized with Clerk `publicMetadata.favorites`.
5. `CONFLICT_MODAL_OPEN`: `isSignedIn && isSyncModalOpen === true`, `unsyncedGuestItems.length > 0 && cloudFavorites.length > 0`, UI previews `deduplicateIds([...local, ...cloud])` awaiting user choice (`Merge`, `Keep Account`, or `Close`).
6. `SYNC_ERROR_FALLBACK`: `isSignedIn`, cloud `GET /api/favorites` failed; local favorites shown with `isLoading = false`.

### Invariants
- **I2.1**: `favorites` contains deduplicated IDs (by `normalizeWallpaperId`).
- **I2.2**: When `!isSignedIn || !userId`, `isSyncModalOpen` must be `false` and `pending*` snapshots cleared.
- **I2.3**: Optimistic client mutations (`toggleFavorite`, `clearAllFavorites`, `handleMergeFavorites`, initial auto-migration) must verify HTTP `res.ok` and only commit/retain cloud-synced state when the server persists it; failed mutations must roll back safely without clobbering concurrent toggles.
- **I2.4**: Concurrent `PATCH`/`POST` operations for the same `userId` must serialize on both client and server so Read-Modify-Write (`getUser` -> `updateUserMetadata`) cannot lose updates.
- **I2.5**: Stale in-flight `syncFavorites` responses from a prior `userId` or signed-in session must never overwrite state after sign-out or account switch.

### Transition Table

| Current State | Event | Guard | Next State | Side Effects |
|---|---|---|---|---|
| `UNLOADED` | Clerk `isLoaded=true` | `!isSignedIn \|\| !userId` | `GUEST_READY` | Load `localStorage`, close sync modal |
| `UNLOADED` | Clerk `isLoaded=true` | `isSignedIn && userId` | `SYNCING_CLOUD` | `GET /api/favorites` |
| `SYNCING_CLOUD` | `GET` succeeds | `unsyncedGuestItems.length === 0` | `CLOUD_SYNCED` | Align `favorites` + `localStorage` to `cloud` |
| `SYNCING_CLOUD` | `GET` succeeds | `cloud.length === 0 && unsynced.length > 0` | `CLOUD_SYNCED` | `POST` clean local to cloud; keep local on error |
| `SYNCING_CLOUD` | `GET` succeeds | `cloud.length > 0 && unsynced.length > 0` | `CONFLICT_MODAL_OPEN` | Store snapshots, open modal, show preview |
| `SYNCING_CLOUD` | `GET` fails | Active generation | `SYNC_ERROR_FALLBACK` | Fallback to `localFavorites` |
| `CONFLICT_MODAL_OPEN` | `onMerge` | `userId` present | `CLOUD_SYNCED` | Merge, `POST /api/favorites`, close modal |
| `CONFLICT_MODAL_OPEN` | `onKeepAccount` / `onClose` | `userId` present | `CLOUD_SYNCED` | Set to `pendingCloudFavorites`, close modal |
| `CONFLICT_MODAL_OPEN` | Sign out / `userId` change | — | `GUEST_READY` / `SYNCING_CLOUD` | Force-close modal, clear snapshots |
| `GUEST_READY` / `CLOUD_SYNCED` | `toggleFavorite(id)` | Valid `id` | Same state | Functional optimistic update + serialized `PATCH` if signed in |
| `ANY_READY` | `StorageEvent('favorites')` | Cross-tab change | Same state | Parse (or `[]` if `null`) & deduplicate |

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B4 (Silent HTTP failure desync)**: `hooks/use-favorites.tsx:132-136, 174-178, 217-224, 240-244` never checked `res.ok` on `POST`/`PATCH`. A 401/500 resolved normally without reverting, leaving `localStorage` and React UI diverged from Clerk metadata.
- **B5 (Concurrent `toggleFavorite` & `PATCH` lost updates + stale rollback)**: `hooks/use-favorites.tsx:203-232` closed over `favorites` at invocation time; rapid toggles overwrote each other, and a network failure on line `228` called `setFavorites(favorites)`, reverting to a stale pre-toggle snapshot and erasing concurrent toggles. Server-side `app/api/favorites/route.ts:108-128` ran unserialized `getUser()` -> `updateUserMetadata()`, losing concurrent additions/removals.
- **B6 (Stuck Sync Modal on sign-out & toggle loss during conflict)**: `hooks/use-favorites.tsx:96-103` never reset `isSyncModalOpen` on sign-out, and `handleMergeFavorites`/`handleKeepAccountFavorites` (`166-196`) overwrote `favorites` with frozen `pending*` arrays, discarding any toggles made while the modal was open.
- **B7 (`StorageEvent` `null` ignored)**: `hooks/use-favorites.tsx:72` checked `if (e.key === 'favorites' && e.newValue)`, ignoring `localStorage.removeItem('favorites')` (`e.newValue === null`).

---

## SM-3: Server Wallpaper & Color Index Cache (`lib/wallpapers.ts`, `app/api/colors/route.ts`, `app/api/wallpapers/*`)

### States
1. `COLD`: `cachedRawData === null`, `lastFetchedTime === 0`, `fetchPromise === null`.
2. `FETCHING`: `fetchPromise !== null` (single-flight upstream fetch in progress).
3. `WARM_FRESH`: `cachedRawData.length > 0 && (now - lastFetchedTime < CACHE_TTL)`.
4. `WARM_STALE`: `cachedRawData.length > 0 && (now - lastFetchedTime >= CACHE_TTL)`.

### Invariants
- **I3.1**: At most one upstream `fetch` is in flight at a time per module instance (`fetchPromise` / `colorsFetchPromise`).
- **I3.2**: Empty arrays `[]` from failed or empty upstream responses must never overwrite a valid non-empty cache or be cached as valid fresh data.
- **I3.3**: Public API routes (`/api/random-wallpapers`, `/api/wallpapers/search`, `/api/wallpapers`) must not attach long CDN cache headers (`s-maxage=3600`) to degraded empty `[]` responses caused by upstream failure, and must validate numeric query params (`count`, `limit`) against `NaN`.

### Transition Table

| Current State | Event | Guard | Next State | Side Effects |
|---|---|---|---|---|
| `COLD` | `fetchIndexJson()` | `fetchPromise === null` | `FETCHING` -> `WARM_FRESH` / `COLD` | Fetch GitHub `index.json`, call `processData()` if non-empty |
| `FETCHING` | Concurrent `fetchIndexJson()` | `fetchPromise !== null` | `FETCHING` | Await shared `fetchPromise` |
| `WARM_FRESH` | `fetchIndexJson()` | `now - lastFetchedTime < CACHE_TTL` | `WARM_FRESH` | Return `cachedRawData` |
| `WARM_STALE` | `fetchIndexJson()` | Upstream succeeds (non-empty) | `WARM_FRESH` | `processData()`, reset `lastFetchedTime` |
| `WARM_STALE` | `fetchIndexJson()` | Upstream fails | `WARM_STALE` | Return stale `cachedRawData` |

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B8 (Cold/Degraded empty responses edge-cached for 1 hour & `NaN` count)**: `app/api/random-wallpapers/route.ts:73, 122-123` and `app/api/wallpapers/search/route.ts:12-16` set `Cache-Control: public, s-maxage=3600` even when `fetchIndexJson()` returned `[]` on upstream outage. Also `app/api/wallpapers/route.ts:31`, `app/api/wallpapers/search/route.ts:10`, and `app/api/downloads/route.ts:65` produced `NaN` for non-numeric `count`/`limit` (e.g., `?count=abc`), returning `200 []` or binding `NaN` to SQL `LIMIT ?`.
- **B9 (`color` filter silently dropped in `/api/wallpapers`)**: `app/api/wallpapers/route.ts:92-99` restored `indexData` (filtered only by `category`, dropping `color`) when `type` matched 0 items, returning wallpapers that violated the caller's `color` filter.
- **B10 (`/api/colors` missing single-flight dedup & empty cache guard)**: `app/api/colors/route.ts:10-63` allowed concurrent cold requests to stampede `tags.json` and cached `[]` if `tagsData` yielded 0 colors.

---

## SM-4: Client Wallpaper Store & Parsed Cache (`lib/wallpaper-store.ts`)

### States
1. `UNINITIALIZED`: `rawDataCache === null`, `parsedWallpapersCache === null`.
2. `LOADING_RAW`: `rawDataPromise !== null` (checking `sessionStorage` -> `/api/wallpapers/index` -> GitHub Raw fallback).
3. `LOADING_PARSED`: `parsedPromise !== null`.
4. `READY`: `rawDataCache.length > 0 && parsedWallpapersCache.length > 0`.
5. `FAILED`: Upstream endpoints failed or returned empty; no valid cache available.

### Invariants
- **I4.1**: `rawDataCache`, `parsedWallpapersCache`, and `derivedColorsCache` must never hold empty arrays `[]`.
- **I4.2**: Concurrent calls to `getRawWallpaperIndex()` or `getParsedWallpapers()` share in-flight promises (`rawDataPromise`, `parsedPromise`).
- **I4.3**: When all index sources fail on cold start, `getParsedWallpapers()` must reject/throw (not silently cache & return `[]`) so `WallpaperGrid` enters `ERROR` state and Retry re-fetches cleanly.

### Transition Table

| Current State | Event | Guard | Next State | Side Effects |
|---|---|---|---|---|
| `UNINITIALIZED` | `getRawWallpaperIndex()` | Valid `sessionStorage` within TTL | `READY` (raw) | Populate `rawDataCache` |
| `UNINITIALIZED` | `getRawWallpaperIndex()` | Cache miss | `LOADING_RAW` | Fetch `/api/wallpapers/index`, fallback GitHub |
| `LOADING_RAW` | Network returns non-empty | `data.length > 0` | `READY` (raw) | Cache in memory + `sessionStorage` |
| `LOADING_RAW` | All sources fail / empty | `rawDataCache === null` | `FAILED` | Clear `rawDataPromise`, return `[]` or throw |
| `ANY` | `getParsedWallpapers()` | `parsedWallpapersCache?.length > 0` | `READY` | Return cached `{ wallpapers, availableColors }` |
| `ANY` | `getParsedWallpapers()` | Cache miss, `rawData.length > 0` | `READY` | Parse/sort once, cache non-empty result |
| `ANY` | `getParsedWallpapers()` | `rawData.length === 0` | `FAILED` | Throw error; do NOT populate `parsedWallpapersCache` |

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B11 (Permanent empty-cache poisoning breaking Retry)**: `lib/wallpaper-store.ts:141` caught errors and returned `[]`. `getParsedWallpapers()` (`164-223`) did not check `rawData.length === 0`, setting `parsedWallpapersCache = []` and `derivedColorsCache = []` (`220-221`). Because `[]` is truthy (`157`), **every future call including Retry** hit the cache and returned `[]` without fetching, permanently breaking recovery. `getParsedWallpapers()` also lacked in-flight promise deduplication.

---

## SM-5: Global Back-Button / History Interception Stack (`hooks/use-back-handler.ts`)

### States
1. `IDLE`: No active handlers (`activeHandlers.length === 0`), no `popstate` listener registered, `hasGuardEntry === false`.
2. `ARMED`: `activeHandlers.length > 0`, exactly ONE global `popstate` listener registered, `hasGuardEntry === true` (exactly ONE guard entry pushed).
3. `CLOSING_PROGRAMMATIC`: Removing the guard entry via `window.history.back()` after all handlers deactivate via UI close; ignores the resulting synthetic `popstate` (`pendingProgrammaticPop = true`).

### Invariants
- **I5.1**: At most ONE `popstate` listener is attached to `window` regardless of how many components mount `useBackHandler`.
- **I5.2**: Re-rendering an active component (with an inline `onBack` callback) must NEVER push additional `window.history.pushState` entries.
- **I5.3**: When `activeCount` drops from `>=1` to `0` via UI close (`X`/backdrop/`Escape`) rather than browser Back, the pushed guard history entry is reconciled so browser history does not accumulate dead entries.
- **I5.4**: Pressing browser Back while `ARMED` invokes only the highest-priority active handler; if handlers remain active afterward, the guard entry stays armed.

### Transition Table

| Current State | Event | Guard | Next State | Side Effects |
|---|---|---|---|---|
| `IDLE` | Handler activates (`isActive: true`) | `!hasGuardEntry` | `ARMED` | `pushState` once, attach single `popstate` listener |
| `ARMED` | Additional handler activates / re-renders | `hasGuardEntry` | `ARMED` | Update handler entry via ref (NO `pushState`) |
| `ARMED` | `popstate` event | `pendingProgrammaticPop === false` & active handler exists | `ARMED` or `IDLE` | Call top-priority `onBack()`; if handlers remain active, `pushState` guard; else clear guard |
| `ARMED` | All handlers deactivate via UI | `hasGuardEntry` & not inside `popstate` | `CLOSING_PROGRAMMATIC` -> `IDLE` | Detach or ignore next `popstate`, call `history.back()` to pop orphan guard |
| `CLOSING_PROGRAMMATIC` | Synthetic `popstate` | `pendingProgrammaticPop === true` | `IDLE` | Consume event (`pendingProgrammaticPop = false`) |

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B12 (History stack pollution & multi-listener leak)**: `hooks/use-back-handler.ts:74-90` included `onBack` in `useEffect` deps while callers (`WallpaperModal.tsx:149`, `SearchBar.tsx:120`, `SimilarWallpapers.tsx:79`) passed inline arrow functions. Every render re-ran `useEffect` and pushed another `window.history.pushState` entry (`line 76`). Each hook instance also registered its own `handlePopState` listener (`line 77`), and the 50ms `isHandlingPopState` lock (`lines 48-50, 74`) caused rapid re-arms to skip adding `popstate` listeners entirely while UI closes left orphan history entries.

---

## SM-6: Wallpaper Modal, Image Quality & Similar Tray (`app/components/WallpaperModal.tsx`, `app/components/SimilarWallpapers.tsx`)

### States
- **Modal Stack**: `CLOSED` -> `OPEN_ROOT` (`history=[]`) -> `OPEN_STACK` (`history.length > 0`), with orthogonal `showSimilarWallpapers: boolean`.
- **Image Lifecycle**: `PREVIEW_LOADING` -> `PREVIEW_LOADED` -> `HQ_LOADING` (`isHighQuality=true, isLoadingHighQuality=true`) -> `HQ_LOADED` | `IMAGE_ERROR`.
- **Similar Tray**: `HIDDEN` -> `LOADING` -> `LOADED` (`currentPage` paginated) | `EMPTY`.

### Invariants
- **I6.1**: Navigating to a new wallpaper (Next/Prev/Similar) resets `SmartImage` error state so one broken image never poisons subsequent wallpapers.
- **I6.2**: `isLoadingHighQuality` must always clear (`false`) on HQ load success, HQ load error, or when `download_url === preview_url` (or already loaded).
- **I6.3**: Background HQ preload `Image` callbacks and async `fetchSimilarWallpapers` / `handleShowMore` timers must ignore stale completions after wallpaper change or unmount.
- **I6.4**: `SimilarWallpapers` must clear `allSimilarWallpapers` when no match or error occurs, and must never invoke parent `setState` (`on404`) synchronously inside render.

### Transition Table

| Current State | Event | Guard | Next State | Side Effects |
|---|---|---|---|---|
| `CLOSED` | `isOpen=true` | — | `OPEN_ROOT` (`PREVIEW_LOADING`) | Reset view state, focus modal |
| `PREVIEW_LOADING` | Preview `onLoad` | — | `PREVIEW_LOADED` | Start background HQ preload (cancellable) |
| `PREVIEW_LOADED` | "Load HD" clicked | `download_url !== preview_url` | `HQ_LOADING` | Set `isHighQuality=true, isLoadingHighQuality=true` |
| `PREVIEW_LOADED` | "Load HD" clicked | `download_url === preview_url` | `HQ_LOADED` | Mark `isHighQuality=true`, `isLoadingHighQuality=false` |
| `HQ_LOADING` | HQ `onLoad` | — | `HQ_LOADED` | `isLoadingHighQuality=false`, notify |
| `HQ_LOADING` | HQ `onError` | — | `IMAGE_ERROR` (or fallback preview) | `isLoadingHighQuality=false`, `isHighQuality=false`, notify failure |
| `OPEN_*` | `onSelectWallpaper` | Valid item | `OPEN_STACK` | Push current onto `history`, reset image states |
| `OPEN_STACK` | Back | `history.length > 0` | `OPEN_STACK` / `OPEN_ROOT` | Pop `history` |
| `Similar:HIDDEN/OPEN` | `isVisible && sha` | — | `Similar:LOADING` | Request-ID guarded `getRawWallpaperIndex()` |
| `Similar:LOADING` | Lookup succeeds | Match found | `Similar:LOADED` | Store sorted `allSimilarWallpapers`, slice page 0 |
| `Similar:LOADING` | No match / error | Latest request ID | `Similar:EMPTY` | Clear both `allSimilarWallpapers` and `similarWallpapers` |

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B13 (Permanent `SmartImage` error lock)**: `WallpaperModal.tsx:32, 557` mounted `<SmartImage>` without a `key` or `src` reset effect. Once `error` became `true`, all subsequent Next/Prev wallpapers remained stuck showing `"Failed to load image"`.
- **B14 (Permanent `isLoadingHighQuality` spinner lock & stale preload)**: On `onError` (`WallpaperModal.tsx:582-584`), `isLoadingHighQuality` was never reset to `false`, trapping the modal in `"Loading high quality image..."` forever; same if `download_url === preview_url` (`src` unchanged -> `onLoad` never fires). Preload `useEffect` (`246-254`) also lacked cleanup for `img.onload`.
- **B15 (`SimilarWallpapers` stale data, async race, lookup mismatch, & setState-in-render)**: `SimilarWallpapers.tsx:134-143` stripped extensions from `wallpaper.name` (`replace(/\.\w+$/, '')`) when `file_name` retains extensions, failed to clear `allSimilarWallpapers` on miss, lacked a request-ID guard on `fetchSimilarWallpapers` (`127-188`), had uncleaned `setTimeout` in `handleShowMore` (`192`), and called `on404()` synchronously during render (`13-15`).

---

## SM-7: Wallpaper Grid Gallery, Pagination & Downloads (`app/components/WallpaperGrid.tsx`)

### States
- **Data Fetch**: `LOADING` -> `ERROR` | `READY` (client-filtered without re-fetching).
- **Pagination**: `HAS_MORE` (`displayedWallpapers.length < filtered.length`) -> `EXHAUSTED`.
- **Download**: `IDLE` -> `DOWNLOADING` (active counter `> 0`) -> `IDLE`.

### Invariants
- **I7.1**: Changing client-side filters (`filter`, `selectedCategories`) must filter already-loaded `wallpapersState` synchronously without triggering `fetchWallpapers()` / `setIsLoading(true)` unless `categoryFilter` prop changed or initial fetch failed.
- **I7.2**: Modal Next/Previous navigation must traverse `getFilteredWallpapers()` (respecting `favoriteIds`, `selectedCategories`, `colorFilter`, and `filter`).
- **I7.3**: `loadMoreWallpapers` must not append duplicate wallpapers if triggered repeatedly before commit.
- **I7.4**: `isDownloading` tracks active downloads accurately via `try/finally` (never clobbered by stale `setTimeout` from an earlier download), and single-item `handleDownload` calls `trackDownload`.

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B16 (Filter toggle triggers redundant `fetchWallpapers` race & full-grid spinner)**: `WallpaperGrid.tsx:269-313` put `filter`, `selectedCategories`, `colorFilter` into `fetchWallpapers` deps, re-triggering `setIsLoading(true)` on every filter click without request-ID cancellation.
- **B17 (Modal Next/Prev escapes active filter/favorites)**: `WallpaperGrid.tsx:529-563, 1205-1208` filtered only by `filter` (`all/desktop/mobile`), ignoring `selectedCategories`, `colorFilter`, and `favoriteIds`.
- **B18 (Download state/tracking bugs & truncated "Download All" favorites)**: `handleDownload` (`425-484`) omitted `trackDownload`, cleared `isDownloading` inside a 3s timer (race with overlapping downloads), and "Download All" favorites (`807-830`) only iterated `displayedWallpapers` (first 40) instead of all filtered favorites.

---

## SM-8: Search Console (`app/components/SearchBar.tsx`)

### States
`CLOSED` -> `OPEN_IDLE` -> `OPEN_SEARCHING` -> `OPEN_RESULTS` | `OPEN_EMPTY` (plus `LOADING_MORE` pagination).

### Invariants
- **I8.1**: Only the latest `performSearch` request ID may commit `results`, `totalResults`, and `isSearching = false`.
- **I8.2**: Clearing `searchQuery` to `""` cancels/invalidates any in-flight `performSearch` and resets `isSearching` and `results`.
- **I8.3**: Infinite-scroll timers clean up on search reset, close, or unmount, and `loadingMore` cannot be double-triggered across scroll + `IntersectionObserver`.

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B19 (Search async race & uncancelled timers)**: `SearchBar.tsx:130-219` lacked a request-ID guard; slow earlier searches or searches in flight when clearing `searchQuery` (`136-139`) overwrote current results. Infinite scroll (`289-347`) used uncleaned `setTimeout(..., 300)` across dual listeners.

---

## SM-9: Client Notification Center & Toast Lifecycle (`app/components/NotificationCenter.tsx`)

### States
- **Feed**: `LOADING` -> `LOADED` | `ERROR_EMPTY`.
- **Popover**: `CLOSED` <-> `OPEN`.
- **Toast**: `NONE` -> `PENDING_TIMER` -> `VISIBLE` -> `DISMISSED`.

### Invariants
- **I9.1**: Corrupted `localStorage` values for `STORAGE_KEY` or `DISMISSED_TOASTS_KEY` must safely fall back to `[]` without throwing.
- **I9.2**: All timers (1500ms toast delay, 1000ms auto-mark-read) are cancelled on unmount or when their precondition ends (e.g., closing popover immediately cancels auto-mark-read; marking all read cancels pending toast).

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B20 (Uncleaned timers, stale closures, & unguarded `JSON.parse`)**: `NotificationCenter.tsx:62, 109, 154` called `JSON.parse` without `try/catch`; line `85` ignored the cleanup function returned by `triggerToastCheck` (`116`); Bell `onClick` (`183-188`) scheduled an uncancellable 1000ms `markAllAsRead()` even if the popover was immediately closed; `markAsRead` (`136-141`) used non-functional state updates.

---

## SM-10: PWA Service Worker (`public/sw.js`)

### States
`INSTALLING` -> `INSTALLED` -> `ACTIVATING` -> `ACTIVE` (intercepting `navigate` via Network-First and static assets via Stale-While-Revalidate).

### Invariants
- **I10.1**: Every intercepted `event.respondWith(...)` must always resolve to a valid `Response` object, never `undefined`.

### Confirmed Invalid States / Transitions (Pre-Fix Evidence)
- **B21 (SW `respondWith(undefined)` on offline SWR cache miss)**: `public/sw.js:90-100` resolved `.catch(() => cachedResponse)` when offline and `cachedResponse` was `undefined`, passing `undefined` to `event.respondWith()` and throwing a `TypeError`.

---

## Prioritized Issue Summary & Resolution Status

| Issue | Priority | Bugs Covered | Fix Summary & Target Files | Regression Tests | Status |
|---|---|---|---|---|---|
| **Issue 1** | **P0** | B4, B5, B6, B7 | Extracted `lib/favorites-state.ts`; added per-user `createKeyedTaskQueue()` on server (`app/api/favorites/route.ts`) & client (`hooks/use-favorites.tsx`); checked `res.ok` on all mutations; added item-scoped rollback, auth generation guards, conflict modal reset on sign-out, and `StorageEvent` `null` handling. | `tests/favorites-state.test.ts` (4 tests) | **Fixed & Verified** |
| **Issue 2** | **P0** | B8, B9, B10, B11 | Stopped caching `[]` in `lib/wallpaper-store.ts` and rejected on cold fetch failure so Retry works; added `parsedPromise` single-flight dedup; added `colorsFetchPromise` dedup in `lib/colors.ts` + `app/api/colors/route.ts`; preserved `color` filter on empty `type` match in `app/api/wallpapers/route.ts`; rejected `NaN` `count`/`limit` (`400`) and avoided edge-caching `502` empty responses in `/api/random-wallpapers` & `/api/wallpapers/search`. | `tests/wallpaper-store-and-api.test.ts` (5 tests) | **Fixed & Verified** |
| **Issue 3** | **P1** | B12 | Extracted singleton `lib/back-handler-manager.ts` + ref-backed `hooks/use-back-handler.ts`; pushes at most 1 `__wallwidgyBackGuard` entry regardless of re-renders, maintains 1 global `popstate` listener, pops orphan guard on UI close only when top state is `__wallwidgyBackGuard`. | `tests/back-handler-manager.test.ts` (3 tests) | **Fixed & Verified** |
| **Issue 4** | **P1** | B13, B14, B15 | Reset `SmartImage` error state on `src` change + keyed by `sha`, cleared `isLoadingHighQuality` on error/same-URL, and cancelled stale preload `Image` in `WallpaperModal.tsx`. Added `createLatestRequestGuard()`, `findIndexItemForWallpaper()`, cleared `allSimilarWallpapers` on miss, moved `on404` out of render, and cleaned `handleShowMore` timers in `SimilarWallpapers.tsx`. | `tests/ui-state-helpers.test.ts` (covered via `findIndexItemForWallpaper` & `createLatestRequestGuard`) | **Fixed & Verified** |
| **Issue 5** | **P1** | B16, B17, B18 | Decoupled `fetchWallpapers` from client filter deps + added request guard, unified grid & modal Next/Prev via `filterWallpapersList()`, deduplicated pagination via `appendPaginationSlice()`, added `activeDownloadsRef` counter, `trackDownload` in `handleDownload`, and full favorites list download in `WallpaperGrid.tsx`. | `tests/ui-state-helpers.test.ts` (covered via `filterWallpapersList`, `appendPaginationSlice`, `createLatestRequestGuard`) | **Fixed & Verified** |
| **Issue 6** | **P2** | B19, B20 | Added `createLatestRequestGuard()` and unified infinite-scroll timer cleanup in `SearchBar.tsx`; added safe `parseStoredStringArray()`, `selectLatestUnreadToast()`, functional `readIds` updates, and unmount/close cleanup for toast & auto-read timers in `NotificationCenter.tsx`. | `tests/ui-state-helpers.test.ts` (covered via `createLatestRequestGuard`, `parseStoredStringArray`, `selectLatestUnreadToast`) | **Fixed & Verified** |
| **Issue 7** | **P2** | B1, B2, B3 | Guarded all `CreateNotification` handlers against `None`/blank text, cleared active wizard state on `/list`, parsed `del:` with `split(":", 1)`, generated millisecond+UUID notification IDs, and serialized Gist RMW under `asyncio.Lock` + `asyncio.to_thread` in `bot.py`. | `tests/test_bot.py` (4 tests) | **Fixed & Verified** |
| **Issue 8** | **P2** | B21 | Returned a `503 Response` instead of `undefined` when SWR asset fetch fails offline on a cache miss in `public/sw.js`. | `tests/sw.test.ts` (1 test) | **Fixed & Verified** |

---

## Verification Summary

- `npx tsc --noEmit`: Passed (0 errors)
- `node --import ./tests/tsconfig-loader.mjs --test tests/*.test.ts`: 18 passed, 0 failed across 5 suites (`back-handler-manager.test.ts`, `favorites-state.test.ts`, `sw.test.ts`, `ui-state-helpers.test.ts`, `wallpaper-store-and-api.test.ts`)
- `python -m unittest discover -s tests -p "test_*.py" -v`: 4 passed, 0 failed (`test_bot.py`, using lightweight module stubs where `aiogram`/`requests`/`dotenv` are not installed in the local Python environment)

