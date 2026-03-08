/**
 * Project starter templates (Phase 189).
 */
const projectTemplates = [
  {
    id: 'blank-landscape',
    name: 'Blank (16:9)',
    description: 'Empty landscape project',
    icon: 'monitor',
    settings: { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9' },
    tracks: [],
  },
  {
    id: 'blank-portrait',
    name: 'Blank (9:16)',
    description: 'Empty portrait project for Reels/TikTok',
    icon: 'smartphone',
    settings: { width: 1080, height: 1920, fps: 30, aspectRatio: '9:16' },
    tracks: [],
  },
  {
    id: 'blank-square',
    name: 'Blank (1:1)',
    description: 'Empty square project for Instagram',
    icon: 'square',
    settings: { width: 1080, height: 1080, fps: 30, aspectRatio: '1:1' },
    tracks: [],
  },
  {
    id: 'vlog',
    name: 'Vlog',
    description: 'Video track + music + title overlay',
    icon: 'video',
    settings: { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9' },
    tracks: [
      { type: 'video', name: 'Main Video', clips: [] },
      { type: 'audio', name: 'Background Music', clips: [] },
      { type: 'text', name: 'Titles', clips: [] },
    ],
  },
  {
    id: 'slideshow',
    name: 'Slideshow',
    description: 'Image track with music',
    icon: 'image',
    settings: { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9' },
    tracks: [
      { type: 'video', name: 'Photos', clips: [] },
      { type: 'audio', name: 'Music', clips: [] },
      { type: 'text', name: 'Captions', clips: [] },
    ],
  },
  {
    id: 'social-reel',
    name: 'Social Reel',
    description: 'Vertical video for Instagram/TikTok',
    icon: 'smartphone',
    settings: { width: 1080, height: 1920, fps: 30, aspectRatio: '9:16' },
    tracks: [
      { type: 'video', name: 'Main', clips: [] },
      { type: 'text', name: 'Text', clips: [] },
      { type: 'audio', name: 'Audio', clips: [] },
    ],
  },
];

export default projectTemplates;
