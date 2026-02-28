# MotorTown Decal Editor — Specification

## 1. Overview

A single-page React web application that allows MotorTown players to import a JSON decal configuration file, visually edit decal layers using a card-based editor, and export the modified JSON. The app runs entirely client-side with no backend.

---

## 2. Tech Stack

- **Framework:** React (SPA)
- **Component library:** Adobe React Spectrum (`@adobe/react-spectrum`) — use for all standard UI components including buttons, inputs, sliders, dropdowns (ComboBox/Picker), drag-and-drop, dialogs, tooltips, etc.
- **Styling:** Dark theme (React Spectrum's `darkest` or `dark` color scheme) with additional custom styling for the game-tool aesthetic. Use CSS modules or Spectrum's styling system for custom elements.
- **State management:** React state or Zustand — implementer's choice based on complexity.
- **No backend.** All data stays in the browser.

---

## 3. Data Model

### 3.1 JSON Schema

The app imports and exports JSON with this structure:

```json
{
  "decal": {
    "decalLayers": [
      {
        "decalKey": "string",
        "color": { "r": 0-255, "g": 0-255, "b": 0-255, "a": 0-255 },
        "position": { "x": "float", "y": "float" },
        "rotation": { "pitch": "float", "yaw": "float", "roll": "float" },
        "decalScale": "float",
        "stretch": "float",
        "coverage": "float",
        "flags": "integer"
      }
    ]
  }
}
```

### 3.2 Field Definitions & Constraints

| Field            | Type        | Input Widget                                                 | Notes                                                         |
| ---------------- | ----------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `decalKey`       | string      | React Spectrum ComboBox (searchable)                         | Options populated from unique keys found in the imported JSON |
| `color`          | RGBA object | Rich color picker (HSL/RGB sliders, hex input, alpha slider) | Each channel 0–255                                            |
| `position.x`     | float       | React Spectrum NumberField                                   | Unbounded, step 0.1                                           |
| `position.y`     | float       | React Spectrum NumberField                                   | Unbounded, step 0.1                                           |
| `rotation.pitch` | float       | React Spectrum NumberField                                   | Unbounded, step 0.1                                           |
| `rotation.yaw`   | float       | React Spectrum NumberField                                   | Unbounded, step 0.1                                           |
| `rotation.roll`  | float       | React Spectrum NumberField                                   | Unbounded, step 0.1                                           |
| `decalScale`     | float       | React Spectrum Slider + NumberField                          | Range: 0.0–10.0, step 0.01                                    |
| `stretch`        | float       | React Spectrum Slider + NumberField                          | Range: 0.0–10.0, step 0.01                                    |
| `coverage`       | float       | React Spectrum Slider + NumberField                          | Range: 0.0–1.0, step 0.01                                     |
| `flags`          | integer     | NumberField + toggle checkboxes for individual bits          | See §6                                                        |

### 3.3 Layer Cap

Maximum **200 layers** per file. Reject imports exceeding this with a user-friendly error message.

---

## 4. Layout & UI Structure

Dark theme throughout. General layout (single column, top to bottom):

```
┌──────────────────────────────────┐
│  Header / App Title              │
├──────────────────────────────────┤
│  Import Area (paste JSON)        │
├──────────────────────────────────┤
│  Undo / Redo Toolbar             │
├──────────────────────────────────┤
│  Color Palette (collapsible)     │
├──────────────────────────────────┤
│  Decal Layer Cards (scrollable)  │
│    - Card 1                      │
│    - Card 2                      │
│    - ...                         │
├──────────────────────────────────┤
│  Export Bar (copy + download)    │
└──────────────────────────────────┘
```

---

## 5. Features

### 5.1 Import

- **Method:** Paste JSON into a React Spectrum TextArea, then click an "Import" button.
- **Validation:** Validate the JSON structure on import. Show clear error messages (React Spectrum inline validation or Toast) for malformed JSON or missing required fields.
- **Unsaved changes guard:** If the editor already has data with unsaved edits, show a React Spectrum AlertDialog before replacing it with new imported data.

### 5.2 Decal Layer Cards

Each decal layer is rendered as a **card** containing:

- **Color swatch:** A rectangle filled with the layer's RGBA color, displayed prominently on the card.
- **decalKey:** Shown as a label; editable via a React Spectrum ComboBox (searchable). The dropdown options are populated dynamically from all unique `decalKey` values found in the currently imported JSON.
- **All editable fields** laid out within the card per the input widgets defined in §3.2.
- **Card actions:** Duplicate, Delete buttons (React Spectrum ActionButtons) on each card.

### 5.3 Layer Operations

- **Reorder:** Drag-and-drop to rearrange layer order using React Spectrum's `useDragAndDrop` / DnD utilities.
- **Add:** Button to add a new layer with sensible defaults (white color, zero position/rotation, scale 1, stretch 1, coverage 1, flags 0, first available decalKey).
- **Duplicate:** Clone an existing layer (appended directly after the original).
- **Delete:** Remove a layer.

### 5.4 Color Palette (Bulk Edit)

- **Location:** Collapsible section (React Spectrum Disclosure or custom collapsible) above the layer card list.
- **Behavior:**
  1. Extract all unique RGBA colors from the current set of layers.
  2. Display each unique color as a swatch.
  3. Next to each swatch, show a count of how many layers use that color.
  4. Clicking a swatch opens the rich color picker.
  5. Changing the color applies the new color to **all layers** that had the original color (find-and-replace behavior).
  6. The palette auto-updates as layers are edited individually.

### 5.5 Color Picker

- Rich color picker component with:
  - HSL and RGB slider modes
  - Hex color input field
  - Alpha/opacity slider
  - RGBA numeric inputs (0–255 per channel)
- Used both on individual layer cards and in the palette section.
- Note: React Spectrum does not include a full color picker widget. Use `react-colorful` or `@uiw/react-color` for the picker, styled to match the dark theme. Wrap numeric inputs in React Spectrum NumberFields.

### 5.6 Export

- **Copy to clipboard:** Button that copies the full JSON (formatted/pretty-printed) to the clipboard. Show a brief React Spectrum Toast confirmation ("Copied!").
- **Download as .json:** Button that triggers a file download of the JSON. Default filename: `decals.json`.
- The exported JSON must exactly match the original schema structure (`{ "decal": { "decalLayers": [...] } }`).
- Preserve full floating-point precision on all numeric values (do not round).

### 5.7 Undo / Redo

- Maintain a full undo/redo history stack of editor states.
- **Undo:** Reverts the most recent change (field edit, reorder, add, delete, duplicate, bulk color change).
- **Redo:** Re-applies a reverted change.
- Expose as Undo/Redo buttons in a toolbar (React Spectrum ActionButtons with icons) and support keyboard shortcuts (`Ctrl+Z` / `Ctrl+Shift+Z`).
- Importing new JSON resets the undo history.
- Keep a reasonable history cap (e.g. 50 states) to limit memory usage.

### 5.8 Unsaved Changes Tracking

- Track whether the user has made edits since the last import.
- If the user attempts to import new JSON while unsaved edits exist, show a React Spectrum AlertDialog: "You have unsaved changes. Import new data and lose changes?"

---

## 6. Flags Field (Placeholder System)

The integer `flags` value is a bitmask, but the meaning of individual bits is not yet known.

- Display the raw integer in a React Spectrum NumberField.
- Below the number input, display **8 toggle checkboxes** (React Spectrum Checkboxes, representing bits 0–7), labeled as placeholders:
  - `Bit 0: Flag 0 (unknown)`
  - `Bit 1: Flag 1 (unknown)`
  - ... through Bit 7
- Toggling a checkbox updates the integer value accordingly (bitwise operations).
- Editing the integer input updates the checkbox states accordingly.
- **Design for future extensibility:** The flag labels should be defined in a single config constant so they can be easily updated when the flag meanings are discovered:

```typescript
const FLAG_DEFINITIONS: Record<number, string> = {
  0: "Unknown flag 0",
  1: "Unknown flag 1",
  2: "Unknown flag 2",
  // ... future: 1: "Show on both sides", 2: "Appears on wheel", etc.
};
```

---

## 7. Visual Design

- **Theme:** React Spectrum `dark` or `darkest` color scheme as the base. Custom CSS overrides for the game-tool aesthetic (darker backgrounds ~`#1a1a2e`, card surfaces ~`#2a2a3e`, bright accent for interactive elements).
- **Aesthetic:** Game-tool feel — compact, information-dense, functional. Think modding tool / dev console style.
- **Typography:** Monospace or semi-monospace for numeric values; clean sans-serif (Spectrum default) for labels.
- **Color swatches:** Render with a checkerboard pattern behind them to visualize alpha transparency.
- **Cards:** Subtle border or shadow to separate layers. Compact layout to maximize visible layers.

---

## 8. Non-Goals (Out of Scope)

- No 3D car preview or projection visualization.
- No user accounts or persistence (no local storage save — purely import/edit/export).
- No backend or API calls.
- No image rendering of actual decal shapes (color swatches only).

---

## 9. Libraries

- **`@adobe/react-spectrum`** — Primary component library (buttons, inputs, sliders, combobox, dialogs, toasts, checkboxes, drag-and-drop)
- **`react-colorful` or `@uiw/react-color`** — Color picker (React Spectrum lacks one)
- **`file-saver`** — Download export
