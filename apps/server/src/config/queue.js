import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env.js';

let connection = null;
let redisAvailable = null;

export async function checkRedisAvailable() {
  if (redisAvailable !== null) return redisAvailable;
  try {
    const test = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
      connectTimeout: 3000,
      showFriendlyErrorStack: false,
    });
    test.on('error', () => {});
    await test.connect();
    await test.ping();
    test.disconnect();
    redisAvailable = true;
  } catch {
    redisAvailable = false;
  }
  return redisAvailable;
}

export function getRedisConnection() {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export const QUEUE_NAMES = {
  separation: 'audio-separation',
  processing: 'audio-processing',
  videoExport: 'video-export',
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

// ---------------------------------------------------------------------------
// In-memory queue fallback (used when Redis is not available)
// ---------------------------------------------------------------------------

const inMemoryProcessors = new Map();

class InMemoryJob {
  constructor(id, name, data) {
    this.id = id;
    this.name = name;
    this.data = data;
    this.progress = 0;
  }

  async updateProgress(pct) {
    this.progress = pct;
  }
}

class InMemoryQueue {
  constructor(name) {
    this.name = name;
  }

  async add(jobName, data) {
    const id = `${this.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job = new InMemoryJob(id, jobName, data);

    const entry = inMemoryProcessors.get(this.name);
    if (entry) {
      // Process asynchronously so the caller (API response) isn't blocked
      setImmediate(async () => {
        try {
          const result = await entry.processor(job);
          for (const fn of entry.onCompleted) fn(job, result);
        } catch (err) {
          for (const fn of entry.onFailed) fn(job, err);
        }
      });
    }

    return job;
  }
}

export class InMemoryWorker {
  constructor(queueName, processor) {
    inMemoryProcessors.set(queueName, {
      processor,
      onCompleted: [],
      onFailed: [],
    });
    this._queueName = queueName;
  }

  on(event, handler) {
    const entry = inMemoryProcessors.get(this._queueName);
    if (!entry) return this;
    if (event === 'completed') entry.onCompleted.push(handler);
    if (event === 'failed') entry.onFailed.push(handler);
    return this;
  }

  async close() {
    inMemoryProcessors.delete(this._queueName);
  }
}

// ---------------------------------------------------------------------------
// Queue getters — return BullMQ or in-memory depending on Redis availability
// ---------------------------------------------------------------------------

let separationQueue = null;
let processingQueue = null;
let videoExportQueue = null;

function makeQueue(name, timeout) {
  if (redisAvailable) {
    return new Queue(name, {
      connection: getRedisConnection(),
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, timeout },
    });
  }
  return new InMemoryQueue(name);
}

export function getSeparationQueue() {
  if (!separationQueue) {
    separationQueue = makeQueue(QUEUE_NAMES.separation, 30 * 60 * 1000);
  }
  return separationQueue;
}

export function getProcessingQueue() {
  if (!processingQueue) {
    processingQueue = makeQueue(QUEUE_NAMES.processing, 10 * 60 * 1000);
  }
  return processingQueue;
}

export function getVideoExportQueue() {
  if (!videoExportQueue) {
    videoExportQueue = makeQueue(QUEUE_NAMES.videoExport, 60 * 60 * 1000);
  }
  return videoExportQueue;
}
