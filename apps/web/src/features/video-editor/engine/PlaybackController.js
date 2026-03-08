import { AudioPlaybackManager } from './AudioEngine.js';

export default class PlaybackController {
  constructor(engine) {
    this.engine = engine;
    this._rafId = null;
    this._lastTimestamp = null;
    this._audioManager = new AudioPlaybackManager();
  }

  play() {
    if (this.engine.playing) return;
    this.engine.playing = true;
    this._lastTimestamp = null;
    this._rafId = requestAnimationFrame(this._tick.bind(this));
    this._startAudio();
    this.engine.emit('play');
  }

  pause() {
    if (!this.engine.playing) return;
    this.engine.playing = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._audioManager.stop();
    this.engine.emit('pause');
  }

  togglePlayPause() {
    if (this.engine.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time) {
    this.engine.currentTime = Math.max(0, Math.min(time, this.engine.duration || Infinity));
    this.engine.emit('seek', this.engine.currentTime);
    this.engine.emit('timeupdate', this.engine.currentTime);
    // Restart audio at new position if playing
    if (this.engine.playing) {
      this._startAudio();
    }
  }

  setSpeed(speed) {
    this.engine.speed = Math.max(0.25, Math.min(4, speed));
    this.engine.emit('speedChanged', this.engine.speed);
  }

  skipToStart() {
    this.seek(0);
  }

  skipToEnd() {
    this.seek(this.engine.duration);
  }

  stepFrame(direction = 1) {
    const fps = this.engine.projectSettings.fps || 30;
    const frameDuration = 1 / fps;
    this.seek(this.engine.currentTime + frameDuration * direction);
  }

  _tick(timestamp) {
    if (!this.engine.playing) return;

    if (this._lastTimestamp !== null) {
      const delta = (timestamp - this._lastTimestamp) / 1000;
      this.engine.currentTime += delta * this.engine.speed;

      // Stop at end
      if (this.engine.duration > 0 && this.engine.currentTime >= this.engine.duration) {
        this.engine.currentTime = this.engine.duration;
        this.engine.emit('timeupdate', this.engine.currentTime);
        this.pause();
        return;
      }

      this.engine.emit('timeupdate', this.engine.currentTime);
    }

    this._lastTimestamp = timestamp;
    this._rafId = requestAnimationFrame(this._tick.bind(this));
  }

  /**
   * Gather audio-only clips and start playback.
   * Video clip audio is handled by the <video> elements in VideoPreview.
   */
  _startAudio() {
    const clips = [];
    const anySoloed = this.engine.tracks.some(
      (t) => t.solo && (t.type === 'audio' || t.type === 'video')
    );

    for (const track of this.engine.tracks) {
      // Only handle audio-only tracks here; video audio is handled by video elements
      if (track.type !== 'audio') continue;
      if (track.muted) continue;
      if (anySoloed && !track.solo) continue;

      for (const clip of track.clips) {
        clips.push({
          sourcePath: clip.sourcePath,
          startTime: clip.startTime,
          duration: clip.duration,
          volume: clip.volume != null ? clip.volume : 1,
          fadeIn: clip.fadeIn || 0,
          fadeOut: clip.fadeOut || 0,
          muted: false,
        });
      }
    }
    this._audioManager.play(clips, this.engine.currentTime);
  }

  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._audioManager.destroy();
  }
}
