import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import EffectControls from './EffectControls.jsx';
import TextEditor from './TextEditor.jsx';
import filterPresets from '../engine/filterPresets.js';

export default function PropertiesPanel() {
  const selectedClipIds = useVideoEditorStore((s) => s.selectedClipIds);
  const tracks = useVideoEditorStore((s) => s.tracks);
  const updateClipProperty = useVideoEditorStore((s) => s.updateClipProperty);
  const splitClipAtPlayhead = useVideoEditorStore((s) => s.splitClipAtPlayhead);
  const duplicateClip = useVideoEditorStore((s) => s.duplicateClip);
  const removeClip = useVideoEditorStore((s) => s.removeClip);
  const applyFilterPreset = useVideoEditorStore((s) => s.applyFilterPreset);

  // Find selected clip
  let clip = null;
  if (selectedClipIds.length === 1) {
    for (const t of tracks) {
      clip = t.clips.find((c) => c.id === selectedClipIds[0]);
      if (clip) break;
    }
  }

  if (!clip) {
    return (
      <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {selectedClipIds.length > 1 ? `${selectedClipIds.length} clips selected` : 'No clip selected'}
          </span>
        </div>
      </div>
    );
  }

  const isVisual = clip.type === 'video' || clip.type === 'image' || clip.type === 'text';
  const hasAudio = clip.type === 'video' || clip.type === 'audio';

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Properties</span>
      </div>

      {/* Clip info */}
      <Section title="Clip">
        <div className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Name</span>
            <span className="text-gray-800 dark:text-gray-200 truncate ml-2 max-w-[100px]">{clip.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Type</span>
            <span className="text-gray-800 dark:text-gray-200 capitalize">{clip.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Start</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">{clip.startTime.toFixed(2)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">{clip.duration.toFixed(2)}s</span>
          </div>
        </div>
      </Section>

      {/* Transform (visual clips only) */}
      {isVisual && (
        <Section title="Transform">
          <div className="space-y-2">
            <NumberRow
              label="Position X"
              value={clip.transform?.x || 0}
              onChange={(v) => updateClipProperty(clip.id, 'transform', { ...clip.transform, x: v })}
              step={1}
            />
            <NumberRow
              label="Position Y"
              value={clip.transform?.y || 0}
              onChange={(v) => updateClipProperty(clip.id, 'transform', { ...clip.transform, y: v })}
              step={1}
            />
            <NumberRow
              label="Scale"
              value={(clip.transform?.scale || 1) * 100}
              onChange={(v) => updateClipProperty(clip.id, 'transform', { ...clip.transform, scale: v / 100 })}
              suffix="%"
              min={10}
              max={500}
              step={5}
            />
            <NumberRow
              label="Rotation"
              value={clip.transform?.rotation || 0}
              onChange={(v) => updateClipProperty(clip.id, 'transform', { ...clip.transform, rotation: v })}
              suffix="°"
              min={-360}
              max={360}
              step={1}
            />
            {/* Flip buttons */}
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => updateClipProperty(clip.id, 'transform', { ...clip.transform, flipH: !clip.transform?.flipH })}
                className={`flex-1 rounded px-2 py-1 text-[9px] font-medium ${
                  clip.transform?.flipH
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                Flip H
              </button>
              <button
                onClick={() => updateClipProperty(clip.id, 'transform', { ...clip.transform, flipV: !clip.transform?.flipV })}
                className={`flex-1 rounded px-2 py-1 text-[9px] font-medium ${
                  clip.transform?.flipV
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                Flip V
              </button>
            </div>
            <button
              onClick={() =>
                updateClipProperty(clip.id, 'transform', { x: 0, y: 0, scale: 1, rotation: 0, flipH: false, flipV: false })
              }
              className="w-full rounded px-2 py-1 text-[9px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reset Transform
            </button>
          </div>
        </Section>
      )}

      {/* Opacity (visual clips) */}
      {isVisual && (
        <Section title="Opacity">
          <SliderRow
            value={Math.round((clip.opacity != null ? clip.opacity : 1) * 100)}
            onChange={(v) => updateClipProperty(clip.id, 'opacity', v / 100)}
            min={0}
            max={100}
            suffix="%"
          />
        </Section>
      )}

      {/* Blend Mode (visual clips) */}
      {isVisual && (
        <Section title="Blend Mode">
          <select
            value={clip.blendMode || 'source-over'}
            onChange={(e) => updateClipProperty(clip.id, 'blendMode', e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-700 dark:text-gray-300"
          >
            <optgroup label="Normal">
              <option value="source-over">Normal</option>
            </optgroup>
            <optgroup label="Darken">
              <option value="multiply">Multiply</option>
              <option value="darken">Darken</option>
              <option value="color-burn">Color Burn</option>
            </optgroup>
            <optgroup label="Lighten">
              <option value="screen">Screen</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
            </optgroup>
            <optgroup label="Contrast">
              <option value="overlay">Overlay</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
            </optgroup>
            <optgroup label="Comparative">
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
            </optgroup>
            <optgroup label="Composite">
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="color">Color</option>
              <option value="luminosity">Luminosity</option>
            </optgroup>
          </select>
        </Section>
      )}

      {/* Background Fill (visual clips with potential letterboxing) */}
      {isVisual && clip.type !== 'text' && (
        <Section title="Background">
          <select
            value={clip.bgFill || 'black'}
            onChange={(e) => updateClipProperty(clip.id, 'bgFill', e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-700 dark:text-gray-300 mb-1"
          >
            <option value="black">Black Bars</option>
            <option value="blur">Blur Fill</option>
            <option value="color">Solid Color</option>
            <option value="stretch">Stretch to Fill</option>
          </select>
          {clip.bgFill === 'color' && (
            <input
              type="color"
              value={clip.bgColor || '#000000'}
              onChange={(e) => updateClipProperty(clip.id, 'bgColor', e.target.value)}
              className="w-full h-6 rounded cursor-pointer"
            />
          )}
        </Section>
      )}

      {/* Volume (audio/video clips) */}
      {hasAudio && (
        <Section title="Volume">
          <SliderRow
            value={Math.round((clip.volume != null ? clip.volume : 1) * 100)}
            onChange={(v) => updateClipProperty(clip.id, 'volume', v / 100)}
            min={0}
            max={200}
            suffix="%"
          />
          <div className="mt-2 space-y-2">
            <NumberRow
              label="Fade In"
              value={clip.fadeIn || 0}
              onChange={(v) => updateClipProperty(clip.id, 'fadeIn', v)}
              min={0}
              max={clip.duration}
              step={0.1}
              suffix="s"
            />
            <NumberRow
              label="Fade Out"
              value={clip.fadeOut || 0}
              onChange={(v) => updateClipProperty(clip.id, 'fadeOut', v)}
              min={0}
              max={clip.duration}
              step={0.1}
              suffix="s"
            />
          </div>
        </Section>
      )}

      {/* Speed (video/audio clips) */}
      {(clip.type === 'video' || clip.type === 'audio') && (
        <Section title="Speed">
          <div className="space-y-2">
            <SliderRow
              value={Math.round((clip.speed != null ? clip.speed : 1) * 100)}
              onChange={(v) => updateClipProperty(clip.id, 'speed', v / 100)}
              min={25}
              max={400}
              suffix="%"
            />
            <div className="flex gap-1 flex-wrap">
              {[0.25, 0.5, 1, 1.5, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => updateClipProperty(clip.id, 'speed', s)}
                  className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                    (clip.speed || 1) === s
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[9px] text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                checked={!!clip.reverse}
                onChange={(e) => updateClipProperty(clip.id, 'reverse', e.target.checked)}
                className="accent-violet-500"
              />
              Reverse
            </label>
          </div>
        </Section>
      )}

      {/* Crop (visual clips) */}
      {isVisual && clip.type !== 'text' && (
        <Section title="Crop">
          <div className="space-y-2">
            <NumberRow label="Left" value={clip.crop?.left || 0} onChange={(v) => updateClipProperty(clip.id, 'crop', { ...clip.crop, left: v })} min={0} max={100} suffix="%" />
            <NumberRow label="Top" value={clip.crop?.top || 0} onChange={(v) => updateClipProperty(clip.id, 'crop', { ...clip.crop, top: v })} min={0} max={100} suffix="%" />
            <NumberRow label="Right" value={clip.crop?.right || 0} onChange={(v) => updateClipProperty(clip.id, 'crop', { ...clip.crop, right: v })} min={0} max={100} suffix="%" />
            <NumberRow label="Bottom" value={clip.crop?.bottom || 0} onChange={(v) => updateClipProperty(clip.id, 'crop', { ...clip.crop, bottom: v })} min={0} max={100} suffix="%" />
            <button
              onClick={() => updateClipProperty(clip.id, 'crop', null)}
              className="w-full rounded px-2 py-1 text-[9px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reset Crop
            </button>
          </div>
        </Section>
      )}

      {/* Ken Burns (image clips) */}
      {clip.type === 'image' && (
        <Section title="Ken Burns">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[9px] text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                checked={!!clip.kenBurns?.enabled}
                onChange={(e) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, enabled: e.target.checked })}
                className="accent-violet-500"
              />
              Enable Pan &amp; Zoom
            </label>
            {clip.kenBurns?.enabled && (
              <>
                <NumberRow
                  label="Start Scale"
                  value={Math.round((clip.kenBurns?.startScale || 1) * 100)}
                  onChange={(v) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, startScale: v / 100 })}
                  min={50} max={300} suffix="%"
                />
                <NumberRow
                  label="End Scale"
                  value={Math.round((clip.kenBurns?.endScale || 1.2) * 100)}
                  onChange={(v) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, endScale: v / 100 })}
                  min={50} max={300} suffix="%"
                />
                <NumberRow
                  label="Start X"
                  value={clip.kenBurns?.startX || 0}
                  onChange={(v) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, startX: v })}
                  min={-500} max={500}
                />
                <NumberRow
                  label="End X"
                  value={clip.kenBurns?.endX || 0}
                  onChange={(v) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, endX: v })}
                  min={-500} max={500}
                />
                <NumberRow
                  label="Start Y"
                  value={clip.kenBurns?.startY || 0}
                  onChange={(v) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, startY: v })}
                  min={-500} max={500}
                />
                <NumberRow
                  label="End Y"
                  value={clip.kenBurns?.endY || 0}
                  onChange={(v) => updateClipProperty(clip.id, 'kenBurns', { ...clip.kenBurns, endY: v })}
                  min={-500} max={500}
                />
              </>
            )}
          </div>
        </Section>
      )}

      {/* Filter Presets (visual clips) */}
      {isVisual && clip.type !== 'text' && (
        <Section title="Filter Presets">
          <div className="grid grid-cols-2 gap-1">
            {filterPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyFilterPreset(clip.id, preset)}
                className={`rounded px-1.5 py-1 text-[8px] font-medium text-left transition-colors ${
                  clip.filter === preset.id
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
            {clip.filter && (
              <button
                onClick={() => {
                  updateClipProperty(clip.id, 'effects', []);
                  updateClipProperty(clip.id, 'filter', null);
                }}
                className="rounded px-1.5 py-1 text-[8px] font-medium bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 col-span-2"
              >
                Clear Filter
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Text properties (full editor) */}
      {clip.type === 'text' && (
        <Section title="Text">
          <TextEditor clip={clip} />
        </Section>
      )}

      {/* Effects (visual clips) */}
      {isVisual && (
        <Section title="Effects">
          <EffectControls clip={clip} />
        </Section>
      )}

      {/* Actions */}
      <Section title="Actions">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => splitClipAtPlayhead(clip.id)}
            className="w-full rounded px-2 py-1 text-[9px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Split at Playhead (S)
          </button>
          <button
            onClick={() => duplicateClip(clip.id)}
            className="w-full rounded px-2 py-1 text-[9px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Duplicate (Ctrl+D)
          </button>
          <button
            onClick={() => removeClip(clip.id)}
            className="w-full rounded px-2 py-1 text-[9px] font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            Delete (Del)
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function NumberRow({ label, value, onChange, min, max, step = 1, suffix = '' }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[9px] text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={Math.round(value * 100) / 100}
          onChange={(e) => {
            let v = parseFloat(e.target.value) || 0;
            if (min != null) v = Math.max(min, v);
            if (max != null) v = Math.min(max, v);
            onChange(v);
          }}
          step={step}
          className="w-16 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-right text-gray-800 dark:text-gray-200"
        />
        {suffix && <span className="text-[9px] text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function SliderRow({ value, onChange, min, max, suffix = '' }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-violet-500"
      />
      <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 min-w-[36px] text-right">
        {value}{suffix}
      </span>
    </div>
  );
}
