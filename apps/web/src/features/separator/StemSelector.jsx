import { useState } from 'react';

const MODELS = [
  {
    id: 'htdemucs',
    name: 'HTDemucs',
    stemCount: 4,
    stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    description: 'Best vocal quality. Recommended for most songs.',
    speed: 'Fast',
    icon: '4',
    badge: 'Recommended',
  },
  {
    id: 'htdemucs_6s',
    name: 'HTDemucs 6-Stem',
    stemCount: 6,
    stems: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'],
    description: 'Splits guitar & piano separately. Vocals less clean.',
    speed: 'Medium',
    icon: '6',
    badge: null,
  },
  {
    id: 'mdx_extra',
    name: 'MDX-Net Extra',
    stemCount: 4,
    stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    description: 'Alternative architecture. Very slow on CPU.',
    speed: 'Slow',
    icon: '4',
    badge: null,
  },
];

const STEM_COLORS = {
  Vocals: 'bg-purple-500',
  Drums: 'bg-orange-500',
  Bass: 'bg-blue-500',
  Guitar: 'bg-green-500',
  Piano: 'bg-pink-500',
  Other: 'bg-gray-500',
};

export default function StemSelector({ value = 'htdemucs', onChange }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Separation Model
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODELS.map((model) => {
          const selected = value === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onChange?.(model.id)}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                selected
                  ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-500/10'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }`}
            >
              {/* Badge */}
              {model.badge && (
                <span className="absolute -top-2 left-3 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {model.badge}
                </span>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {model.name}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                    selected ? 'bg-violet-500' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                >
                  {model.icon}
                </span>
              </div>

              {/* Description + speed */}
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                {model.description}
              </p>
              <p className={`mb-3 text-[10px] font-medium ${
                model.speed === 'Fast' ? 'text-green-600 dark:text-green-400' :
                model.speed === 'Slow' ? 'text-red-500 dark:text-red-400' :
                'text-yellow-600 dark:text-yellow-400'
              }`}>
                Speed: {model.speed}
              </p>

              {/* Stem pills */}
              <div className="flex flex-wrap gap-1">
                {model.stems.map((stem) => (
                  <span
                    key={stem}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${STEM_COLORS[stem]}`}
                  >
                    {stem}
                  </span>
                ))}
              </div>

              {/* Selection indicator */}
              {selected && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
