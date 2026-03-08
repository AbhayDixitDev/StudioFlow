import { useState, useEffect, useRef } from 'react';

export default function ExportProgress({ jobId, onClose }) {
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const startTime = useRef(Date.now());
  const pollRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    // Poll for progress
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        const job = data.data || data;

        setProgress(job.progress || 0);
        setElapsed(Math.floor((Date.now() - startTime.current) / 1000));

        if (job.status === 'completed') {
          setStatus('completed');
          setProgress(100);
          setDownloadUrl(job.outputPath ? `/api/video/export/${jobId}/download` : null);
          clearInterval(pollRef.current);
        } else if (job.status === 'failed') {
          setStatus('failed');
          clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
    }, 1000);

    return () => clearInterval(pollRef.current);
  }, [jobId]);

  // Elapsed timer
  useEffect(() => {
    if (status !== 'processing') return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const estRemaining = progress > 0
    ? Math.round((elapsed / progress) * (100 - progress))
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {status === 'completed' ? 'Export Complete' : status === 'failed' ? 'Export Failed' : 'Exporting...'}
      </h3>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status === 'completed'
              ? 'bg-green-500'
              : status === 'failed'
                ? 'bg-red-500'
                : 'bg-violet-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <span>{Math.round(progress)}%</span>
        <span>Elapsed: {formatElapsed(elapsed)}</span>
        {status === 'processing' && progress > 0 && (
          <span>~{formatElapsed(estRemaining)} remaining</span>
        )}
      </div>

      {status === 'processing' && (
        <div className="text-[10px] text-gray-400 dark:text-gray-500">
          Rendering frame {Math.round(progress * 18)}...
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {status === 'completed' && downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="rounded px-4 py-1.5 text-[10px] font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Download
          </a>
        )}
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {status === 'completed' ? 'Close' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
