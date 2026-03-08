export default class SnapEngine {
  constructor(engine) {
    this.engine = engine;
    this.enabled = true;
    this.snapThreshold = 10; // pixels
  }

  getSnapPoints(excludeClipId) {
    const points = [];

    // Playhead position
    points.push({ time: this.engine.currentTime, type: 'playhead' });

    // Start of timeline
    points.push({ time: 0, type: 'start' });

    // All clip edges
    for (const track of this.engine.tracks) {
      for (const clip of track.clips) {
        if (clip.id === excludeClipId) continue;
        points.push({ time: clip.startTime, type: 'clip-start', clipId: clip.id });
        points.push({ time: clip.startTime + clip.duration, type: 'clip-end', clipId: clip.id });
      }
    }

    return points;
  }

  snap(proposedTime, pixelsPerSecond) {
    if (!this.enabled) return { time: proposedTime, snapped: false };

    const points = this.getSnapPoints();
    const thresholdInSeconds = this.snapThreshold / pixelsPerSecond;

    let closest = null;
    let closestDist = Infinity;

    for (const point of points) {
      const dist = Math.abs(proposedTime - point.time);
      if (dist < thresholdInSeconds && dist < closestDist) {
        closest = point;
        closestDist = dist;
      }
    }

    if (closest) {
      return {
        time: closest.time,
        snapped: true,
        snapPoint: closest,
      };
    }

    return { time: proposedTime, snapped: false };
  }

  snapClipMove(clipId, proposedStart, proposedDuration, pixelsPerSecond) {
    if (!this.enabled) return { startTime: proposedStart, snapped: false };

    const points = this.getSnapPoints(clipId);
    const thresholdInSeconds = this.snapThreshold / pixelsPerSecond;
    const proposedEnd = proposedStart + proposedDuration;

    let bestSnap = null;
    let bestDist = Infinity;

    for (const point of points) {
      // Snap start edge
      const startDist = Math.abs(proposedStart - point.time);
      if (startDist < thresholdInSeconds && startDist < bestDist) {
        bestSnap = { startTime: point.time, edge: 'start', snapPoint: point };
        bestDist = startDist;
      }

      // Snap end edge
      const endDist = Math.abs(proposedEnd - point.time);
      if (endDist < thresholdInSeconds && endDist < bestDist) {
        bestSnap = { startTime: point.time - proposedDuration, edge: 'end', snapPoint: point };
        bestDist = endDist;
      }
    }

    if (bestSnap) {
      return { startTime: bestSnap.startTime, snapped: true, ...bestSnap };
    }

    return { startTime: proposedStart, snapped: false };
  }
}
