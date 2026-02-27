# Skill: Extract Inline CSS to CSS Modules

## When to use

Apply this skill when a React component in `src/components/` has inline `style={}` props that should be moved to a CSS module file.

## Conventions

This project uses **CSS Modules** with the naming pattern `ComponentName.module.css`. Existing examples:

- `LayerCard.module.css`
- `ColorPicker.module.css`
- `ColorPalette.module.css`

Class names use **camelCase** (e.g., `.headerRow`, `.sliderGroup`).

CSS custom properties from `src/index.css` are used for theming (e.g., `var(--text-secondary)`, `var(--bg-card)`, `var(--border-subtle)`, `var(--accent)`).

## Step-by-step process

### 1. Audit the component

Read the `.tsx` file. Identify every `style={}` prop. Categorize each one:

| Category | Example | Strategy |
|---|---|---|
| **Static styles** | `display: 'flex', gap: 8` | Move directly to CSS class |
| **Conditional styles** (boolean toggle) | `outline: dragOverIndex === i ? '2px solid ...' : undefined` | Use a **data attribute** on the element and a CSS **attribute selector** |
| **Dynamic values from props/state** | `width: size`, `backgroundColor: rgba(...)` | Use a **CSS custom property** set via `style={}`, with remaining static styles in the class |

### 2. Create or update the CSS module file

Create `src/components/ComponentName.module.css` if it doesn't exist. If it already exists, append to it.

### 3. Extract static styles

Before:
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
```

After — CSS:
```css
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

After — TSX:
```tsx
import styles from './ComponentName.module.css'
// ...
<div className={styles.list}>
```

**Remember:** React inline styles use camelCase and unitless numbers. CSS uses kebab-case and explicit units (`8` becomes `8px`, `flexDirection` becomes `flex-direction`).

### 4. Handle conditional styles with data attributes

When a style is toggled by a JS condition (like drag-over, selected, active states), use a `data-*` attribute instead of computing the style inline.

Before:
```tsx
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
// ...
<div style={{
  display: 'flex',
  alignItems: 'stretch',
  outline: dragOverIndex === i ? '2px solid var(--accent)' : undefined,
  outlineOffset: dragOverIndex === i ? -2 : undefined,
  borderRadius: 6,
}}>
```

After — TSX:
```tsx
<div
  className={styles.layerWrapper}
  data-drag-over={dragOverIndex === i || undefined}
>
```

After — CSS:
```css
.layerWrapper {
  display: flex;
  align-items: stretch;
  border-radius: 6px;
}

.layerWrapper[data-drag-over] {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
```

**Key detail:** Pass `|| undefined` so the attribute is omitted entirely when falsy (React removes attributes that are `undefined`). The CSS selector `[data-drag-over]` matches when the attribute is present, regardless of value.

### 5. Handle dynamic values with CSS custom properties

When a value truly depends on a JS variable (prop, computed value), set it as a CSS custom property via a minimal inline `style`, and reference it in the CSS class.

Before:
```tsx
<div style={{
  width: size,
  height: size,
  borderRadius: 4,
  cursor: onClick ? 'pointer' : undefined,
  position: 'relative',
  overflow: 'hidden',
}}>
```

After — TSX:
```tsx
<div
  className={styles.swatch}
  style={{ '--swatch-size': `${size}px` } as React.CSSProperties}
  data-clickable={onClick ? '' : undefined}
>
```

After — CSS:
```css
.swatch {
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.swatch[data-clickable] {
  cursor: pointer;
}
```

### 6. Clean up the TSX

- Add `import styles from './ComponentName.module.css'` at the top.
- Remove all `style={}` props that have been fully extracted.
- For elements that still need a dynamic CSS custom property, keep only the minimal `style={{ '--var-name': value }}`.
- Remove any now-unused imports (e.g., if `useState` was only used for a style toggle that is now handled differently).

## Checklist before finishing

- [ ] No static CSS values remain in `style={}` props
- [ ] Boolean conditions use `data-*` attributes + CSS attribute selectors
- [ ] Dynamic values use CSS custom properties with minimal inline `style`
- [ ] CSS file uses kebab-case properties and explicit units
- [ ] Class names are camelCase in the `.module.css` file
- [ ] The component renders identically before and after
