import { createQueueWithURI } from './queue.config';

/**
 * Job data type for trip auto-complete queue
 */
export interface TripAutoCompleteJobData {
  reservationId: string;
}

/**
 * Trip Auto-Complete Queue
 * Handles automatic trip completion after grace period (tripEndAt + 24 hours)
 */
export const tripAutoCompleteQueue = createQueueWithURI<TripAutoCompleteJobData>('trip-auto-complete', {
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    attempts: 1, // Only attempt once - idempotent check handles edge cases
    timeout: 10000, // 10 seconds timeout
  },
});

// Set up queue event listeners for monitoring
tripAutoCompleteQueue.on('error', (error: Error) => {
  console.error('Trip auto-complete queue error:', error);
});

tripAutoCompleteQueue.on('waiting', (jobId: string | number) => {
  console.log(`Trip auto-complete job ${jobId} is waiting`);
});

tripAutoCompleteQueue.on('active', (job: import('bull').Job<TripAutoCompleteJobData>) => {
  console.log(`Processing trip auto-complete job ${job.id} for reservation: ${job.data.reservationId}`);
});

tripAutoCompleteQueue.on('completed', (job: import('bull').Job<TripAutoCompleteJobData>) => {
  console.log(`Trip auto-complete job ${job.id} completed for reservation: ${job.data.reservationId}`);
});

tripAutoCompleteQueue.on('failed', (job: import('bull').Job<TripAutoCompleteJobData> | undefined, err: Error) => {
  console.error(`Trip auto-complete job ${job?.id} failed for reservation: ${job?.data.reservationId}`, err);
});

tripAutoCompleteQueue.on('stalled', (job: import('bull').Job<TripAutoCompleteJobData>) => {
  console.warn(`Trip auto-complete job ${job.id} stalled for reservation: ${job.data.reservationId}`);
});

