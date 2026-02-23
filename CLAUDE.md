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

### Single-file structure
| File | Purpose |
|------|---------|
| `app.js` | ~5700 lines — all business logic, rendering, state, auth |
| `index.html` | ~1340 lines — UI shell, sidebar, all modals |
| `style.css` | ~1910 lines — RTL Hebrew layout, dark mode, responsive |
| `firebase-config.js` | Firebase Firestore init + realtime listeners |
| `sw.js` | Service Worker PWA caching (cache name: `battalion-v9`) |
| `doc-logo.png` | Logo used in generated PDFs |

### State management
Single `state` object (soldiers, shifts, leaves, rotationGroups, equipment, signatureLog, weaponsData, personalEquipment). Always persist via:
```js
saveState(); // writes localStorage + debounced Firestore push
```
localStorage key: `battalionState_v2`. Settings key: `battalionSettings`.

### Companies
Six hardcoded units in `companyData`: `a`, `b`, `c`, `d`, `hq`, `palsam`. The constant `ALL_COMPANIES` lists all six. Company tasks are editable via Settings and synced to Firestore `battalion/tasks`.

### Permission system
Three levels controlled by `currentUser = { name, unit }` (stored in sessionStorage):
- **Admin** — `isAdmin()`: `currentUser.name === settings.adminName`
- **Gdudi** — `currentUser.unit === 'gdudi'`: battalion-level, sees everything
- **Company** — `currentUser.unit === 'a'|'b'|'c'|'d'|'hq'|'palsam'`: own unit only

`canEdit(compKey)` and `canView(compKey)` gate data operations. `applyUnitFilter()` runs on login to show/hide sidebar items.

### Tab navigation
`switchTab(tab)` → sets `.active` on tab content div + calls the matching `render*()` function. Company tabs call `renderCompanyTab(compKey)`. The active tab is `#tab-{name}`.

### PDF generation
`downloadPDF(htmlContent, filename)` uses `html2pdf.js` (CDN, loaded in index.html). Fully client-side — no server needed. Logo loaded at startup into `DOC_LOGO_BASE64` from `doc-logo.png`.

### Firebase Firestore
Three documents in collection `battalion`: `state`, `settings`, `tasks`. Realtime listeners in `firebase-config.js` call `renderAll()` on remote changes. Writes are debounced 800ms. Toggle with `FIREBASE_ENABLED` in `firebase-config.js`.

### Service Worker
When adding new cached assets, increment `CACHE_NAME` in `sw.js` (currently `battalion-v9`) — otherwise browsers serve stale files.

## Key Conventions

- All render functions named `render*()` — they read from `state` and rebuild DOM innerHTML
- New UI elements that need permission gating: add to `applyUnitFilter()` with `isGdudi || isAdmin()` pattern
- Empty states for admin-managed features should include an action button only when `canManage = currentUser.unit === 'gdudi' || isAdmin()`
- RTL direction is set at the document level; all CSS uses `right`/`left` accordingly
- `showToast(msg, type)` for user feedback (`type`: `'success'|'error'|'info'`)
- `openModal(id)` / `closeModal(id)` for all modals

## External Dependencies (CDN)
- Firebase SDK 10.12.0 (Firestore)
- html2pdf.js 0.10.2
- jsPDF 2.5.1 + autotable 3.8.2
- pdf.js 3.11.174
