import { useState, useRef, useEffect } from 'react';
import { ToolPage, FileDropzone } from '@audio-sep/ui';
import {
  Download,
  CheckCircle,
  Link as LinkIcon,
  Upload,
  AlertCircle,
  Clock,
  Music,
} from 'lucide-react';
import FormatPicker from '../features/converter/FormatPicker.jsx';
import api from '../services/api.js';
import { formatFileSize, isSupportedVideoUrl } from '@audio-sep/shared';

const TABS = ['Upload File', 'Paste URL'];

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoToAudio() {
  const [activeTab, setActiveTab] = useState(0);
  const [outputFormat, setOutputFormat] = useState('mp3');

  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // URL state
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer() {
    startTimeRef.current = Date.now();
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const handleFileDrop = async (files) => {
    const selected = files[0];
    if (!selected) return;

    setError(null);
    setResult(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selected);
      const { data } = await api.post('/audio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFile(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError(null);
    setStatusText('Extracting audio from video...');
    startTimer();

    try {
      const { data } = await api.post('/audio/extract', {
        fileId: uploadedFile.id,
        outputFormat,
      });
      stopTimer();
      setResult({ type: 'extract', ...data.data });
    } catch (err) {
      stopTimer();
      setError(err.response?.data?.error?.message || 'Extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFromUrl = async () => {
    if (!url.trim()) return;

    if (!isSupportedVideoUrl(url)) {
      setUrlError('Please enter a valid YouTube, Vimeo, or direct video URL');
      return;
    }

    setUrlError('');
    setIsProcessing(true);
    setError(null);
    setStatusText('Downloading from URL...');
    startTimer();

    try {
      const { data } = await api.post('/audio/from-url', { url, outputFormat });
      stopTimer();
      setResult({ type: 'url', ...data.data });
    } catch (err) {
      stopTimer();
      setError(err.response?.data?.error?.message || 'Download failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      let downloadUrl;
      if (result.type === 'extract' && result.jobId) {
        downloadUrl = `/audio/download/${result.jobId}`;
      } else if (result.id) {
        downloadUrl = `/audio/files/${result.id}/download`;
      } else {
        return;
      }

      const response = await api.get(downloadUrl, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = blobUrl;

      const name =
        result.audioFile?.originalName ||
        result.originalName ||
        `audio.${outputFormat}`;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Download failed: ' + (err.message || 'Unknown error'));
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setUrl('');
    setUrlError('');
    setElapsed(0);
    setStatusText('');
    stopTimer();
  };

  return (
    <ToolPage
      title="Video to Audio"
      description="Extract audio from video files or YouTube URLs"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        {!result && !isProcessing && (
          <div className="flex gap-2">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(i);
                  reset();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    activeTab === i
                      ? 'bg-violet-500 text-white'
                      : 'bg-[var(--glass-bg)] hover:bg-[var(--glass-hover-bg)] text-[var(--text-secondary)]'
                  }`}
              >
                {i === 0 ? <Upload size={16} /> : <LinkIcon size={16} />}
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Upload tab */}
        {activeTab === 0 && !result && !isProcessing && (
          <>
            {!uploadedFile && (
              <FileDropzone
                accept="video/*"
                onDrop={handleFileDrop}
                loading={isUploading}
              />
            )}

            {uploadedFile && (
              <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                  <Music size={20} className="text-violet-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {uploadedFile.originalName}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {uploadedFile.format?.toUpperCase()} &middot;{' '}
                      {formatFileSize(uploadedFile.fileSize)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {uploadedFile && (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">
                    Output Format
                  </h3>
                  <FormatPicker
                    selected={outputFormat}
                    onSelect={setOutputFormat}
                  />
                </div>
                <button
                  onClick={handleExtract}
                  disabled={isProcessing}
                  className="w-full rounded-lg !bg-violet-600 hover:!bg-violet-700 px-6 py-3 text-sm font-semibold !text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Extract Audio
                </button>
              </>
            )}
          </>
        )}

        {/* URL tab */}
        {activeTab === 1 && !result && !isProcessing && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                Video URL
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError('');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
              {urlError && (
                <p className="mt-1.5 text-xs text-red-500">{urlError}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">
                Output Format
              </h3>
              <FormatPicker
                selected={outputFormat}
                onSelect={setOutputFormat}
              />
            </div>

            <button
              onClick={handleFromUrl}
              disabled={!url.trim() || isProcessing}
              className="w-full rounded-lg !bg-violet-600 hover:!bg-violet-700 px-6 py-3 text-sm font-semibold !text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download & Extract Audio
            </button>
          </>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            {/* Spinner */}
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg
                className="h-28 w-28 animate-spin"
                viewBox="0 0 120 120"
                style={{ animationDuration: '2s' }}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  className="text-violet-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.3} ${2 * Math.PI * 52 * 0.7}`}
                />
              </svg>
            </div>

            <p className="text-sm font-medium text-[var(--text-muted)]">
              {statusText}
            </p>

            {/* Time info */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Clock size={13} />
              <span>Elapsed: {formatDuration(elapsed)}</span>
            </div>

            {activeTab === 1 && (
              <p className="text-[11px] text-[var(--text-muted)] opacity-60 truncate max-w-sm">
                {url}
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-5">
            {/* Success header */}
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-700 dark:bg-green-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle
                    size={18}
                    className="text-green-600 dark:text-green-400 flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300 truncate">
                    Audio extracted successfully!
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 flex-shrink-0 ml-3">
                  <Clock size={12} />
                  <span>{formatDuration(elapsed)}</span>
                </div>
              </div>
            </div>

            {/* File info */}
            <div className="rounded-lg border border-gray-200 bg-[var(--glass-bg)] px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Music size={20} className="text-violet-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-[var(--text-primary)] truncate"
                    title={
                      result.audioFile?.originalName || result.originalName
                    }
                  >
                    {result.audioFile?.originalName || result.originalName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {outputFormat.toUpperCase()}
                    {(result.audioFile?.fileSize || result.fileSize) &&
                      ` - ${formatFileSize(result.audioFile?.fileSize || result.fileSize)}`}
                    {(result.audioFile?.duration || result.duration) > 0 &&
                      ` - ${formatDuration(result.audioFile?.duration || result.duration)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="w-full rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download {outputFormat.toUpperCase()}
              {(result.audioFile?.fileSize || result.fileSize) &&
                ` (${formatFileSize(result.audioFile?.fileSize || result.fileSize)})`}
            </button>

            <button
              onClick={reset}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-bg)] dark:border-gray-600"
            >
              Extract Another
            </button>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
