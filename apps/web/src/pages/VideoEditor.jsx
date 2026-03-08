import { useEffect, useState, useRef } from 'react';
import useVideoEditorStore from '../stores/videoEditorStore.js';
import VideoPreview from '../features/video-editor/Preview/VideoPreview.jsx';
import PreviewControls from '../features/video-editor/Preview/PreviewControls.jsx';
import Timeline from '../features/video-editor/Timeline/Timeline.jsx';
import MediaBin from '../features/video-editor/MediaBin/MediaBin.jsx';
import PropertiesPanel from '../features/video-editor/Properties/PropertiesPanel.jsx';
import ExportDialog from '../features/video-editor/Export/ExportDialog.jsx';
import projectTemplates from '../features/video-editor/engine/projectTemplates.js';
import ProjectsList from '../features/video-editor/Projects/ProjectsList.jsx';

export default function VideoEditor() {
  const localProjectId = useVideoEditorStore((s) => s.localProjectId);
  const openLocalProject = useVideoEditorStore((s) => s.openLocalProject);
  const closeProject = useVideoEditorStore((s) => s.closeProject);

  // Always reset to project list when component mounts (e.g. sidebar navigation)
  useEffect(() => {
    return () => closeProject();
  }, [closeProject]);

  // Show projects list if no project is open
  if (!localProjectId) {
    return <ProjectsList onSelectProject={(id, settings) => openLocalProject(id, settings)} />;
  }

  return <VideoEditorWorkspace onBack={closeProject} />;
}

