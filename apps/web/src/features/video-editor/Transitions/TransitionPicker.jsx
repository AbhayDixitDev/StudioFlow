import { getAllTransitions, getTransitionCategories, getTransitionsByCategory } from '../engine/transitions.js';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';

const CATEGORY_LABELS = {
  fade: 'Fade',
  slide: 'Slide',
  wipe: 'Wipe',
  zoom: 'Zoom',
};

export default function TransitionPicker() {
  const selectedClipIds = useVideoEditorStore((s) => s.selectedClipIds);
  const updateClipProperty = useVideoEditorStore((s) => s.updateClipProperty);
  const tracks = useVideoEditorStore((s) => s.tracks);

  // Find selected clip's current transition
  let selectedClip = null;
  if (selectedClipIds.length === 1) {
    for (const t of tracks) {
      selectedClip = t.clips.find((c) => c.id === selectedClipIds[0]);
      if (selectedClip) break;
    }
  }

  const currentTransition = selectedClip?.transition;
  const categories = getTransitionCategories();

  function applyTransition(transitionId) {
    if (!selectedClip) return;
    updateClipProperty(selectedClip.id, 'transition', {
      type: transitionId,
      duration: currentTransition?.duration || 1,
    });
  }

  function removeTransition() {
    if (!selectedClip) return;
    updateClipProperty(selectedClip.id, 'transition', null);
  }

  function setDuration(duration) {
    if (!selectedClip || !currentTransition) return;
    updateClipProperty(selectedClip.id, 'transition', {
      ...currentTransition,
      duration: Math.max(0.1, Math.min(5, duration)),
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-3">
      {!selectedClip ? (
        <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center py-4">
          Select a clip to apply a transition
        </div>
      ) : (
        <>
          {/* Current transition */}
          {currentTransition && (
            <div className="rounded border border-violet-300 dark:border-violet-700 p-2 bg-violet-50 dark:bg-violet-900/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                  Active: {getAllTransitions().find((t) => t.id === currentTransition.type)?.name || currentTransition.type}
                </span>
                <button
                  onClick={removeTransition}
                  className="text-[8px] text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-gray-500 dark:text-gray-400">Duration</label>
                <input
                  type="number"
                  value={currentTransition.duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                  step={0.1}
                  min={0.1}
                  max={5}
                  className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-800 dark:text-gray-200"
                />
                <span className="text-[9px] text-gray-400">sec</span>
              </div>
            </div>
          )}

          {/* None option */}
          <button
            onClick={removeTransition}
            className={`w-full text-left rounded border p-1.5 text-[10px] transition-colors ${
              !currentTransition
                ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            None (Cut)
          </button>

          {/* Transitions by category */}
          {categories.map((cat) => (
            <div key={cat}>
              <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {CATEGORY_LABELS[cat] || cat}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {getTransitionsByCategory(cat).map((tr) => {
                  const active = currentTransition?.type === tr.id;
                  return (
                    <button
                      key={tr.id}
                      onClick={() => applyTransition(tr.id)}
                      className={`rounded border p-1.5 text-left transition-colors ${
                        active
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
                      }`}
                    >
                      {/* Mini preview bar */}
                      <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex mb-1">
                        <TransitionPreview type={tr.id} />
                      </div>
                      <span className={`text-[9px] font-medium ${active ? 'text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'}`}>
                        {tr.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function TransitionPreview({ type }) {
  // Simple visual indicator of transition type
  const styles = {
    crossfade: (
      <>
        <div className="flex-1 bg-blue-400" style={{ opacity: 0.7 }} />
        <div className="flex-1 bg-green-400" style={{ opacity: 0.7 }} />
      </>
    ),
    slideLeft: (
      <>
        <div className="w-1/3 bg-blue-400" />
        <div className="flex-1 bg-green-400 -ml-1" />
      </>
    ),
    slideRight: (
      <>
        <div className="flex-1 bg-blue-400 -mr-1" />
        <div className="w-1/3 bg-green-400" />
      </>
    ),
    slideUp: (
      <div className="w-full h-full relative">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-blue-400" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-green-400" />
      </div>
    ),
    slideDown: (
      <div className="w-full h-full relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-blue-400" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-green-400" />
      </div>
    ),
    wipeHorizontal: (
      <>
        <div className="w-2/3 bg-green-400" />
        <div className="flex-1 bg-blue-400" />
      </>
    ),
    wipeVertical: (
      <div className="w-full h-full relative">
        <div className="absolute inset-x-0 top-0 h-2/3 bg-green-400" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-400" />
      </div>
    ),
    wipeDiagonal: (
      <div className="w-full h-full bg-blue-400 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-green-400" style={{ clipPath: 'polygon(0 0, 70% 0, 0 70%)' }} />
      </div>
    ),
    zoomIn: (
      <div className="w-full h-full bg-green-400 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-blue-400 rounded-sm" />
      </div>
    ),
    zoomOut: (
      <div className="w-full h-full bg-blue-400 flex items-center justify-center">
        <div className="w-1/3 h-1/3 bg-green-400 rounded-sm" />
      </div>
    ),
  };

  return styles[type] || <div className="flex-1 bg-gray-300 dark:bg-gray-600" />;
}
