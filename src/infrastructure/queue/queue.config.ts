import BullQueue, { QueueOptions } from 'bull';
import { REDIS_CONFIG } from '../../shared/config';

/**
 * Create queue using Redis URI directly
 * This works well with Bull's connection management
 */
export function createQueueWithURI<T = unknown>(queueName: string, options?: QueueOptions): BullQueue.Queue<T> {
  const queueOptions: QueueOptions = {
    defaultJobOptions: {
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds
      },
    },
    ...options,
  };

  // Use type assertion to ensure proper typing with Bull's Queue constructor
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const queue = new BullQueue<T>(queueName, REDIS_CONFIG.URI, queueOptions) as BullQueue.Queue<T>;
  return queue;
}
