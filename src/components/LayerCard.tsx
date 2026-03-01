import { useState, useEffect, memo } from "react";
import {
  NumberField,
  Slider,
  ComboBox,
  ComboBoxItem,
  Checkbox,
  ActionButton,
} from "@react-spectrum/s2";
import { useDecalStore } from "../store";
import { ColorSwatch } from "./ColorSwatch";
import { ColorPickerTrigger } from "./ColorPicker";
import { FLAG_DEFINITIONS, getFlagBit, setFlagBit } from "../constants";
import type { DecalLayer } from "../types";
import styles from "./LayerCard.module.css";

interface LayerCardProps {
  index: number;
  uniqueKeys: string[];
}

/** Hook to manage local slider state that syncs with the store on drag end. */
function useSliderState(storeValue: number) {
  const [local, setLocal] = useState(storeValue);
  useEffect(() => setLocal(storeValue), [storeValue]);
  return [local, setLocal] as const;
}

export const LayerCard = memo(function LayerCard({
  index,
  uniqueKeys,
}: LayerCardProps) {
  const layer = useDecalStore((s) => s.layers[index]);
  const { updateLayer, duplicateLayer, deleteLayer } = useDecalStore(
    (s) => s.actions,
  );

  // Local state for ComboBox (commit on blur / selection, not every keystroke)
  const [localKey, setLocalKey] = useState(layer?.decalKey ?? "");
  useEffect(() => {
    if (layer) setLocalKey(layer.decalKey);
  }, [layer?.decalKey]);

  // Local state for sliders (commit on drag end, not every tick)
  const [localScale, setLocalScale] = useSliderState(layer?.decalScale ?? 1);
  const [localStretch, setLocalStretch] = useSliderState(layer?.stretch ?? 1);
  const [localCoverage, setLocalCoverage] = useSliderState(
    layer?.coverage ?? 1,
  );

  if (!layer) return null;

  const update = (partial: Partial<DecalLayer>) => updateLayer(index, partial);
  const guard = (v: number, fn: (v: number) => void) => {
    if (!Number.isNaN(v)) fn(v);
  };

  return (
    <div className={styles.card}>
      {/* Header: swatch, decalKey, layer number, actions */}
      <div className={styles.headerRow}>
        <ColorPickerTrigger
          color={layer.color}
          onChange={(c) => update({ color: c })}
        >
          <ColorSwatch color={layer.color} />
        </ColorPickerTrigger>
        <ComboBox
          label="Decal Key"
          labelPosition="side"
          inputValue={localKey}
          onInputChange={setLocalKey}
          onSelectionChange={(key) => {
            if (key !== null) {
              const val = String(key);
              setLocalKey(val);
              update({ decalKey: val });
            }
          }}
          onFocusChange={(focused) => {
            if (!focused && localKey !== layer.decalKey) {
              update({ decalKey: localKey });
            }
          }}
          allowsCustomValue
        >
          {uniqueKeys.map((k) => (
            <ComboBoxItem key={k}>{k}</ComboBoxItem>
          ))}
        </ComboBox>
        <span className={styles.layerIndex}>#{index + 1}</span>
        <ActionButton onPress={() => duplicateLayer(index)}>Dup</ActionButton>
        <ActionButton onPress={() => deleteLayer(index)}>Del</ActionButton>
      </div>

      {/* Position and Rotation */}
      <div className={styles.fieldRow}>
        <NumberField
          label="X"
          labelPosition="side"
          value={layer.position.x}
          step={0.1}
          onChange={(v) =>
            guard(v, (v) => update({ position: { ...layer.position, x: v } }))
          }
        />
        <NumberField
          label="Y"
          labelPosition="side"
          value={layer.position.y}
          step={0.1}
          onChange={(v) =>
            guard(v, (v) => update({ position: { ...layer.position, y: v } }))
          }
        />
        <NumberField
          label="Pitch"
          labelPosition="side"
          value={layer.rotation.pitch}
          step={0.1}
          onChange={(v) =>
            guard(v, (v) =>
              update({ rotation: { ...layer.rotation, pitch: v } }),
            )
          }
        />
        <NumberField
          label="Yaw"
          labelPosition="side"
          value={layer.rotation.yaw}
          step={0.1}
          onChange={(v) =>
            guard(v, (v) => update({ rotation: { ...layer.rotation, yaw: v } }))
          }
        />
        <NumberField
          label="Roll"
          labelPosition="side"
          value={layer.rotation.roll}
          step={0.1}
          onChange={(v) =>
            guard(v, (v) =>
              update({ rotation: { ...layer.rotation, roll: v } }),
            )
          }
        />
      </div>

      {/* Sliders: Scale, Stretch, Coverage */}
      <div className={styles.sliderRow}>
        <div className={styles.sliderGroup}>
          <Slider
            label="Scale"
            value={localScale}
            minValue={0}
            maxValue={10}
            step={0.01}
            onChange={setLocalScale}
            onChangeEnd={(v) => update({ decalScale: v })}
          />
          <NumberField
            aria-label="Scale value"
            value={localScale}
            minValue={0}
            maxValue={10}
            step={0.01}
            onChange={(v) =>
              guard(v, (v) => {
                setLocalScale(v);
                update({ decalScale: v });
              })
            }
          />
        </div>
        <div className={styles.sliderGroup}>
          <Slider
            label="Stretch"
            value={localStretch}
            minValue={0}
            maxValue={10}
            step={0.01}
            onChange={setLocalStretch}
            onChangeEnd={(v) => update({ stretch: v })}
          />
          <NumberField
            aria-label="Stretch value"
            value={localStretch}
            minValue={0}
            maxValue={10}
            step={0.01}
            onChange={(v) =>
              guard(v, (v) => {
                setLocalStretch(v);
                update({ stretch: v });
              })
            }
          />
        </div>
        <div className={styles.sliderGroup}>
          <Slider
            label="Coverage"
            value={localCoverage}
            minValue={0}
            maxValue={1}
            step={0.01}
            onChange={setLocalCoverage}
            onChangeEnd={(v) => update({ coverage: v })}
          />
          <NumberField
            aria-label="Coverage value"
            value={localCoverage}
            minValue={0}
            maxValue={1}
            step={0.01}
            onChange={(v) =>
              guard(v, (v) => {
                setLocalCoverage(v);
                update({ coverage: v });
              })
            }
          />
        </div>
      </div>

      {/* Flags */}
      <div className={styles.flagsRow}>
        <NumberField
          label="Flags"
          labelPosition="side"
          value={layer.flags}
          step={1}
          minValue={0}
          onChange={(v) => guard(v, (v) => update({ flags: Math.round(v) }))}
        />
        <div className={styles.flagBits}>
          {Object.entries(FLAG_DEFINITIONS).map(([bit, _label]) => {
            const bitNum = Number(bit);
            return (
              <Checkbox
                key={bit}
                isSelected={getFlagBit(layer.flags, bitNum)}
                onChange={(checked) =>
                  update({ flags: setFlagBit(layer.flags, bitNum, checked) })
                }
              >
                Bit {bit}
              </Checkbox>
            );
          })}
        </div>
      </div>
    </div>
  );
});