function VideoEditorWorkspace({ onBack }) {
  const destroy = useVideoEditorStore((s) => s.destroy);
  const togglePlayPause = useVideoEditorStore((s) => s.togglePlayPause);
  const undo = useVideoEditorStore((s) => s.undo);
  const redo = useVideoEditorStore((s) => s.redo);
  const splitClipAtPlayhead = useVideoEditorStore((s) => s.splitClipAtPlayhead);
  const selectedClipIds = useVideoEditorStore((s) => s.selectedClipIds);
  const removeClip = useVideoEditorStore((s) => s.removeClip);
  const duplicateClip = useVideoEditorStore((s) => s.duplicateClip);
  const copyClip = useVideoEditorStore((s) => s.copyClip);
  const pasteClip = useVideoEditorStore((s) => s.pasteClip);
  const stepFrame = useVideoEditorStore((s) => s.stepFrame);
  const skipToStart = useVideoEditorStore((s) => s.skipToStart);
  const skipToEnd = useVideoEditorStore((s) => s.skipToEnd);
  const zoomIn = useVideoEditorStore((s) => s.zoomIn);
  const zoomOut = useVideoEditorStore((s) => s.zoomOut);
  const seek = useVideoEditorStore((s) => s.seek);
  const currentTime = useVideoEditorStore((s) => s.currentTime);
  const tracks = useVideoEditorStore((s) => s.tracks);
  const addMarker = useVideoEditorStore((s) => s.addMarker);
  const seekToNextMarker = useVideoEditorStore((s) => s.seekToNextMarker);
  const seekToPrevMarker = useVideoEditorStore((s) => s.seekToPrevMarker);
  const setAspectRatio = useVideoEditorStore((s) => s.setAspectRatio);
  const projectSettings = useVideoEditorStore((s) => s.projectSettings);
  const loadTemplate = useVideoEditorStore((s) => s.loadTemplate);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'KeyZ' && ctrl && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.code === 'KeyY' && ctrl) {
        e.preventDefault();
        redo();
      } else if (e.code === 'KeyZ' && ctrl) {
        e.preventDefault();
        undo();
      } else if (e.code === 'KeyD' && ctrl) {
        e.preventDefault();
        selectedClipIds.forEach((id) => duplicateClip(id));
      } else if (e.code === 'KeyC' && ctrl) {
        e.preventDefault();
        if (selectedClipIds.length === 1) copyClip(selectedClipIds[0]);
      } else if (e.code === 'KeyV' && ctrl) {
        e.preventDefault();
        if (tracks.length > 0) pasteClip(tracks[0].id, currentTime);
      } else if (e.code === 'KeyS' && !ctrl) {
        if (selectedClipIds.length === 1) {
          splitClipAtPlayhead(selectedClipIds[0]);
        }
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        selectedClipIds.forEach((id) => removeClip(id));
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        seek(Math.max(0, currentTime - 1));
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        seek(currentTime + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(1);
      } else if (e.code === 'Home') {
        e.preventDefault();
        skipToStart();
      } else if (e.code === 'End') {
        e.preventDefault();
        skipToEnd();
      } else if (e.code === 'KeyM' && !ctrl) {
        addMarker(currentTime, `Marker`);
      } else if (e.code === 'Period' && ctrl) {
        e.preventDefault();
        seekToNextMarker();
      } else if (e.code === 'Comma' && ctrl) {
        e.preventDefault();
        seekToPrevMarker();
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        zoomIn();
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        zoomOut();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlayPause, undo, redo, splitClipAtPlayhead, selectedClipIds,
    removeClip, duplicateClip, copyClip, pasteClip, stepFrame,
    skipToStart, skipToEnd, zoomIn, zoomOut, seek, currentTime, tracks,
    addMarker, seekToNextMarker, seekToPrevMarker,
  ]);

  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  // Voice-over recording
  const addMediaItem = useVideoEditorStore((s) => s.addMediaItem);
  const addClip = useVideoEditorStore((s) => s.addClip);
  const addTrack = useVideoEditorStore((s) => s.addTrack);
  const getEngine = useVideoEditorStore((s) => s.getEngine);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const name = `Voice-over ${new Date().toLocaleTimeString()}`;
        addMediaItem({ name, type: 'audio', url, file: blob, duration: recordTime });
        // Add to timeline
        const engine = getEngine();
        let audioTrack = engine.tracks.find((t) => t.type === 'audio');
        if (!audioTrack) audioTrack = addTrack('audio', 'Voice-over');
        addClip(audioTrack.id, {
          type: 'audio',
          name,
          startTime: currentTime,
          duration: recordTime || 5,
          sourcePath: url,
          volume: 1,
        });
        setRecordTime(0);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordTime(0);
      const startTs = Date.now();
      recordTimerRef.current = setInterval(() => {
        setRecordTime((Date.now() - startTs) / 1000);
      }, 100);
    } catch {
      // Mic permission denied
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordTimerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Back to projects */}
        <button
          onClick={onBack}
          className="rounded px-2 py-1 text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          title="Back to projects"
        >
          &larr; Projects
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        {/* Template picker */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="rounded px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Templates
          </button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 space-y-1">
              {projectTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { loadTemplate(t); setShowTemplates(false); }}
                  className="w-full text-left rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{t.name}</div>
                  <div className="text-[8px] text-gray-400">{t.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aspect ratio selector */}
        <select
          value={projectSettings.aspectRatio || '16:9'}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-[10px] text-gray-700 dark:text-gray-300"
        >
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
          <option value="4:3">4:3</option>
        </select>

        <span className="text-[9px] text-gray-400">{projectSettings.width}x{projectSettings.height}</span>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        {/* Voice-over recording */}
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="rounded px-2 py-1 text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 flex items-center gap-1.5 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            {recordTime.toFixed(1)}s - Stop
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="rounded px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 flex items-center gap-1"
            title="Record voice-over"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            Record
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setShowExport(true)}
          className="rounded px-3 py-1 text-[10px] font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
        >
          Export
        </button>
      </div>

      {/* Top: MediaBin + Preview + Properties */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Media Bin */}
        <div className="w-52 flex-shrink-0 overflow-y-auto">
          <MediaBin />
        </div>

        {/* Preview area */}
        <div data-preview-container className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-100 dark:bg-gray-950">
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
            <VideoPreview />
          </div>
          <div className="flex-shrink-0">
            <PreviewControls />
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-56 flex-shrink-0 overflow-y-auto">
          <PropertiesPanel />
        </div>
      </div>

      {/* Timeline - fixed height */}
      <div className="flex-shrink-0 h-36 overflow-hidden">
        <Timeline />
      </div>

      {/* Export Dialog */}
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
