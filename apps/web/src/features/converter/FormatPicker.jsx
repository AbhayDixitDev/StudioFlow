const FORMATS = [
  { id: 'mp3', label: 'MP3', lossy: true },
  { id: 'wav', label: 'WAV', lossy: false },
  { id: 'flac', label: 'FLAC', lossy: false },
  { id: 'ogg', label: 'OGG', lossy: true },
  { id: 'aac', label: 'AAC', lossy: true },
  { id: 'm4a', label: 'M4A', lossy: true },
];

export default function FormatPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {FORMATS.map((fmt) => (
        <button
          key={fmt.id}
          onClick={() => onSelect(fmt.id)}
          className={`px-4 py-3 rounded-lg border-2 text-center font-medium transition-all
            ${
              selected === fmt.id
                ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                : 'border-white/10 hover:border-white/30'
            }`}
        >
          <div className="text-lg">{fmt.label}</div>
          <div className="text-xs opacity-50">{fmt.lossy ? 'Lossy' : 'Lossless'}</div>
        </button>
      ))}
    </div>
  );
}
