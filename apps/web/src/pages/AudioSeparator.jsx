import { useState, useEffect, useRef, useCallback } from 'react';
import { ToolPage, FileDropzone } from '@studioflow/ui';
import { Music, AlertCircle, Clock } from 'lucide-react';
import StemSelector from '../features/separator/StemSelector.jsx';
import StemPlayer from '../features/separator/StemPlayer.jsx';
import DownloadPanel from '../features/separator/DownloadPanel.jsx';
import api from '../services/api.js';
import { formatFileSize } from '@studioflow/shared';

const STEPS = {
  INPUT: 'input',
  PROCESSING: 'processing',
  RESULTS: 'results',
};

// CPU time multipliers (seconds of processing per second of audio)
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
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const doneRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Elapsed time ticker (every 1s while processing)
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
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSeparate() {
    if (!uploadedFile) return;

    setError(null);
    setProgress(0);
    setStatusText('Queuing...');
    setStep(STEPS.PROCESSING);

    // Estimate total time based on audio duration and model
    const duration = uploadedFile.duration || 180; // fallback 3min
    const mult = MODEL_TIME_MULT[model] || 3;
    const est = Math.max(duration * mult, 15);
    startTimer(est);

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

  function handleReset() {
    doneRef.current = true;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    stopTimer();
    setStep(STEPS.INPUT);
    setFile(null);
    setUploadedFile(null);
    setJobId(null);
    setProgress(0);
    setStems([]);
    setError(null);
    setStatusText('');
    setElapsed(0);
    setTotalTime(null);
  }

  // Compute remaining time from progress and elapsed
  const remaining = progress > 2 && elapsed > 5
    ? Math.max(Math.round((elapsed / progress) * (100 - progress)), 0)
    : totalTime
      ? Math.max(totalTime - elapsed, 0)
      : null;

  // Estimated time shown before starting
  const estimatedTime = uploadedFile?.duration
    ? Math.max((uploadedFile.duration) * (MODEL_TIME_MULT[model] || 3), 15)
    : null;

  const stemBaseUrl = jobId ? `/audio/stems/${jobId}` : '';

  return (
    <ToolPage
      title="Audio Separator"
      description="Split any song into individual stems using AI"
    >
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

          {/* Estimated time before starting */}
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

          {/* Time info */}
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

          {/* File info reminder */}
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

          <StemPlayer stems={stems} baseUrl={stemBaseUrl} />
          <DownloadPanel stems={stems} baseUrl={stemBaseUrl} fileName={file?.name || uploadedFile?.originalName} />

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
