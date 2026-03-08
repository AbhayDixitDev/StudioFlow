import { useState, useEffect } from 'react';
import { getProjectsList, createProject, deleteProject, renameProject, migrateOldProject } from '../engine/localPersistence.js';

const FRAME_PRESETS = [
  { label: '16:9', ratio: '16:9', w: 1920, h: 1080, desc: 'YouTube / Landscape', icon: '🖥' },
  { label: '9:16', ratio: '9:16', w: 1080, h: 1920, desc: 'Reels / TikTok / Shorts', icon: '📱' },
  { label: '1:1', ratio: '1:1', w: 1080, h: 1080, desc: 'Instagram Post', icon: '⬜' },
  { label: '4:3', ratio: '4:3', w: 1440, h: 1080, desc: 'Classic / Presentation', icon: '📺' },
  { label: '4:5', ratio: '4:5', w: 1080, h: 1350, desc: 'Instagram Portrait', icon: '📷' },
  { label: '21:9', ratio: '21:9', w: 2560, h: 1080, desc: 'Cinematic Ultrawide', icon: '🎬' },
];

const FPS_OPTIONS = [24, 25, 30, 50, 60];

export default function ProjectsList({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedFps, setSelectedFps] = useState(30);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    migrateOldProject().then(() => {
      setProjects(getProjectsList());
    });
  }, []);

  function handleCreate() {
    const preset = FRAME_PRESETS[selectedPreset];
    const name = newName.trim() || 'Untitled Project';
    const meta = createProject(name, {
      aspectRatio: preset.ratio,
      width: preset.w,
      height: preset.h,
      fps: selectedFps,
    });
    setNewName('');
    setShowCreate(false);
    onSelectProject(meta.id, {
      aspectRatio: preset.ratio,
      width: preset.w,
      height: preset.h,
      fps: selectedFps,
    });
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    deleteProject(id).then(() => {
      setProjects(getProjectsList());
    });
  }

  function handleRename(id) {
    if (editName.trim()) {
      renameProject(id, editName.trim());
      setProjects(getProjectsList());
    }
    setEditingId(null);
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(ts);
  }

  // New project creation dialog
  if (showCreate) {
    const preset = FRAME_PRESETS[selectedPreset];
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="w-full max-w-xl">
          <button
            onClick={() => setShowCreate(false)}
            className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &larr; Back to projects
          </button>

          <h1 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">New Project</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose a name and frame size for your project</p>

          {/* Project name */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Project Name</label>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="My Video Project"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Frame size presets */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Frame Size</label>
            <div className="grid grid-cols-3 gap-2">
              {FRAME_PRESETS.map((p, i) => (
                <button
                  key={p.ratio}
                  onClick={() => setSelectedPreset(i)}
                  className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    selectedPreset === i
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Aspect ratio visual preview */}
                  <div className="flex items-center justify-center mb-2 h-10">
                    <div
                      className={`border-2 rounded-sm ${
                        selectedPreset === i
                          ? 'border-violet-500 bg-violet-100 dark:bg-violet-800/30'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}
                      style={{
                        width: Math.min(40, 40 * (p.w / Math.max(p.w, p.h))),
                        height: Math.min(40, 40 * (p.h / Math.max(p.w, p.h))),
                      }}
                    />
                  </div>
                  <div className={`text-sm font-bold ${selectedPreset === i ? 'text-violet-600 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {p.label}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution + FPS */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Resolution</label>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                {preset.w} x {preset.h}
              </div>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Frame Rate</label>
              <select
                value={selectedFps}
                onChange={(e) => setSelectedFps(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {FPS_OPTIONS.map((fps) => (
                  <option key={fps} value={fps}>{fps} fps</option>
                ))}
              </select>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            className="w-full rounded-lg px-5 py-3 text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Video Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new project or open an existing one</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> New Project
          </button>
        </div>

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No projects yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">Create your first project to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
            >
              + New Project
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Aspect ratio visual */}
                <div className="w-16 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <div
                    className="border-2 border-gray-300 dark:border-gray-500 rounded-sm bg-gray-200 dark:bg-gray-600"
                    style={{
                      width: Math.min(36, 36 * ((proj.width || 1920) / Math.max(proj.width || 1920, proj.height || 1080))),
                      height: Math.min(36, 36 * ((proj.height || 1080) / Math.max(proj.width || 1920, proj.height || 1080))),
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === proj.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(proj.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleRename(proj.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-violet-400 bg-transparent px-2 py-0.5 text-sm font-medium focus:outline-none"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {proj.name}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    <span className="font-medium">{proj.aspectRatio || '16:9'}</span>
                    <span>{proj.width || 1920}x{proj.height || 1080}</span>
                    <span>{proj.fps || 30}fps</span>
                    <span>{proj.trackCount || 0} tracks</span>
                    <span>{timeAgo(proj.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(proj.id);
                      setEditName(proj.name);
                    }}
                    className="px-2 py-1 rounded text-[11px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Rename"
                  >
                    Rename
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
                    className="px-2 py-1 rounded text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
