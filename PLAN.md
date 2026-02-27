# MotorTown Decal Editor — Implementation Plan

## Phase 0: Project Scaffolding

1. **Initialize the project with Vite + React + TypeScript**
   - `npm create vite@latest . -- --template react-ts`
   - Verify dev server runs

2. **Install dependencies**
   - `@adobe/react-spectrum` — UI component library
   - `react-colorful` — color picker (lightweight, zero-dep, good dark-theme support)
   - `file-saver` + `@types/file-saver` — download export
   - `zustand` — state management (cleaner than raw context for undo/redo + many interacting features)

3. **Configure project basics**
   - Update `.gitignore` for Vite/Node
   - Set up CSS modules (Vite supports this out of the box)
   - Wrap the app in React Spectrum `<Provider>` with `colorScheme="dark"` and `theme={darkTheme}`
   - Add base custom CSS variables for the game-tool aesthetic (`--bg-base: #1a1a2e`, `--bg-card: #2a2a3e`, etc.)

---

## Phase 1: Data Layer & State Management

4. **Define TypeScript types** (`src/types.ts`)
   - `DecalColor { r, g, b, a }` (all 0–255 integers)
   - `Position { x, y }` (floats)
   - `Rotation { pitch, yaw, roll }` (floats)
   - `DecalLayer { decalKey, color, position, rotation, decalScale, stretch, coverage, flags }`
   - `DecalFile { decal: { decalLayers: DecalLayer[] } }` (matches the JSON schema)

5. **Create the Zustand store** (`src/store.ts`)
   - State: `layers: DecalLayer[]`, `undoStack`, `redoStack`, `isDirty` (unsaved changes flag)
   - Actions:
     - `importLayers(layers)` — replaces all layers, resets undo/redo, clears dirty flag
     - `updateLayer(index, partial)` — update a single layer field
     - `addLayer()` — append new layer with defaults
     - `duplicateLayer(index)` — clone and insert after original
     - `deleteLayer(index)` — remove layer
     - `reorderLayers(fromIndex, toIndex)` — move layer in array
     - `bulkReplaceColor(oldColor, newColor)` — palette find-and-replace
     - `undo()` / `redo()`
   - Undo/redo: snapshot-based (store full `layers` array per state). Cap at 50 history entries.
   - Every mutating action pushes to undo stack and clears redo stack.

6. **JSON validation utility** (`src/utils/validation.ts`)
   - Validate imported JSON matches expected schema
   - Check `decal.decalLayers` exists and is an array
   - Check each layer has required fields with correct types
   - Enforce 200-layer cap
   - Return structured error messages for display

7. **Flag definitions constant** (`src/constants.ts`)
   - `FLAG_DEFINITIONS: Record<number, string>` for bits 0–7
   - Utility functions: `getFlagBit(flags, bit)`, `setFlagBit(flags, bit, value)`

---

## Phase 2: App Shell & Layout

8. **App shell** (`src/App.tsx`)
   - React Spectrum `<Provider>` wrapper with dark theme
   - Single-column layout matching the spec diagram
   - Sections: Header, ImportArea, Toolbar, ColorPalette, LayerList, ExportBar

9. **Header component** (`src/components/Header.tsx`)
   - App title, minimal branding

10. **Global CSS** (`src/App.module.css` or `src/index.css`)
    - Dark background (`#1a1a2e`), card surfaces (`#2a2a3e`)
    - Monospace font for numeric inputs
    - Compact spacing, game-tool aesthetic
    - Checkerboard pattern CSS for color swatch backgrounds

---

## Phase 3: Import / Export

11. **ImportArea component** (`src/components/ImportArea.tsx`)
    - React Spectrum `<TextArea>` for pasting JSON
    - "Import" `<Button>` triggers validation and load
    - Inline validation error display (React Spectrum inline validation or Toast)
    - If `isDirty`, show `<AlertDialog>` before replacing data

12. **ExportBar component** (`src/components/ExportBar.tsx`)
    - "Copy to Clipboard" button — `navigator.clipboard.writeText(json)`, show Toast "Copied!"
    - "Download JSON" button — use `file-saver` `saveAs()` with `decals.json` filename
    - Serialize from store: `{ decal: { decalLayers: layers } }` with `JSON.stringify(data, null, 2)`
    - Full floating-point precision preserved (JS default behavior, no rounding)

---

## Phase 4: Layer Cards

