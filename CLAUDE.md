# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hebrew-language military unit management PWA (גדוד יהודה) for operational personnel scheduling. Deployed on GitHub Pages at `https://elchai.github.io/battalion-scheduler/`.

**No build system.** No package manager. No tests. Push to `master` → GitHub Pages deploys immediately.

## Running Locally

Open `index.html` directly in a browser, or serve with any static server:
```bash
python -m http.server 8080
# then open http://localhost:8080
```

The app is fully client-side. Firebase sync works from any origin.

## Architecture

### File structure
| File | Purpose |
|------|---------|
| `app.js` | ~5845 lines — all business logic, rendering, state, auth |
| `index.html` | ~1346 lines — UI shell, sidebar, all modals |
| `style.css` | ~1966 lines — RTL Hebrew layout, dark mode, responsive |
| `firebase-config.js` | Firebase Firestore init + realtime listeners |
| `sw.js` | Service Worker PWA caching (cache name: `battalion-v9`) |
| `doc-logo.png` | Logo used in generated PDFs |
| `manifest.json` | PWA manifest |

### State vs Settings
Two separate persistence roots:

**`state`** — operational data, key `battalionState_v2`:
```js
{ soldiers, shifts, leaves, rotationGroups, equipment, signatureLog, weaponsData, personalEquipment }
```
Always persist with `saveState()` (writes localStorage + debounced Firestore).

**`settings`** — configuration, key `battalionSettings`. Defined as `DEFAULT_SETTINGS` at top of `app.js`. Contains: `adminName`, `password`, `shiftPresets`, `rotationDaysIn/Out`, `sheetId`, `equipmentSets` (base set + role sets + saved signatures). Persist with `saveSettings()`.

### Companies
Six hardcoded units in `companyData`: `a`, `b`, `c`, `d`, `hq`, `palsam`. The constant `ALL_COMPANIES` lists all six. The `deptToCompany` map converts Hebrew department names (from Google Sheets) to company keys. Company tasks are editable via Settings and synced to Firestore `battalion/tasks`.

### Permission system
Three levels controlled by `currentUser = { name, unit }` (stored in sessionStorage):
- **Admin** — `isAdmin()`: `currentUser.name === settings.adminName`
- **Gdudi** — `currentUser.unit === 'gdudi'`: battalion-level, sees everything
- **Company** — `currentUser.unit === 'a'|'b'|'c'|'d'|'hq'|'palsam'`: own unit only

`canEdit(compKey)` and `canView(compKey)` gate data operations. `applyUnitFilter()` runs on login to show/hide sidebar items.

### Tab navigation
`switchTab(tab)` → sets `.active` on tab content div + calls the matching `render*()` function. Company tabs call `renderCompanyTab(compKey)`. The active tab is `#tab-{name}`.

### Google Sheets sync
`syncFromGoogleSheets(silent)` fetches CSV from a public Google Sheet (ID stored in `settings.sheetId`) to import soldiers. Each sheet tab maps to a company via `deptToCompany`. Soldiers imported from sheets have `fromSheets: true` and are cleared on version bump in `init()`.

### Pakal (personal equipment sets)
`settings.equipmentSets` defines a `baseSet` (items every soldier gets) and `roleSets` (additional items per role). `generatePersonalEquipment(soldierId)` creates a `personalEquipment` entry in `state`. Bulk generation, bulk signing with canvas signature, and PDF export are all supported. Sub-tabs managed by `switchEquipmentSubTab()`.

### Weapons management
`openWeaponsForm(soldierId)` opens a multi-step wizard modal. Form data collected by `collectWeaponsFormData()` and saved to `state.weaponsData`. Generates a signed PDF via `generateWeaponsPDF(soldierId)`. Canvas-based signature via `initWpSignatureCanvas()`.

### PDF generation
`downloadPDF(htmlContent, filename)` uses `html2pdf.js` (CDN). Logo loaded at startup into `DOC_LOGO_BASE64` from `doc-logo.png`. Fallback: `_downloadPdfPrintFallback()`.

### Firebase Firestore
Three documents in collection `battalion`: `state`, `settings`, `tasks`. Realtime listeners in `firebase-config.js` call `renderAll()` on remote changes. Writes are debounced 800ms. Toggle with `FIREBASE_ENABLED` in `firebase-config.js`.

### Service Worker
When adding new cached assets, increment `CACHE_NAME` in `sw.js` (currently `battalion-v9`) — otherwise browsers serve stale files.

## Key Conventions

- All render functions named `render*()` — they read from `state`/`settings` and rebuild DOM innerHTML
- `renderAll()` calls every active render function; called after Firebase remote updates
- New UI elements that need permission gating: add to `applyUnitFilter()` with `isGdudi || isAdmin()` pattern
- Empty states for admin-managed features: include action button only when `canManage = currentUser.unit === 'gdudi' || isAdmin()`
- RTL direction is set at the document level; all CSS uses `right`/`left` accordingly
- `showToast(msg, type)` for user feedback (`type`: `'success'|'error'|'info'`)
- `openModal(id)` / `closeModal(id)` for all modals
- Global search entry point: `onGlobalSearch(query)` → `selectSearchResult(company, soldierId)`

## External Dependencies (CDN)
- Firebase SDK 10.12.0 (Firestore)
- html2pdf.js 0.10.2
- jsPDF 2.5.1 + autotable 3.8.2
- pdf.js 3.11.174
