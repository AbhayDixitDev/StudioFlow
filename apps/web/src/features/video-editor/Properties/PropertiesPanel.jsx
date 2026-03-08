import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import EffectControls from './EffectControls.jsx';
import TextEditor from './TextEditor.jsx';

export default function PropertiesPanel() {
  const selectedClipIds = useVideoEditorStore((s) => s.selectedClipIds);
  const tracks = useVideoEditorStore((s) => s.tracks);
  const updateClipProperty = useVideoEditorStore((s) => s.updateClipProperty);
  const splitClipAtPlayhead = useVideoEditorStore((s) => s.splitClipAtPlayhead);
  const duplicateClip = useVideoEditorStore((s) => s.duplicateClip);
  const removeClip = useVideoEditorStore((s) => s.removeClip);

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
            <button
              onClick={() =>
                updateClipProperty(clip.id, 'transform', { x: 0, y: 0, scale: 1, rotation: 0 })
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
