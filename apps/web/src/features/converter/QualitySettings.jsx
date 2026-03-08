import { Slider, Select } from '@studioflow/ui';

const BITRATE_OPTIONS = ['64k', '128k', '192k', '256k', '320k'];
const SAMPLE_RATES = [22050, 44100, 48000, 96000];

const LOSSY_FORMATS = ['mp3', 'ogg', 'aac', 'm4a'];

// Max sample rate per format (formats not listed support all)
const MAX_SAMPLE_RATE = { mp3: 48000, ogg: 48000 };

export default function QualitySettings({
  format,
  bitrate,
  sampleRate,
  onBitrateChange,
  onSampleRateChange,
  duration,
}) {
  const isLossy = LOSSY_FORMATS.includes(format);

  // Estimate file size
  const bitrateNum = parseInt(bitrate) || 192;
  const estimatedSize = duration ? Math.round((bitrateNum * duration) / 8) : null;

  function formatSize(kb) {
    if (kb > 1024) return `~${(kb / 1024).toFixed(1)} MB`;
    return `~${kb} KB`;
  }

  return (
    <div className="space-y-4">
      {isLossy && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Bitrate: {bitrate}
          </label>
          <div className="flex gap-2 flex-wrap">
            {BITRATE_OPTIONS.map((br) => (
              <button
                key={br}
                onClick={() => onBitrateChange(br)}
                className={`px-3 py-1 rounded text-sm transition-all
                  ${
                    bitrate === br
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
              >
                {br}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Sample Rate
        </label>
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_RATES.map((sr) => {
            const maxRate = MAX_SAMPLE_RATE[format];
            const disabled = maxRate && sr > maxRate;
            return (
              <button
                key={sr}
                onClick={() => !disabled && onSampleRateChange(sr)}
                disabled={disabled}
                className={`px-3 py-1 rounded text-sm transition-all
                  ${disabled
                    ? 'bg-white/5 opacity-30 cursor-not-allowed line-through'
                    : sampleRate === sr
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                title={disabled ? `${format.toUpperCase()} supports max 48kHz` : ''}
              >
                {(sr / 1000).toFixed(1)}kHz
              </button>
            );
          })}
        </div>
      </div>

      {isLossy && estimatedSize && (
        <p className="text-sm opacity-50">
          Estimated output size: {formatSize(estimatedSize)}
        </p>
      )}
    </div>
  );
}
