let nextId = 1;
function uid() {
  return `id_${nextId++}_${Date.now().toString(36)}`;
}

export default class TimelineEngine {
  constructor() {
    this.tracks = [];
    this.currentTime = 0;
    this.playing = false;
    this.speed = 1;
    this.duration = 0;
    this.projectSettings = {
      width: 1920,
      height: 1080,
      fps: 30,
      aspectRatio: '16:9',
    };
    this._listeners = {};
  }

  // ─── Event emitter ───

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((f) => f !== fn);
  }

  emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((fn) => fn(data));
    }
  }

  // ─── Serialization ───

  getState() {
    return {
      tracks: this.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => ({ ...c })),
      })),
      currentTime: this.currentTime,
      playing: this.playing,
      speed: this.speed,
      duration: this.duration,
      projectSettings: { ...this.projectSettings },
    };
  }

  toJSON() {
    return this.getState();
  }

  loadProject(data) {
    if (data.tracks) this.tracks = data.tracks;
    if (data.currentTime != null) this.currentTime = data.currentTime;
    if (data.speed != null) this.speed = data.speed;
    if (data.duration != null) this.duration = data.duration;
    if (data.projectSettings) {
      this.projectSettings = { ...this.projectSettings, ...data.projectSettings };
    }
    this._recalcDuration();
    this.emit('projectLoaded', this.getState());
    this.emit('tracksChanged', this.tracks);
  }

  // ─── Track management ───

  addTrack(type = 'video', name) {
    const track = {
      id: uid(),
      type,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${this.tracks.length + 1}`,
      clips: [],
      locked: false,
      visible: true,
      muted: false,
      solo: false,
    };
    this.tracks.push(track);
    this.emit('tracksChanged', this.tracks);
    return track;
  }

  removeTrack(trackId) {
    this.tracks = this.tracks.filter((t) => t.id !== trackId);
    this._recalcDuration();
    this.emit('tracksChanged', this.tracks);
  }

  reorderTrack(trackId, newIndex) {
    const idx = this.tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return;
    const [track] = this.tracks.splice(idx, 1);
    this.tracks.splice(Math.max(0, Math.min(newIndex, this.tracks.length)), 0, track);
    this.emit('tracksChanged', this.tracks);
  }

  lockTrack(trackId, locked) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.locked = locked;
      this.emit('tracksChanged', this.tracks);
    }
  }

  setTrackVisibility(trackId, visible) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.visible = visible;
      this.emit('tracksChanged', this.tracks);
    }
  }

  muteTrack(trackId, muted) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.muted = muted;
      this.emit('tracksChanged', this.tracks);
    }
  }

  soloTrack(trackId, solo) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.solo = solo;
      this.emit('tracksChanged', this.tracks);
    }
  }

  getTrack(trackId) {
    return this.tracks.find((t) => t.id === trackId) || null;
  }

  // ─── Helpers ───

  _recalcDuration() {
    let max = 0;
    for (const track of this.tracks) {
      for (const clip of track.clips) {
        const end = clip.startTime + clip.duration;
        if (end > max) max = end;
      }
    }
    this.duration = max;
  }

  getAllClips() {
    const all = [];
    for (const track of this.tracks) {
      for (const clip of track.clips) {
        all.push({ ...clip, trackId: track.id });
      }
    }
    return all;
  }

  getVisibleClipsAtTime(time) {
    const visible = [];
    for (const track of this.tracks) {
      if (!track.visible) continue;
      for (const clip of track.clips) {
        if (time >= clip.startTime && time < clip.startTime + clip.duration) {
          visible.push({ ...clip, trackId: track.id, trackType: track.type });
        }
      }
    }
    return visible;
  }
}
