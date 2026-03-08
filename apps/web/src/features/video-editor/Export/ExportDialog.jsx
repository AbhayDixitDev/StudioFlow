import { useState } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import ExportProgress from './ExportProgress.jsx';

const RESOLUTIONS = [
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '1440p', width: 2560, height: 1440 },
  { label: '4K', width: 3840, height: 2160 },
];

const FORMATS = [
  { label: 'MP4 (H.264)', value: 'mp4', codec: 'libx264' },
  { label: 'WebM (VP9)', value: 'webm', codec: 'libvpx-vp9' },
  { label: 'MOV', value: 'mov', codec: 'libx264' },
];

const QUALITY = [
  { label: 'Low', value: 'low', crf: 28 },
  { label: 'Medium', value: 'medium', crf: 23 },
  { label: 'High', value: 'high', crf: 18 },
  { label: 'Ultra', value: 'ultra', crf: 12 },
];

const FPS_OPTIONS = [24, 30, 60];

const AUDIO_BITRATES = ['128k', '192k', '256k', '320k'];

const PRESETS = [
  { name: 'YouTube 1080p', width: 1920, height: 1080, format: 'mp4', fps: 30, quality: 'high', audioBitrate: '256k' },
  { name: 'Instagram Reel', width: 1080, height: 1920, format: 'mp4', fps: 30, quality: 'medium', audioBitrate: '192k' },
  { name: 'TikTok', width: 1080, height: 1920, format: 'mp4', fps: 30, quality: 'medium', audioBitrate: '192k' },
  { name: 'Twitter/X', width: 1280, height: 720, format: 'mp4', fps: 30, quality: 'medium', audioBitrate: '192k' },
];

export default function ExportDialog({ open, onClose }) {
  const projectId = useVideoEditorStore((s) => s.projectId);

  const [settings, setSettings] = useState({
    width: 1920,
    height: 1080,
    format: 'mp4',
    quality: 'high',
    fps: 30,
    audioBitrate: '256k',
  });

  const [exporting, setExporting] = useState(false);
  const [jobId, setJobId] = useState(null);

  if (!open) return null;

  function applyPreset(preset) {
    setSettings({
      width: preset.width,
      height: preset.height,
      format: preset.format,
      quality: preset.quality,
      fps: preset.fps,
      audioBitrate: preset.audioBitrate,
    });
  }

  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function startExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/video/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, settings }),
      });
      if (res.ok) {
        const data = await res.json();
        setJobId(data.data?.jobId || data.jobId);
      }
    } catch {
      // will show in progress view
    }
  }

  // Estimated file size (rough)
  const pixels = settings.width * settings.height;
  const qualObj = QUALITY.find((q) => q.value === settings.quality);
  const bitsPerPixel = qualObj ? (30 - qualObj.crf) * 0.1 : 0.5;
  const duration = useVideoEditorStore.getState().duration || 30;
  const estSizeMB = ((pixels * bitsPerPixel * settings.fps * duration) / 8 / 1024 / 1024).toFixed(0);

  if (exporting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[400px] p-5" onClick={(e) => e.stopPropagation()}>
          <ExportProgress jobId={jobId} onClose={() => { setExporting(false); setJobId(null); onClose(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[440px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Export Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Presets */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Presets</label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:border-violet-400 dark:hover:border-violet-500 transition-colors text-left"
                >
                  {p.name}
                  <span className="block text-[8px] text-gray-400">{p.width}x{p.height}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resolution</label>
            <div className="flex gap-1.5 mt-1">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => update('width', r.width) || update('height', r.height)}
                  className={`flex-1 rounded px-2 py-1 text-[10px] font-medium border transition-colors ${
                    settings.width === r.width && settings.height === r.height
                      ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1.5">
              <input
                type="number"
                value={settings.width}
                onChange={(e) => update('width', parseInt(e.target.value) || 1920)}
                className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
              />
              <span className="text-[10px] text-gray-400 self-center">x</span>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => update('height', parseInt(e.target.value) || 1080)}
                className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Format</label>
            <div className="flex gap-1.5 mt-1">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => update('format', f.value)}
                  className={`flex-1 rounded px-2 py-1 text-[10px] font-medium border transition-colors ${
                    settings.format === f.value
                      ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality</label>
            <div className="flex gap-1.5 mt-1">
              {QUALITY.map((q) => (
                <button
                  key={q.value}
                  onClick={() => update('quality', q.value)}
                  className={`flex-1 rounded px-2 py-1 text-[10px] font-medium border transition-colors ${
                    settings.quality === q.value
                      ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* FPS + Audio */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">FPS</label>
              <select
                value={settings.fps}
                onChange={(e) => update('fps', Number(e.target.value))}
                className="w-full mt-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
              >
                {FPS_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f} fps</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audio Bitrate</label>
              <select
                value={settings.audioBitrate}
                onChange={(e) => update('audioBitrate', e.target.value)}
                className="w-full mt-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-200"
              >
                {AUDIO_BITRATES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated size */}
          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            Estimated file size: ~{estSizeMB} MB
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={startExport}
            className="rounded px-4 py-1.5 text-[10px] font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