13. **LayerCard component** (`src/components/LayerCard.tsx`)
    - Card container with subtle border/shadow
    - Color swatch (rectangle with checkerboard behind it for alpha viz)
    - `decalKey` — React Spectrum `<ComboBox>` populated with unique keys from all layers
    - Position fields (x, y) — `<NumberField>` with step 0.1
    - Rotation fields (pitch, yaw, roll) — `<NumberField>` with step 0.1
    - `decalScale` — `<Slider>` (0–10, step 0.01) + `<NumberField>` synced together
    - `stretch` — `<Slider>` (0–10, step 0.01) + `<NumberField>` synced together
    - `coverage` — `<Slider>` (0–1, step 0.01) + `<NumberField>` synced together
    - `flags` — `<NumberField>` + 8 `<Checkbox>` toggles for bits 0–7, bidirectionally synced
    - Duplicate / Delete `<ActionButton>` per card

14. **LayerList component** (`src/components/LayerList.tsx`)
    - Renders list of `LayerCard` components from store
    - "Add Layer" button at bottom (or top)
    - Drag-and-drop reordering using React Spectrum's DnD utilities (`useDragAndDrop`)
    - Scrollable container

15. **ColorSwatch sub-component** (`src/components/ColorSwatch.tsx`)
    - Renders a rectangle filled with the RGBA color
    - CSS checkerboard background behind the color to visualize alpha
    - Clicking opens the color picker

---

## Phase 5: Color Picker

16. **ColorPicker component** (`src/components/ColorPicker.tsx`)
    - Wraps `react-colorful` (`<RgbaColorPicker>`)
    - HSL slider mode toggle (use `<HslaColorPicker>` variant or convert)
    - Hex input field (React Spectrum `<TextField>`)
    - RGBA numeric inputs (4x `<NumberField>`, 0–255)
    - Alpha/opacity slider
    - Styled to match dark theme
    - Used as a popover/dialog triggered from color swatches (both in cards and palette)

---

## Phase 6: Color Palette (Bulk Edit)

17. **ColorPalette component** (`src/components/ColorPalette.tsx`)
    - Collapsible section (React Spectrum `<Disclosure>`)
    - Extract unique RGBA colors from all layers (compare all 4 channels)
    - Display each as a swatch + count badge ("3 layers")
    - Clicking a swatch opens ColorPicker
    - On color change, dispatch `bulkReplaceColor(oldColor, newColor)` to store
    - Auto-updates as individual layers change

---

## Phase 7: Undo / Redo & Toolbar

18. **Toolbar component** (`src/components/Toolbar.tsx`)
    - Undo / Redo `<ActionButton>` with icons
    - Disabled state when stack is empty
    - Keyboard shortcuts: `Ctrl+Z` (undo), `Ctrl+Shift+Z` (redo)
    - Register global `keydown` listener in a `useEffect`

---

## Phase 8: Polish & Edge Cases

19. **Toast notifications**
    - React Spectrum `<ToastContainer>` at app root
    - Toasts for: "Copied to clipboard!", import errors, validation warnings

20. **Unsaved changes guard**
    - `isDirty` flag in store, set on any mutation, cleared on import
    - AlertDialog on import when dirty
    - Optionally: `beforeunload` browser event to warn on page close

21. **Responsive / scroll behavior**
    - Layer list should scroll independently if many layers
    - Ensure usable at reasonable viewport sizes (not mobile-optimized, but not broken)

22. **Final review**
    - Verify exported JSON round-trips correctly (import -> no edits -> export matches original)
    - Verify undo/redo covers all operations
    - Verify 200-layer cap enforcement
    - Verify floating-point precision is preserved

---

## File Structure

```
src/
  App.tsx                  # App shell, Provider, layout
  App.module.css           # Global custom styles
  main.tsx                 # Vite entry point
  types.ts                 # TypeScript interfaces
  store.ts                 # Zustand store (state + actions + undo/redo)
  constants.ts             # FLAG_DEFINITIONS, default layer values
  utils/
    validation.ts          # JSON import validation
    color.ts               # Color comparison, hex conversion helpers
  components/
    Header.tsx
    ImportArea.tsx
    Toolbar.tsx
    ColorPalette.tsx
    LayerList.tsx
    LayerCard.tsx
    LayerCard.module.css
    ColorSwatch.tsx
    ColorPicker.tsx
    ColorPicker.module.css
    ExportBar.tsx
```

## Suggested Build Order

The phases are designed to be built sequentially so each phase produces testable, working functionality:

- **Phase 0–1**: Foundation. After this, the store exists and can be tested in isolation.
- **Phase 2–3**: Can import JSON and export it back. Core loop works.
- **Phase 4**: Cards render and fields are editable. The app is functionally useful.
- **Phase 5–6**: Color editing becomes rich. Bulk edit adds power-user workflow.
- **Phase 7**: Undo/redo adds safety.
- **Phase 8**: Polish and edge cases.
