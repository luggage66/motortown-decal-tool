import { useState } from 'react'
import { RgbaColorPicker, HslaColorPicker } from 'react-colorful'
import type { RgbaColor, HslaColor } from 'react-colorful'
import { NumberField, TextField } from '@adobe/react-spectrum'
import type { DecalColor } from '../types'
import {
  toPickerRgba, fromPickerRgba,
  toPickerHsla, fromPickerHsla,
  rgbaToHex, hexToRgba,
} from '../utils/color'
import styles from './ColorPicker.module.css'

interface ColorPickerProps {
  color: DecalColor
  onChange: (color: DecalColor) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [mode, setMode] = useState<'rgb' | 'hsl'>('rgb')
  const [hexInput, setHexInput] = useState(rgbaToHex(color))

  const handleRgbaChange = (c: RgbaColor) => {
    const dc = fromPickerRgba(c)
    setHexInput(rgbaToHex(dc))
    onChange(dc)
  }

  const handleHslaChange = (c: HslaColor) => {
    const dc = fromPickerHsla(c)
    setHexInput(rgbaToHex(dc))
    onChange(dc)
  }

  const commitHex = () => {
    const parsed = hexToRgba(hexInput)
    if (parsed) {
      setHexInput(rgbaToHex(parsed))
      onChange(parsed)
    } else {
      setHexInput(rgbaToHex(color))
    }
  }

  const handleChannel = (ch: keyof DecalColor, v: number) => {
    if (Number.isNaN(v)) return
    const updated = { ...color, [ch]: Math.round(Math.min(255, Math.max(0, v))) }
    setHexInput(rgbaToHex(updated))
    onChange(updated)
  }

  return (
    <div className={styles.picker}>
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'rgb' ? styles.active : ''}`}
          onClick={() => setMode('rgb')}
        >RGB</button>
        <button
          className={`${styles.modeBtn} ${mode === 'hsl' ? styles.active : ''}`}
          onClick={() => setMode('hsl')}
        >HSL</button>
      </div>

      <div className={styles.pickerArea}>
        {mode === 'rgb' ? (
          <RgbaColorPicker color={toPickerRgba(color)} onChange={handleRgbaChange} />
        ) : (
          <HslaColorPicker color={toPickerHsla(color)} onChange={handleHslaChange} />
        )}
      </div>

      <TextField
        label="Hex"
        labelPosition="side"
        value={hexInput}
        onChange={setHexInput}
        onBlur={commitHex}
        onKeyDown={(e) => { if (e.key === 'Enter') commitHex() }}
        width="100%"
      />

      <div className={styles.channels}>
        <NumberField
          label="R" labelPosition="side" value={color.r}
          minValue={0} maxValue={255} step={1}
          onChange={(v) => handleChannel('r', v)}
          width="size-900"
        />
        <NumberField
          label="G" labelPosition="side" value={color.g}
          minValue={0} maxValue={255} step={1}
          onChange={(v) => handleChannel('g', v)}
          width="size-900"
        />
        <NumberField
          label="B" labelPosition="side" value={color.b}
          minValue={0} maxValue={255} step={1}
          onChange={(v) => handleChannel('b', v)}
          width="size-900"
        />
        <NumberField
          label="A" labelPosition="side" value={color.a}
          minValue={0} maxValue={255} step={1}
          onChange={(v) => handleChannel('a', v)}
          width="size-900"
        />
      </div>
    </div>
  )
}

interface ColorPickerTriggerProps {
  color: DecalColor
  onChange: (color: DecalColor) => void
  children: React.ReactNode
}

/** Wraps a trigger element (e.g. ColorSwatch) to open a ColorPicker popover on click. */
export function ColorPickerTrigger({ color, onChange, children }: ColorPickerTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        {children}
      </div>
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.popover}>
            <ColorPicker color={color} onChange={onChange} />
          </div>
        </>
      )}
    </div>
  )
}
