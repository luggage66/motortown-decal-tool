import type { DecalColor } from '../types'

interface ColorSwatchProps {
  color: DecalColor
  size?: number
  onClick?: () => void
}

export function ColorSwatch({ color, size = 32, onClick }: ColorSwatchProps) {
  const { r, g, b, a } = color

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        cursor: onClick ? 'pointer' : undefined,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid var(--border-subtle)',
        backgroundImage: `
          linear-gradient(45deg, #444 25%, transparent 25%),
          linear-gradient(-45deg, #444 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #444 75%),
          linear-gradient(-45deg, transparent 75%, #444 75%)
        `,
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(${r}, ${g}, ${b}, ${a / 255})`,
        }}
      />
    </div>
  )
}
