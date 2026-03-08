import { useState, useRef, useEffect } from 'react';
import { ToolPage, FileDropzone } from '@studioflow/ui';
import {
  Download,
  CheckCircle,
  Upload,
  AlertCircle,
  Clock,
  Music,
  ServerOff,
} from 'lucide-react';
import FormatPicker from '../features/converter/FormatPicker.jsx';
import { useFFmpeg } from '../hooks/useFFmpeg.js';
import { formatFileSize } from '@studioflow/shared';

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoToAudio() {
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const ffmpeg = useFFmpeg();

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

  const handleFileDrop = (files) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setResultBlob(null);
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    startTimer();

    try {
      // Use FFmpeg WASM to extract audio from video
      const blob = await ffmpeg.convert(file, outputFormat, {});
      stopTimer();
      setResultBlob(blob);
    } catch (err) {
      stopTimer();
      console.error('Extraction error:', err);
      setError(err.message || 'Extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    a.download = `${baseName}.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResultBlob(null);
    setError(null);
    setElapsed(0);
    stopTimer();
  };

  return (
    <ToolPage
      title="Video to Audio"
      description="Extract audio from video files — processed locally in your browser"
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

        {/* Upload section */}
        {!resultBlob && !isProcessing && (
          <>
            {!file && (
              <FileDropzone
                accept="video/*"
                onDrop={handleFileDrop}
              />
            )}

            {file && (
              <div className="p-4 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <Music size={20} className="text-violet-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {file.name.split('.').pop().toUpperCase()} &middot;{' '}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button onClick={reset} className="text-sm text-violet-400 hover:underline">
                    Change
                  </button>
                </div>
              </div>
            )}

            {file && (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
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
                  {ffmpeg.isLoading ? 'Loading FFmpeg...' : 'Extract Audio'}
                </button>
              </>
            )}
          </>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg
                className="h-28 w-28 animate-spin"
                viewBox="0 0 120 120"
                style={{ animationDuration: '2s' }}
              >
                <circle
                  cx="60" cy="60" r="52"
                  fill="none" stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none" stroke="currentColor"
                  className="text-violet-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.3} ${2 * Math.PI * 52 * 0.7}`}
                />
              </svg>
              {ffmpeg.progress > 0 && (
                <span className="absolute text-lg font-bold text-gray-900 dark:text-gray-100">
                  {ffmpeg.progress}%
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
              {ffmpeg.isLoading ? 'Loading FFmpeg engine...' : 'Extracting audio...'}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Clock size={13} />
              <span>Elapsed: {formatDuration(elapsed)}</span>
            </div>
          </div>
        )}

        {/* Result */}
        {resultBlob && (
          <div className="space-y-5">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-700 dark:bg-green-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
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

            <div className="rounded-lg border border-gray-200 bg-white dark:bg-white/5 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Music size={20} className="text-violet-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name.replace(/\.[^.]+$/, '')}.{outputFormat}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {outputFormat.toUpperCase()} &middot; {formatFileSize(resultBlob.size)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download {outputFormat.toUpperCase()} ({formatFileSize(resultBlob.size)})
            </button>

            <button
              onClick={reset}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors hover:bg-white dark:hover:bg-white/5 dark:border-gray-600"
            >
              Extract Another
            </button>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
