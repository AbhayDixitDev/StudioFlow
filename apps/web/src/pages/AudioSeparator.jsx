import { useState, useEffect, useRef, useCallback } from 'react';
import { ToolPage, FileDropzone } from '@studioflow/ui';
import { Music, AlertCircle, Clock, ServerOff } from 'lucide-react';
import StemSelector from '../features/separator/StemSelector.jsx';
import StemPlayer from '../features/separator/StemPlayer.jsx';
import DownloadPanel from '../features/separator/DownloadPanel.jsx';
import api from '../services/api.js';
import { formatFileSize } from '@studioflow/shared';

const isElectron = !!(window.electronAPI);

const STEPS = {
  INPUT: 'input',
  PROCESSING: 'processing',
  RESULTS: 'results',
};

const MODEL_TIME_MULT = {
  htdemucs: 2.0,
  htdemucs_6s: 3.0,
  mdx_extra: 8.0,
};

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatEstimate(seconds) {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const m = Math.ceil(seconds / 60);
  return `~${m} min`;
}

export default function AudioSeparator() {
  const [step, setStep] = useState(STEPS.INPUT);
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [model, setModel] = useState('htdemucs');
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [stems, setStems] = useState([]);
  const [stemBlobUrls, setStemBlobUrls] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState(null);
  const [serverAvailable, setServerAvailable] = useState(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const doneRef = useRef(false);
  const mountedRef = useRef(true);

  // Check server availability (web only)
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    if (!isElectron) {
      (async () => {
        try {
          await api.get('/health', { timeout: 3000 });
          if (!cancelled) setServerAvailable(true);
        } catch {
          if (!cancelled) setServerAvailable(false);
        }
      })();
    }

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer(estimatedTotal) {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setTotalTime(estimatedTotal);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const startPolling = useCallback((jId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    doneRef.current = false;

    pollRef.current = setInterval(async () => {
      if (doneRef.current || !mountedRef.current) return;

      try {
        const { data } = await api.get(`/jobs/${jId}`);
        const job = data.data;

        if (doneRef.current || !mountedRef.current) return;

        setProgress(job.progress);

        if (job.progress < 10) setStatusText('Loading model...');
        else if (job.progress < 85) setStatusText('Separating audio...');
        else if (job.progress < 100) setStatusText('Saving stems...');

        if (job.status === 'completed') {
          doneRef.current = true;
          clearInterval(pollRef.current);
          pollRef.current = null;
          stopTimer();
          setProgress(100);
          setStatusText('Complete!');
          setStems(job.stems || []);
          setStep(STEPS.RESULTS);
        } else if (job.status === 'failed') {
          doneRef.current = true;
          clearInterval(pollRef.current);
          pollRef.current = null;
          stopTimer();
          setError(job.error || 'Separation failed');
          setStep(STEPS.INPUT);
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }, []);

  async function handleFileDrop(files) {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setUploadedFile(null);
    setStemBlobUrls(null);

    if (isElectron) {
      // In Electron, skip server upload — just store local file info
      setUploadedFile({
        id: 'local',
        originalName: selected.name,
        fileSize: selected.size,
        duration: 0,
      });
    } else {
      // Web: upload to server
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selected);
        const { data } = await api.post('/audio/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadedFile(data.data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
          'Upload failed — make sure the backend server is running'
        );
        setFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  }

  async function handleSeparate() {
    if (!uploadedFile) return;

    setError(null);
    setProgress(0);
    setStatusText('Queuing...');
    setStep(STEPS.PROCESSING);

    const duration = uploadedFile.duration || 180;
    const mult = MODEL_TIME_MULT[model] || 3;
    const est = Math.max(duration * mult, 15);
    startTimer(est);

    if (isElectron) {
      // Electron: use local IPC
      try {
        const inputPath = file.path; // Electron File objects have .path
        const outputDir = inputPath.replace(/\.[^.]+$/, '') + '_stems';

        // Listen for progress
        const removeListener = window.electronAPI.onProgress(({ type, progress: p }) => {
          if (type === 'separate' && mountedRef.current) {
            setProgress(p);
            if (p < 10) setStatusText('Loading model...');
            else if (p < 85) setStatusText('Separating audio...');
            else if (p < 100) setStatusText('Saving stems...');
          }
        });

        const result = await window.electronAPI.separateAudio(inputPath, outputDir, model);
        removeListener();
        stopTimer();

        // Read stem files into blobs for playback
        const blobMap = {};
        for (const stem of result.stems) {
          try {
            const buffer = await window.electronAPI.readFile(stem.path);
            const blob = new Blob([buffer], { type: 'audio/wav' });
            blobMap[stem.name] = URL.createObjectURL(blob);
          } catch (e) {
            console.error(`Failed to read stem ${stem.name}:`, e);
          }
        }

        setStems(result.stems);
        setStemBlobUrls(blobMap);
        setProgress(100);
        setStatusText('Complete!');
        setStep(STEPS.RESULTS);
      } catch (err) {
        stopTimer();
        setError(err.message || 'Separation failed');
        setStep(STEPS.INPUT);
      }
    } else {
      // Web: use server API
      try {
        const { data } = await api.post('/audio/separate', {
          fileId: uploadedFile.id,
          model,
        });

        const newJobId = data.data.jobId;
        setJobId(newJobId);
        startPolling(newJobId);
      } catch (err) {
        stopTimer();
        setError(err.response?.data?.error?.message || 'Failed to start separation');
        setStep(STEPS.INPUT);
      }
    }
  }

  function handleReset() {
    doneRef.current = true;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    stopTimer();

    // Revoke stem blob URLs
    if (stemBlobUrls) {
      Object.values(stemBlobUrls).forEach((url) => URL.revokeObjectURL(url));
    }

    setStep(STEPS.INPUT);
    setFile(null);
    setUploadedFile(null);
    setJobId(null);
    setProgress(0);
    setStems([]);
    setStemBlobUrls(null);
    setError(null);
    setStatusText('');
    setElapsed(0);
    setTotalTime(null);
  }

  const remaining = progress > 2 && elapsed > 5
    ? Math.max(Math.round((elapsed / progress) * (100 - progress)), 0)
    : totalTime
      ? Math.max(totalTime - elapsed, 0)
      : null;

  const estimatedTime = uploadedFile?.duration
    ? Math.max((uploadedFile.duration) * (MODEL_TIME_MULT[model] || 3), 15)
    : null;

  const stemBaseUrl = jobId ? `/audio/stems/${jobId}` : '';

  return (
    <ToolPage
      title="Audio Separator"
      description="Split any song into individual stems using AI"
    >
      {/* Server unavailable notice (web only, not Electron) */}
      {!isElectron && serverAvailable === false && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-500/10">
          <ServerOff size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Backend Server Required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Audio separation uses AI models (Demucs) that require the backend server with Python and Redis.
              Start the server with <code className="bg-amber-200/50 dark:bg-amber-500/20 px-1 rounded">npm run dev</code> from the project root.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* INPUT STEP */}
      {step === STEPS.INPUT && (
        <div className="space-y-6">
          <FileDropzone
            accept="audio/*,video/*"
            onDrop={handleFileDrop}
            label="Drop audio or video file here or click to browse"
          />

          {isUploading && (
            <div className="text-center text-sm text-gray-400 dark:text-gray-500">
              Uploading...
            </div>
          )}

          {uploadedFile && (
            <div className="rounded-lg border border-gray-200 bg-white dark:bg-white/5 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Music size={20} className="text-violet-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file?.name || uploadedFile.originalName}>
                    {file?.name || uploadedFile.originalName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatFileSize(uploadedFile.fileSize)}
                    {uploadedFile.duration > 0 &&
                      ` - ${Math.floor(uploadedFile.duration / 60)}:${String(Math.floor(uploadedFile.duration % 60)).padStart(2, '0')}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <StemSelector value={model} onChange={setModel} />

          {uploadedFile && estimatedTime && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Clock size={14} />
              <span>Estimated processing time: {formatEstimate(estimatedTime)}</span>
            </div>
          )}

          <button
            onClick={handleSeparate}
            disabled={!uploadedFile || isUploading}
            className="w-full rounded-lg !bg-violet-600 hover:!bg-violet-700 px-6 py-3 text-sm font-semibold !text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Separate Audio
          </button>
        </div>
      )}

      {/* PROCESSING STEP */}
      {step === STEPS.PROCESSING && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="currentColor"
                className="text-violet-500 transition-all duration-500"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
              />
            </svg>
            <span className="absolute text-2xl font-bold text-gray-900 dark:text-gray-100">
              {progress}%
            </span>
          </div>

          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {statusText}
          </p>

          <div className="flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span>Elapsed: {formatDuration(elapsed)}</span>
            </div>
            {remaining != null && remaining > 0 && (
              <div className="flex items-center gap-1.5">
                <span>Remaining: ~{formatDuration(remaining)}</span>
              </div>
            )}
          </div>

          {uploadedFile && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 opacity-60 truncate max-w-sm" title={file?.name || uploadedFile.originalName}>
              {file?.name || uploadedFile.originalName}
            </p>
          )}
        </div>
      )}

      {/* RESULTS STEP */}
      {step === STEPS.RESULTS && (
        <div className="space-y-6">
          {uploadedFile && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-700 dark:bg-green-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Music size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300 truncate">
                    {file?.name || uploadedFile.originalName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 flex-shrink-0 ml-3">
                  <Clock size={12} />
                  <span>{formatDuration(elapsed)}</span>
                </div>
              </div>
            </div>
          )}

          <StemPlayer
            stems={stems}
            baseUrl={stemBaseUrl}
            preloadedBlobUrls={stemBlobUrls}
          />
          <DownloadPanel
            stems={stems}
            baseUrl={stemBaseUrl}
            fileName={file?.name || uploadedFile?.originalName}
            preloadedBlobUrls={stemBlobUrls}
          />

          <button
            onClick={handleReset}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors hover:bg-white dark:hover:bg-white/5 dark:border-gray-600"
          >
            Separate Another Track
          </button>
        </div>
      )}
    </ToolPage>
  );
}
