import { useState } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import effectRegistry from '../engine/effects/EffectRegistry.js';

export default function EffectControls({ clip }) {
  const updateClipProperty = useVideoEditorStore((s) => s.updateClipProperty);
  const [showPicker, setShowPicker] = useState(false);

  const effects = clip.effects || [];

  function addEffect(effectId) {
    const def = effectRegistry.get(effectId);
    if (!def) return;
    const newEffect = {
      id: effectId,
      enabled: true,
      values: def.getDefaults(),
      keyframes: null, // null = no keyframes, array = keyframed
    };
    updateClipProperty(clip.id, 'effects', [...effects, newEffect]);
    setShowPicker(false);
  }

  function removeEffect(index) {
    const next = effects.filter((_, i) => i !== index);
    updateClipProperty(clip.id, 'effects', next);
  }

  function toggleEffect(index) {
    const next = effects.map((e, i) =>
      i === index ? { ...e, enabled: !e.enabled } : e
    );
    updateClipProperty(clip.id, 'effects', next);
  }

  function updateEffectValue(index, paramName, value) {
    const next = effects.map((e, i) =>
      i === index ? { ...e, values: { ...e.values, [paramName]: value } } : e
    );
    updateClipProperty(clip.id, 'effects', next);
  }

  function toggleKeyframes(index) {
    const fx = effects[index];
    const def = effectRegistry.get(fx.id);
    if (!def) return;

    const next = effects.map((e, i) => {
      if (i !== index) return e;
      if (e.keyframes) {
        // Remove keyframes
        return { ...e, keyframes: null };
      }
      // Add start/end keyframes with current values
      return {
        ...e,
        keyframes: [
          { time: 0, params: { ...e.values } },
          { time: 1, params: { ...e.values } }, // time=1 means end of clip (normalized)
        ],
      };
    });
    updateClipProperty(clip.id, 'effects', next);
  }

  function updateKeyframeValue(fxIndex, kfIndex, paramName, value) {
    const next = effects.map((e, i) => {
      if (i !== fxIndex) return e;
      const kfs = e.keyframes.map((kf, ki) =>
        ki === kfIndex ? { ...kf, params: { ...kf.params, [paramName]: value } } : kf
      );
      return { ...e, keyframes: kfs };
    });
    updateClipProperty(clip.id, 'effects', next);
  }

  const allEffects = effectRegistry.getAll();
  const categories = effectRegistry.getCategories();

  return (
    <div>
      {/* Applied effects */}
      {effects.map((fx, idx) => {
        const def = effectRegistry.get(fx.id);
        if (!def) return null;

        return (
          <div key={idx} className="mb-2 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Effect header */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-750">
              <button
                onClick={() => toggleEffect(idx)}
                className={`w-3 h-3 rounded-sm border ${fx.enabled ? 'bg-violet-500 border-violet-500' : 'border-gray-400 dark:border-gray-500'}`}
                title={fx.enabled ? 'Disable' : 'Enable'}
              />
              <span className="flex-1 text-[9px] font-medium text-gray-700 dark:text-gray-300">{def.name}</span>
              <button
                onClick={() => toggleKeyframes(idx)}
                className={`text-[8px] px-1 rounded ${fx.keyframes ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={fx.keyframes ? 'Remove keyframes' : 'Add keyframes'}
              >
                KF
              </button>
              <button
                onClick={() => removeEffect(idx)}
                className="text-[9px] text-gray-400 hover:text-red-500"
                title="Remove effect"
              >
                X
              </button>
            </div>

            {/* Effect params */}
            {fx.enabled && !fx.keyframes && (
              <div className="px-2 py-1.5 space-y-1.5">
                {def.params.map((p) => (
                  <ParamControl
                    key={p.name}
                    param={p}
                    value={fx.values[p.name]}
                    onChange={(v) => updateEffectValue(idx, p.name, v)}
                  />
                ))}
              </div>
            )}

            {/* Keyframe mode: start + end values */}
            {fx.enabled && fx.keyframes && (
              <div className="px-2 py-1.5">
                <div className="text-[8px] text-gray-500 dark:text-gray-400 mb-1">Start values:</div>
                <div className="space-y-1 mb-2">
                  {def.params.map((p) => (
                    <ParamControl
                      key={`start_${p.name}`}
                      param={p}
                      value={fx.keyframes[0]?.params[p.name] ?? p.default}
                      onChange={(v) => updateKeyframeValue(idx, 0, p.name, v)}
                    />
                  ))}
                </div>
                <div className="text-[8px] text-gray-500 dark:text-gray-400 mb-1">End values:</div>
                <div className="space-y-1">
                  {def.params.map((p) => (
                    <ParamControl
                      key={`end_${p.name}`}
                      param={p}
                      value={fx.keyframes[1]?.params[p.name] ?? p.default}
                      onChange={(v) => updateKeyframeValue(idx, 1, p.name, v)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add effect */}
      {showPicker ? (
        <div className="rounded border border-gray-200 dark:border-gray-700 p-2 space-y-1.5">
          {categories.map((cat) => (
            <div key={cat}>
              <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{cat}</div>
              <div className="flex flex-wrap gap-1">
                {effectRegistry.getByCategory(cat).map((ef) => {
                  const already = effects.some((e) => e.id === ef.id);
                  return (
                    <button
                      key={ef.id}
                      onClick={() => addEffect(ef.id)}
                      disabled={already}
                      className={`rounded px-1.5 py-0.5 text-[9px] ${
                        already
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/40'
                      }`}
                    >
                      {ef.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowPicker(false)}
            className="w-full text-[9px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full rounded px-2 py-1 text-[9px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
        >
          + Add Effect
        </button>
      )}
    </div>
  );
}

function ParamControl({ param, value, onChange }) {
  if (param.type === 'color') {
    return (
      <div className="flex items-center justify-between">
        <label className="text-[9px] text-gray-500 dark:text-gray-400">{param.label}</label>
        <input
          type="color"
          value={value || param.default}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-5 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
        />
      </div>
    );
  }

  if (param.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <label className="text-[9px] text-gray-500 dark:text-gray-400">{param.label}</label>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-violet-500"
        />
      </div>
    );
  }

  // Number type
  return (
    <div className="flex items-center gap-2">
      <label className="text-[9px] text-gray-500 dark:text-gray-400 min-w-[50px]">{param.label}</label>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value ?? param.default}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-violet-500"
      />
      <span className="text-[9px] font-mono text-gray-600 dark:text-gray-400 min-w-[30px] text-right">
        {typeof value === 'number' ? value.toFixed(2) : param.default}
      </span>
    </div>
  );
}
