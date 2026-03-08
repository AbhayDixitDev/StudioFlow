import { Slider } from '@studioflow/ui';

export default function FadeControls({
  fadeIn,
  fadeOut,
  maxDuration,
  onFadeInChange,
  onFadeOutChange,
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2">
          Fade In: {fadeIn.toFixed(1)}s
        </label>
        <input
          type="range"
          min={0}
          max={Math.min(10, maxDuration / 2)}
          step={0.1}
          value={fadeIn}
          onChange={(e) => onFadeInChange(parseFloat(e.target.value))}
          className="w-full h-1 accent-violet-500"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2">
          Fade Out: {fadeOut.toFixed(1)}s
        </label>
        <input
          type="range"
          min={0}
          max={Math.min(10, maxDuration / 2)}
          step={0.1}
          value={fadeOut}
          onChange={(e) => onFadeOutChange(parseFloat(e.target.value))}
          className="w-full h-1 accent-violet-500"
        />
      </div>
    </div>
  );
}
