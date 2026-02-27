# CLAUDE.md

## Project

MotorTown Decal Tool — a client-side React SPA for importing, editing, and exporting MotorTown game decal JSON files. Deployed to GitHub Pages.

## Tech Stack

- React 19, TypeScript, Vite
- Adobe React Spectrum (dark theme)
- Zustand for state management
- CSS Modules for component styling

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview production build

## Project Structure

- `src/components/` — React components (LayerCard, ColorPicker, UploadScreen, etc.)
- `src/utils/` — color conversion and JSON validation utilities
- `src/store.ts` — Zustand store with undo/redo
- `src/types.ts` — TypeScript interfaces
- `src/constants.ts` — flag definitions, defaults, limits

## Key Patterns

- CSS Modules (`.module.css`) for scoped styles; global variables in `index.css`
- Slider inputs use local state (commit on blur/drag-end) to avoid store thrashing
- Colors stored as RGBA 0-255; converted for react-colorful via `src/utils/color.ts`
- Undo/redo via immutable snapshot stacks in Zustand (max 50)
- No backend — all logic runs client-side
