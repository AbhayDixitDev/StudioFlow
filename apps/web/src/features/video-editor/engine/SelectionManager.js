export default class SelectionManager {
  constructor(engine) {
    this.engine = engine;
    this.selectedClipIds = new Set();
    this.selectedTrackId = null;
  }

  selectClip(clipId, addToSelection = false) {
    if (!addToSelection) {
      this.selectedClipIds.clear();
    }
    this.selectedClipIds.add(clipId);
    this.engine.emit('selectionChanged', this.getSelection());
  }

  deselectClip(clipId) {
    this.selectedClipIds.delete(clipId);
    this.engine.emit('selectionChanged', this.getSelection());
  }

  toggleClipSelection(clipId) {
    if (this.selectedClipIds.has(clipId)) {
      this.selectedClipIds.delete(clipId);
    } else {
      this.selectedClipIds.add(clipId);
    }
    this.engine.emit('selectionChanged', this.getSelection());
  }

  selectTrack(trackId) {
    this.selectedTrackId = trackId;
    this.engine.emit('selectionChanged', this.getSelection());
  }

  clearSelection() {
    this.selectedClipIds.clear();
    this.selectedTrackId = null;
    this.engine.emit('selectionChanged', this.getSelection());
  }

  isClipSelected(clipId) {
    return this.selectedClipIds.has(clipId);
  }

  getSelectedClips() {
    return Array.from(this.selectedClipIds);
  }

  getSelection() {
    return {
      clipIds: Array.from(this.selectedClipIds),
      trackId: this.selectedTrackId,
    };
  }
}
