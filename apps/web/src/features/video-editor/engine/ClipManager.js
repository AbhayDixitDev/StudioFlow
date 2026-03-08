let clipCounter = 1;
function clipId() {
  return `clip_${clipCounter++}_${Date.now().toString(36)}`;
}

export default class ClipManager {
  constructor(engine) {
    this.engine = engine;
  }

  addClip(trackId, clipData) {
    const track = this.engine.getTrack(trackId);
    if (!track) throw new Error(`Track ${trackId} not found`);
    if (track.locked) throw new Error('Track is locked');

    const clip = {
      id: clipId(),
      type: clipData.type || track.type,
      name: clipData.name || 'Untitled',
      startTime: clipData.startTime || 0,
      duration: clipData.duration || 5,
      sourceStart: clipData.sourceStart || 0,
      sourceDuration: clipData.sourceDuration || clipData.duration || 5,
      sourcePath: clipData.sourcePath || null,
      volume: clipData.volume != null ? clipData.volume : 1,
      opacity: clipData.opacity != null ? clipData.opacity : 1,
      transform: {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        ...(clipData.transform || {}),
      },
      effects: clipData.effects || [],
      transition: clipData.transition || null,
      text: clipData.text || null,
    };

    // Collision check for video tracks
    if (track.type === 'video') {
      const hasOverlap = track.clips.some((c) => {
        const cEnd = c.startTime + c.duration;
        const nEnd = clip.startTime + clip.duration;
        return clip.startTime < cEnd && nEnd > c.startTime;
      });
      if (hasOverlap) {
        // Push to end of last clip instead of rejecting
        const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
        clip.startTime = lastEnd;
      }
    }

    track.clips.push(clip);
    track.clips.sort((a, b) => a.startTime - b.startTime);
    this.engine._recalcDuration();
    this.engine.emit('clipsChanged', { trackId, clips: track.clips });
    return clip;
  }

  removeClip(clipId) {
    for (const track of this.engine.tracks) {
      const idx = track.clips.findIndex((c) => c.id === clipId);
      if (idx !== -1) {
        const [removed] = track.clips.splice(idx, 1);
        this.engine._recalcDuration();
        this.engine.emit('clipsChanged', { trackId: track.id, clips: track.clips });
        return removed;
      }
    }
    return null;
  }

  moveClip(clipId, newTrackId, newStartTime) {
    let clip = null;
    let sourceTrack = null;

    for (const track of this.engine.tracks) {
      const idx = track.clips.findIndex((c) => c.id === clipId);
      if (idx !== -1) {
        [clip] = track.clips.splice(idx, 1);
        sourceTrack = track;
        break;
      }
    }

    if (!clip) return null;

    const targetTrack = this.engine.getTrack(newTrackId);
    if (!targetTrack || targetTrack.locked) {
      // Put back in source
      sourceTrack.clips.push(clip);
      sourceTrack.clips.sort((a, b) => a.startTime - b.startTime);
      return null;
    }

    clip.startTime = Math.max(0, newStartTime);
    targetTrack.clips.push(clip);
    targetTrack.clips.sort((a, b) => a.startTime - b.startTime);

    this.engine._recalcDuration();
    if (sourceTrack.id !== targetTrack.id) {
      this.engine.emit('clipsChanged', { trackId: sourceTrack.id, clips: sourceTrack.clips });
    }
    this.engine.emit('clipsChanged', { trackId: targetTrack.id, clips: targetTrack.clips });
    return clip;
  }

  trimClip(clipId, side, newTime) {
    const clip = this.getClipById(clipId);
    if (!clip) return null;

    if (side === 'start') {
      const oldStart = clip.startTime;
      clip.startTime = Math.max(0, newTime);
      const delta = clip.startTime - oldStart;
      clip.duration -= delta;
      clip.sourceStart += delta;
    } else {
      clip.duration = Math.max(0.1, newTime - clip.startTime);
    }

    this.engine._recalcDuration();
    this._emitForClip(clipId);
    return clip;
  }

  splitClip(clipId, atTime) {
    const clip = this.getClipById(clipId);
    if (!clip) return null;

    const splitPoint = atTime - clip.startTime;
    if (splitPoint <= 0 || splitPoint >= clip.duration) return null;

    // Find track
    let track = null;
    for (const t of this.engine.tracks) {
      if (t.clips.find((c) => c.id === clipId)) {
        track = t;
        break;
      }
    }
    if (!track) return null;

    // Create second half
    const secondClip = {
      ...clip,
      id: clipId + '_split',
      startTime: atTime,
      duration: clip.duration - splitPoint,
      sourceStart: clip.sourceStart + splitPoint,
      name: clip.name + ' (2)',
    };
    // Fix id to be unique
    secondClip.id = `clip_${clipCounter++}_${Date.now().toString(36)}`;

    // Trim first half
    clip.duration = splitPoint;

    track.clips.push(secondClip);
    track.clips.sort((a, b) => a.startTime - b.startTime);

    this.engine._recalcDuration();
    this.engine.emit('clipsChanged', { trackId: track.id, clips: track.clips });
    return [clip, secondClip];
  }

  duplicateClip(clipId) {
    const clip = this.getClipById(clipId);
    if (!clip) return null;

    let track = null;
    for (const t of this.engine.tracks) {
      if (t.clips.find((c) => c.id === clipId)) {
        track = t;
        break;
      }
    }
    if (!track) return null;

    const newClip = {
      ...clip,
      id: `clip_${clipCounter++}_${Date.now().toString(36)}`,
      startTime: clip.startTime + clip.duration,
      name: clip.name + ' (copy)',
      effects: [...clip.effects],
      transform: { ...clip.transform },
    };

    track.clips.push(newClip);
    track.clips.sort((a, b) => a.startTime - b.startTime);

    this.engine._recalcDuration();
    this.engine.emit('clipsChanged', { trackId: track.id, clips: track.clips });
    return newClip;
  }

  getClipById(clipId) {
    for (const track of this.engine.tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }

  _emitForClip(clipId) {
    for (const track of this.engine.tracks) {
      if (track.clips.find((c) => c.id === clipId)) {
        this.engine.emit('clipsChanged', { trackId: track.id, clips: track.clips });
        return;
      }
    }
  }
}
