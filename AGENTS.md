# AGENTS.md

## Project Structure

Two-part app: Python FastAPI backend (root) + React/TypeScript frontend (`roadmap-frontend/`).

- `main.py` — FastAPI server, room-based REST + WebSocket stub
- `RoadMap/` — Python 3.12 venv (do NOT modify, recreate with `python -m venv RoadMap`)
- `roadmap-frontend/` — Vite + React 19 + TypeScript + TailwindCSS v4
- `rooms/` — runtime data dir created by backend (gitignored)

## Commands

**Frontend** (run from `roadmap-frontend/`):
```
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (type-checks + builds)
npm run lint      # eslint . (flat config, TS + React)
```

No separate `typecheck` script — type checking happens inside `npm run build` via `tsc -b`.

**Backend** (run from repo root, activate venv first):
```
RoadMap\Scripts\activate
uvicorn main:app --reload
```

No `requirements.txt` exists — FastAPI and dependencies must be installed manually into the venv.

## Architecture Notes

- **State**: Zustand store at `src/core/store.ts` — all nodes, edges, tags, undo/redo
- **React Flow plugin system**: Node components in `src/plugins/nodes/`, property panels in `src/plugins/properties/`, registered in `src/registry.ts`
- **Node types**: `task`, `task-holder`, `note`, `reroute`, `custom-group` — add new types by creating the component + registering in `registry.ts`
- **Dropbox sync**: `src/core/dropboxSync.ts` — uses refresh token OAuth flow, tokens stored in `localStorage` (`dropbox_token`, `dropbox_client_id`, `dropbox_client_secret`, `dropbox_refresh_token`)
- **Edge styling**: driven by target node status (`todo`=red, `in-progress`=yellow dashed+animated, `done`=green) in `store.ts:getEdgeStyle`
- **Collapse/proxy pattern**: `task-holder` nodes use edge proxying (`data.realSource`/`data.realTarget`) to reroute edges when children are hidden
- **z-index layering**: custom-group=-5, task-holder=-1, task=10

## Gotchas

- TailwindCSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`, config is in `vite.config.ts`
- `index.css` uses `@import "tailwindcss"` (v4 syntax), not `@tailwind` directives
- `.react-flow__node-custom-group` has `pointer-events: none` globally — inner interactive elements need `pointer-events-auto` override (already in `index.css`)
- `tsconfig.app.json` has strict settings: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` — build will fail on unused code
- Comments and variable names throughout the codebase are in Vietnamese
- No test framework is configured — there are no tests
- Backend has no dependency management file — document any pip installs you add
