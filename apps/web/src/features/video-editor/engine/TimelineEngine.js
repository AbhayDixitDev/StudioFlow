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
    this.markers = [];
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
      markers: [...this.markers],
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
    if (data.markers) this.markers = data.markers;
    this._recalcDuration();
    this.emit('projectLoaded', this.getState());
    this.emit('tracksChanged', this.tracks);
  }

  // ─── Aspect ratio (Phase 186) ───

  setAspectRatio(ratio) {
    const sizes = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:3': { width: 1440, height: 1080 },
    };
    const s = sizes[ratio] || sizes['16:9'];
    this.projectSettings = { ...this.projectSettings, ...s, aspectRatio: ratio };
    this.emit('settingsChanged', this.projectSettings);
  }

  // ─── Markers (Phase 187) ───

  addMarker(time, name = '') {
    const marker = { id: uid(), time, name: name || `Marker ${this.markers.length + 1}` };
    this.markers.push(marker);
    this.markers.sort((a, b) => a.time - b.time);
    this.emit('markersChanged', this.markers);
    return marker;
  }

  removeMarker(markerId) {
    this.markers = this.markers.filter((m) => m.id !== markerId);
    this.emit('markersChanged', this.markers);
  }

  getNextMarker(afterTime) {
    return this.markers.find((m) => m.time > afterTime + 0.01) || null;
  }

  getPrevMarker(beforeTime) {
    const before = this.markers.filter((m) => m.time < beforeTime - 0.01);
    return before.length > 0 ? before[before.length - 1] : null;
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
    // Check if any audio-capable track is soloed
    const anySoloed = this.tracks.some(
      (t) => t.solo && (t.type === 'audio' || t.type === 'video')
    );

    for (const track of this.tracks) {
      if (!track.visible) continue;
      for (const clip of track.clips) {
        if (time >= clip.startTime && time < clip.startTime + clip.duration) {
          // Determine if this track's audio is muted
          const audioMuted = track.muted || (anySoloed && !track.solo);
          visible.push({
            ...clip,
            trackId: track.id,
            trackType: track.type,
            trackMuted: audioMuted,
          });
        }
      }
    }
    return visible;
  }
}
