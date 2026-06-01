# AGENTS.md

## Project

Single-part Vite + React 19 + TypeScript 6.0 app in `roadmap-frontend/`. The app is a visual roadmap editor using React Flow.

The Python backend (`main.py`) was removed. There is no backend.

## Commands (run from `roadmap-frontend/`)

```
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (type-checks + builds)
npm run lint      # eslint . (flat config, TS + React)
npm run preview   # Vite preview of built artifacts
```

No separate `typecheck` — `tsc -b` runs inside `npm run build`.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` — pushed to `main`, Node 20, `npm ci`, builds, deploys `roadmap-frontend/dist`. Vite `base: '/RRoadMap/'` — asset paths are prefixed accordingly.

## Architecture

- **State**: Zustand store at `src/core/store.ts` — nodes, edges, tags, undo/redo
- **React Flow plugin system**: node components in `src/plugins/nodes/`, property panels in `src/plugins/properties/`, registered in `src/registry.ts`
- **Node types**: `task`, `task-holder`, `note`, `reroute`, `custom-group` — add by creating component + registering in `registry.ts`
- **Property panels**: only `task` and `task-holder` have panels registered
- **Edge styling**: driven by target node status (`todo`=red, `in-progress`=yellow dashed+animated, `done`=green) in `store.ts:getEdgeStyle`
- **Collapse/proxy pattern**: `task-holder` nodes use edge proxying (`data.realSource`/`data.realTarget`) to reroute edges when children hidden
- **z-index layering**: custom-group=-5, task-holder=-1, task=10
- **Dropbox sync**: `src/core/dropboxSync.ts` — refresh token OAuth flow, tokens in `localStorage` (`dropbox_token`, `dropbox_client_id`, `dropbox_client_secret`, `dropbox_refresh_token`)
- **View modes**: `board` (React Flow graph) and `calendar` (react-big-calendar) — toggle via `store.ts:viewMode`

## Gotchas

- TailwindCSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`, config in `vite.config.ts`
- `index.css` uses `@import "tailwindcss"` (v4 syntax), not `@tailwind` directives
- `.react-flow__node-custom-group` has `pointer-events: none` globally — inner interactive elements need `pointer-events-auto` override (already in `index.css`)
- `tsconfig.app.json` strict settings: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` — build fails on unused code; `verbatimModuleSyntax` requires `type` prefix on type-only imports
- Comments and variable names throughout are in Vietnamese
- No test framework configured
