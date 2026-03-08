import { useState, useEffect } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';

const STEM_NAMES = ['vocals', 'drums', 'bass', 'other', 'guitar', 'piano'];

export default function StemImporter() {
  const addMediaItem = useVideoEditorStore((s) => s.addMediaItem);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs?status=completed&limit=10');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.data || data.jobs || []);
      }
    } catch {
      // Server may not be running - that's ok
    }
    setLoading(false);
  }

  function importStem(job, stemName, stemUrl) {
    addMediaItem({
      name: `${stemName} - ${job.originalName || 'Separated'}`,
      type: 'audio',
      url: stemUrl,
      duration: 0,
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center mb-2">
        Import stems from Audio Separator
      </div>

      <button
        onClick={loadJobs}
        className="w-full rounded px-2 py-1 text-[10px] font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
      >
        Refresh
      </button>

      {loading && (
        <div className="text-[10px] text-gray-400 text-center py-4">Loading...</div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center py-4">
          No completed separation jobs found.
          <br />
          <span className="text-[8px]">Run Audio Separator first to create stems.</span>
        </div>
      )}

      {jobs.map((job) => (
        <div
          key={job._id || job.id}
          className="rounded border border-gray-200 dark:border-gray-700 p-2"
        >
          <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate mb-1">
            {job.originalName || job.fileName || 'Unknown'}
          </div>
          <div className="text-[8px] text-gray-400 dark:text-gray-500 mb-1.5">
            {job.model || 'htdemucs'} | {job.stems?.length || 0} stems
          </div>
          <div className="flex flex-wrap gap-1">
            {(job.stems || []).map((stem, i) => {
              const stemName = stem.name || STEM_NAMES[i] || `Stem ${i + 1}`;
              const stemUrl = stem.url || `/api/audio/stems/${job._id || job.id}/${stemName}`;
              return (
                <button
                  key={i}
                  onClick={() => importStem(job, stemName, stemUrl)}
                  className="rounded px-1.5 py-0.5 text-[8px] font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"
                >
                  + {stemName}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
