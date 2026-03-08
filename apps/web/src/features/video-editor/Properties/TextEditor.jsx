import useVideoEditorStore from '../../../stores/videoEditorStore.js';

const FONTS = [
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino',
];

const WEIGHTS = [
  { label: 'Regular', value: 'normal' },
  { label: 'Bold', value: 'bold' },
];

const ALIGNS = [
  { label: 'L', value: 'left', title: 'Left' },
  { label: 'C', value: 'center', title: 'Center' },
  { label: 'R', value: 'right', title: 'Right' },
];

const ANIMATIONS = [
  { label: 'None', value: 'none' },
  { label: 'Fade In', value: 'fadeIn' },
  { label: 'Fade Out', value: 'fadeOut' },
  { label: 'Slide In', value: 'slideIn' },
  { label: 'Typewriter', value: 'typewriter' },
  { label: 'Bounce', value: 'bounce' },
];

export default function TextEditor({ clip }) {
  const updateClipProperty = useVideoEditorStore((s) => s.updateClipProperty);

  const text = clip.text || {};

  function update(changes) {
    updateClipProperty(clip.id, 'text', { ...text, ...changes });
  }

  return (
    <div className="space-y-3">
      {/* Content */}
      <div>
        <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Text Content</label>
        <textarea
          value={text.content || ''}
          onChange={(e) => update({ content: e.target.value })}
          rows={3}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200 resize-none"
          placeholder="Enter text..."
        />
      </div>

      {/* Font family */}
      <div>
        <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Font</label>
        <select
          value={text.fontFamily || 'Arial'}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </div>

      {/* Font size + weight */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Size</label>
          <input
            type="number"
            value={text.fontSize || 48}
            onChange={(e) => update({ fontSize: Math.max(8, Math.min(200, parseInt(e.target.value) || 48)) })}
            min={8}
            max={200}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex-1">
          <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Weight</label>
          <select
            value={text.fontWeight || 'bold'}
            onChange={(e) => update({ fontWeight: e.target.value })}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
          >
            {WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Align</label>
        <div className="flex gap-1">
          {ALIGNS.map((a) => (
            <button
              key={a.value}
              onClick={() => update({ align: a.value })}
              className={`flex-1 rounded px-2 py-1 text-[9px] font-medium ${
                (text.align || 'center') === a.value
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
              }`}
              title={a.title}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="flex gap-3">
        <div>
          <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Color</label>
          <input
            type="color"
            value={text.color || '#ffffff'}
            onChange={(e) => update({ color: e.target.value })}
            className="w-8 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Background</label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={text.bgColor || '#000000'}
              onChange={(e) => update({ bgColor: e.target.value })}
              className="w-8 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="checkbox"
              checked={!!text.hasBg}
              onChange={(e) => update({ hasBg: e.target.checked })}
              className="accent-violet-500"
              title="Enable background"
            />
          </div>
        </div>
      </div>

      {/* Stroke */}
      <div>
        <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Stroke</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!text.stroke}
            onChange={(e) => update({ stroke: e.target.checked })}
            className="accent-violet-500"
          />
          {text.stroke && (
            <>
              <input
                type="color"
                value={text.strokeColor || '#000000'}
                onChange={(e) => update({ strokeColor: e.target.value })}
                className="w-6 h-5 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="number"
                value={text.strokeWidth || 2}
                onChange={(e) => update({ strokeWidth: Math.max(1, parseInt(e.target.value) || 2) })}
                min={1}
                max={20}
                className="w-12 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-[9px] text-gray-800 dark:text-gray-200"
              />
            </>
          )}
        </div>
      </div>

      {/* Shadow */}
      <div>
        <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Shadow</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!text.shadow}
            onChange={(e) => update({ shadow: e.target.checked })}
            className="accent-violet-500"
          />
          {text.shadow && (
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={text.shadowColor || '#000000'}
                onChange={(e) => update({ shadowColor: e.target.value })}
                className="w-6 h-5 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="number"
                value={text.shadowBlur || 4}
                onChange={(e) => update({ shadowBlur: parseFloat(e.target.value) || 4 })}
                min={0}
                max={50}
                step={1}
                title="Blur"
                className="w-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-[9px] text-gray-800 dark:text-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* Letter spacing + Line height */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Letter Spacing</label>
          <input
            type="number"
            value={text.letterSpacing || 0}
            onChange={(e) => update({ letterSpacing: parseFloat(e.target.value) || 0 })}
            step={0.5}
            min={-5}
            max={20}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex-1">
          <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Line Height</label>
          <input
            type="number"
            value={text.lineHeight || 1.4}
            onChange={(e) => update({ lineHeight: parseFloat(e.target.value) || 1.4 })}
            step={0.1}
            min={0.8}
            max={3}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Animation */}
      <div>
        <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Animation</label>
        <select
          value={text.animation || 'none'}
          onChange={(e) => update({ animation: e.target.value })}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
        >
          {ANIMATIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        {text.animation && text.animation !== 'none' && (
          <div className="mt-1">
            <label className="text-[9px] text-gray-500 dark:text-gray-400 block mb-0.5">Duration (s)</label>
            <input
              type="number"
              value={text.animationDuration || 1}
              onChange={(e) => update({ animationDuration: Math.max(0.1, parseFloat(e.target.value) || 1) })}
              step={0.1}
              min={0.1}
              max={10}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
            />
          </div>
        )}
      </div>
    </div>
  );
}
