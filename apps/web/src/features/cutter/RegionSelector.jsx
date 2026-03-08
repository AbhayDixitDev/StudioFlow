import { Input } from '@studioflow/ui';
import { formatTimecode, parseTimecode } from '@studioflow/shared';

export default function RegionSelector({
  start,
  end,
  duration,
  onChange,
}) {
  const regionDuration = end - start;

  const handleStartChange = (e) => {
    const seconds = parseTimecode(e.target.value);
    if (!isNaN(seconds) && seconds >= 0 && seconds < end) {
      onChange({ start: seconds, end });
    }
  };

  const handleEndChange = (e) => {
    const seconds = parseTimecode(e.target.value);
    if (!isNaN(seconds) && seconds > start && seconds <= duration) {
      onChange({ start, end: seconds });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          label="Start"
          value={formatTimecode(start)}
          onChange={handleStartChange}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex-1">
        <Input
          label="End"
          value={formatTimecode(end)}
          onChange={handleEndChange}
          className="font-mono text-sm"
        />
      </div>
      <div className="text-center">
        <span className="block text-xs opacity-50 mb-1">Duration</span>
        <span className="font-mono text-sm">{formatTimecode(regionDuration)}</span>
      </div>
    </div>
  );
}
