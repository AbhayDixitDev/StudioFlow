import { useRef, useState } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import MediaThumbnail from './MediaThumbnail.jsx';
import textTemplates from '../engine/textTemplates.js';
import TransitionPicker from '../Transitions/TransitionPicker.jsx';
import StemImporter from './StemImporter.jsx';

const ACCEPT = 'video/*,audio/*,image/*';

export default function MediaBin() {
  const mediaItems = useVideoEditorStore((s) => s.mediaItems);
  const addMediaItem = useVideoEditorStore((s) => s.addMediaItem);
  const removeMediaItem = useVideoEditorStore((s) => s.removeMediaItem);
  const addTextFromTemplate = useVideoEditorStore((s) => s.addTextFromTemplate);
  const fileRef = useRef(null);
  const [tab, setTab] = useState('media');

  function handleFiles(files) {
    for (const file of files) {
      const type = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
          ? 'audio'
          : 'image';

      const url = URL.createObjectURL(file);
      addMediaItem({
        name: file.name,
        type,
        url,
        file,
        size: file.size,
        duration: 0, // will be updated after metadata loads
      });
    }
  }

  function handleImport() {
    fileRef.current?.click();
  }

  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }

  return (
    <div
      className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('media')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold ${
            tab === 'media'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Media
        </button>
        <button
          onClick={() => setTab('text')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold ${
            tab === 'text'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setTab('transitions')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold ${
            tab === 'transitions'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          FX
        </button>
        <button
          onClick={() => setTab('stems')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold ${
            tab === 'stems'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Stems
        </button>
      </div>

      {tab === 'media' && (
        <>
          {/* Import header */}
          <div className="flex items-center justify-end px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleImport}
              className="rounded px-2 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
            >
              + Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files.length) handleFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
          </div>

          {/* Media thumbnail grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px]">Import media or drag files here</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {mediaItems.map((item) => (
                  <MediaThumbnail
                    key={item.id}
                    item={item}
                    onRemove={() => removeMediaItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'text' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {textTemplates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => addTextFromTemplate(tmpl)}
              className="w-full text-left rounded border border-gray-200 dark:border-gray-700 p-2 hover:border-violet-400 dark:hover:border-violet-500 transition-colors group"
            >
              <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {tmpl.name}
              </div>
              <div className="text-[8px] text-gray-400 dark:text-gray-500">
                {tmpl.description}
              </div>
              <div
                className="mt-1 h-6 rounded bg-gray-900 flex items-center justify-center overflow-hidden"
                style={{
                  fontFamily: tmpl.text.fontFamily,
                  fontSize: Math.min(tmpl.text.fontSize / 4, 14),
                  fontWeight: tmpl.text.fontWeight,
                  color: tmpl.text.color,
                }}
              >
                {tmpl.text.content}
              </div>
            </button>
          ))}
        </div>
      )}
      {tab === 'transitions' && <TransitionPicker />}
      {tab === 'stems' && <StemImporter />}
    </div>
  );
}
