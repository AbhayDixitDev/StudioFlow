import { useEffect, useState } from 'react';
import useVideoEditorStore from '../stores/videoEditorStore.js';
import VideoPreview from '../features/video-editor/Preview/VideoPreview.jsx';
import PreviewControls from '../features/video-editor/Preview/PreviewControls.jsx';
import Timeline from '../features/video-editor/Timeline/Timeline.jsx';
import MediaBin from '../features/video-editor/MediaBin/MediaBin.jsx';
import PropertiesPanel from '../features/video-editor/Properties/PropertiesPanel.jsx';
import ExportDialog from '../features/video-editor/Export/ExportDialog.jsx';

export default function VideoEditor() {
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
        // Paste to first available track
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
  ]);

  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  return (
    <div className="flex flex-col h-full">
      {/* Export button bar */}
      <div className="flex items-center justify-end px-3 py-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setShowExport(true)}
          className="rounded px-3 py-1 text-[10px] font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
        >
          Export
        </button>
      </div>

      {/* Top: MediaBin + Preview + Properties */}
      <div className="flex-1 flex min-h-0">
        {/* Media Bin */}
        <div className="w-52 flex-shrink-0">
          <MediaBin />
        </div>

        {/* Preview area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-950 min-h-0">
            <div className="w-full max-w-3xl">
              <VideoPreview />
            </div>
          </div>
          <PreviewControls />
        </div>

        {/* Properties Panel */}
        <div className="w-56 flex-shrink-0">
          <PropertiesPanel />
        </div>
      </div>

      {/* Timeline */}
      <Timeline />

      {/* Export Dialog */}
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
