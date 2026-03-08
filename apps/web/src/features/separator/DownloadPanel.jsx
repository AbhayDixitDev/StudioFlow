import { useState } from 'react';
import api from '../../services/api.js';

const FORMATS = [
  { id: 'wav', label: 'WAV', description: 'Lossless' },
  { id: 'mp3', label: 'MP3', description: 'Compressed' },
  { id: 'flac', label: 'FLAC', description: 'Lossless compressed' },
];

export default function DownloadPanel({ stems = [], baseUrl, fileName, onDownload, preloadedBlobUrls = null }) {
  const [selected, setSelected] = useState(() =>
    stems.reduce((acc, s) => ({ ...acc, [s.name]: true }), {})
  );
  const [format, setFormat] = useState('wav');

  const allSelected = stems.every((s) => selected[s.name]);
  const noneSelected = stems.every((s) => !selected[s.name]);

  function toggleAll() {
    const next = {};
    stems.forEach((s) => { next[s.name] = !allSelected; });
    setSelected(next);
  }

  function toggleStem(name) {
    setSelected((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function handleDownload() {
    const selectedStems = stems.filter((s) => selected[s.name]);
    if (selectedStems.length === 0) return;

    if (onDownload) {
      onDownload({ stems: selectedStems, format });
      return;
    }

    if (preloadedBlobUrls) {
      // Download from pre-loaded blobs (Electron/local mode)
      selectedStems.forEach((stem) => {
        const blobUrl = preloadedBlobUrls[stem.name];
        if (!blobUrl) return;
        const a = document.createElement('a');
        a.href = blobUrl;
        const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : '';
        a.download = baseName ? `${baseName}_${stem.name}.wav` : `${stem.name}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
      return;
    }

    // Download via authenticated fetch (pass format as query param for server-side conversion)
    selectedStems.forEach(async (stem) => {
      try {
        const url = format !== 'wav'
          ? `${baseUrl}/${stem.name}?format=${format}`
          : `${baseUrl}/${stem.name}`;
        const response = await api.get(url, {
          responseType: 'blob',
        });
        const blobUrl = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = blobUrl;
        const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : '';
        a.download = baseName ? `${baseName}_${stem.name}.${format}` : `${stem.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error(`Failed to download ${stem.name}:`, err);
      }
    });
  }

  const selectedCount = stems.filter((s) => selected[s.name]).length;
  const totalSize = stems
    .filter((s) => selected[s.name])
    .reduce((sum, s) => sum + (s.fileSize || 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Download Stems
        </h3>
        <button
          onClick={toggleAll}
          className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Stem checkboxes */}
      <div className="mb-4 space-y-2">
        {stems.map((stem) => (
          <label
            key={stem.name}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <input
              type="checkbox"
              checked={selected[stem.name] || false}
              onChange={() => toggleStem(stem.name)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="flex-1 text-sm capitalize text-gray-700 dark:text-gray-300">
              {stem.name}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {stem.fileSize ? `${(stem.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
            </span>
          </label>
        ))}
      </div>

      {/* Format picker */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Output Format
        </label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs transition-colors ${
                format === f.id
                  ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-500/10 dark:text-violet-300'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="font-medium">{f.label}</div>
              <div className="mt-0.5 text-[10px] opacity-70">{f.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={noneSelected}
        className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {noneSelected
          ? 'Select stems to download'
          : `Download ${selectedCount} stem${selectedCount > 1 ? 's' : ''} (${(totalSize / 1024 / 1024).toFixed(1)} MB)`}
      </button>
    </div>
  );
}
