const MAX_HISTORY = 100;

export default class UndoManager {
  constructor(engine) {
    this.engine = engine;
    this.undoStack = [];
    this.redoStack = [];
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }

    this.engine.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  undo() {
    if (!this.canUndo()) return;
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);

    this.engine.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  redo() {
    if (!this.canRedo()) return;
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);

    this.engine.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.engine.emit('historyChanged', { canUndo: false, canRedo: false });
  }
}

// ─── Command implementations ───

export class AddClipCommand {
  constructor(clipManager, trackId, clipData) {
    this.clipManager = clipManager;
    this.trackId = trackId;
    this.clipData = clipData;
    this.addedClip = null;
    this.description = `Add clip "${clipData.name || 'Untitled'}"`;
  }

  execute() {
    this.addedClip = this.clipManager.addClip(this.trackId, this.clipData);
  }

  undo() {
    if (this.addedClip) {
      this.clipManager.removeClip(this.addedClip.id);
    }
  }
}

export class RemoveClipCommand {
  constructor(clipManager, clipId) {
    this.clipManager = clipManager;
    this.clipId = clipId;
    this.removedClip = null;
    this.trackId = null;
    this.description = 'Remove clip';
  }

  execute() {
    // Find track before removing
    for (const track of this.clipManager.engine.tracks) {
      if (track.clips.find((c) => c.id === this.clipId)) {
        this.trackId = track.id;
        break;
      }
    }
    this.removedClip = this.clipManager.removeClip(this.clipId);
  }

  undo() {
    if (this.removedClip && this.trackId) {
      this.clipManager.addClip(this.trackId, {
        ...this.removedClip,
      });
    }
  }
}

export class MoveClipCommand {
  constructor(clipManager, clipId, newTrackId, newStartTime) {
    this.clipManager = clipManager;
    this.clipId = clipId;
    this.newTrackId = newTrackId;
    this.newStartTime = newStartTime;
    this.oldTrackId = null;
    this.oldStartTime = null;
    this.description = 'Move clip';
  }

  execute() {
    // Save old position
    for (const track of this.clipManager.engine.tracks) {
      const clip = track.clips.find((c) => c.id === this.clipId);
      if (clip) {
        this.oldTrackId = track.id;
        this.oldStartTime = clip.startTime;
        break;
      }
    }
    this.clipManager.moveClip(this.clipId, this.newTrackId, this.newStartTime);
  }

  undo() {
    if (this.oldTrackId != null && this.oldStartTime != null) {
      this.clipManager.moveClip(this.clipId, this.oldTrackId, this.oldStartTime);
    }
  }
}

export class TrimClipCommand {
  constructor(clipManager, clipId, side, newTime) {
    this.clipManager = clipManager;
    this.clipId = clipId;
    this.side = side;
    this.newTime = newTime;
    this.oldStartTime = null;
    this.oldDuration = null;
    this.oldSourceStart = null;
    this.description = `Trim clip ${side}`;
  }

  execute() {
    const clip = this.clipManager.getClipById(this.clipId);
    if (clip) {
      this.oldStartTime = clip.startTime;
      this.oldDuration = clip.duration;
      this.oldSourceStart = clip.sourceStart;
    }
    this.clipManager.trimClip(this.clipId, this.side, this.newTime);
  }

  undo() {
    const clip = this.clipManager.getClipById(this.clipId);
    if (clip && this.oldStartTime != null) {
      clip.startTime = this.oldStartTime;
      clip.duration = this.oldDuration;
      clip.sourceStart = this.oldSourceStart;
      this.clipManager.engine._recalcDuration();
      this.clipManager._emitForClip(this.clipId);
    }
  }
}

export class UpdatePropertyCommand {
  constructor(clipManager, clipId, property, newValue) {
    this.clipManager = clipManager;
    this.clipId = clipId;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = null;
    this.description = `Update ${property}`;
  }

  execute() {
    const clip = this.clipManager.getClipById(this.clipId);
    if (!clip) return;
    this.oldValue = clip[this.property];
    clip[this.property] = this.newValue;
    this.clipManager._emitForClip(this.clipId);
  }

  undo() {
    const clip = this.clipManager.getClipById(this.clipId);
    if (!clip) return;
    clip[this.property] = this.oldValue;
    this.clipManager._emitForClip(this.clipId);
  }
}

export class DuplicateClipCommand {
  constructor(clipManager, clipId) {
    this.clipManager = clipManager;
    this.clipId = clipId;
    this.newClipId = null;
    this.description = 'Duplicate clip';
  }

  execute() {
    const result = this.clipManager.duplicateClip(this.clipId);
    if (result) this.newClipId = result.id;
  }

  undo() {
    if (this.newClipId) {
      this.clipManager.removeClip(this.newClipId);
    }
  }
}

export class SplitClipCommand {
  constructor(clipManager, clipId, atTime) {
    this.clipManager = clipManager;
    this.clipId = clipId;
    this.atTime = atTime;
    this.originalDuration = null;
    this.secondClipId = null;
    this.description = 'Split clip';
  }

  execute() {
    const clip = this.clipManager.getClipById(this.clipId);
    if (clip) this.originalDuration = clip.duration;
    const result = this.clipManager.splitClip(this.clipId, this.atTime);
    if (result) {
      this.secondClipId = result[1].id;
    }
  }

  undo() {
    // Remove second clip and restore original duration
    if (this.secondClipId) {
      this.clipManager.removeClip(this.secondClipId);
    }
    const clip = this.clipManager.getClipById(this.clipId);
    if (clip && this.originalDuration != null) {
      clip.duration = this.originalDuration;
      this.clipManager.engine._recalcDuration();
      this.clipManager._emitForClip(this.clipId);
    }
  }
}
