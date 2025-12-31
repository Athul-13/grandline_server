import { Job } from 'bull';
import { createQueueWithURI } from './queue.config';

/**
 * Job data type for driver cooldown queue
 */
export interface DriverCooldownJobData {
  jobType: 'driver-cooldown';
  driverId: string;
  reservationId: string; // The reservation that just ended
}

/**
 * Driver Cooldown Queue
 * Handles scheduling driver status changes after trip completion
 */
export const driverCooldownQueue = createQueueWithURI<DriverCooldownJobData>('driver-cooldown', {
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, then 4s, 8s
    },
    timeout: 30000, // 30 seconds timeout per job
  },
});

// Set up queue event listeners for monitoring
driverCooldownQueue.on('error', (error: Error) => {
  console.error('Driver cooldown queue error:', error);
});

driverCooldownQueue.on('waiting', (jobId: string | number) => {
  console.log(`Driver cooldown job ${jobId} is waiting`);
});

driverCooldownQueue.on('active', (job: Job<DriverCooldownJobData>) => {
  console.log(`Processing driver cooldown job ${job.id} - Driver: ${job.data.driverId}`);
});

driverCooldownQueue.on('completed', (job: Job<DriverCooldownJobData>) => {
  console.log(`Driver cooldown job ${job.id} completed - Driver: ${job.data.driverId}`);
});

driverCooldownQueue.on('failed', (job: Job<DriverCooldownJobData> | undefined, err: Error) => {
  console.error(`Driver cooldown job ${job?.id} failed - Driver: ${job?.data.driverId}`, err);
});

driverCooldownQueue.on('stalled', (job: Job<DriverCooldownJobData>) => {
  console.warn(`Driver cooldown job ${job.id} stalled - Driver: ${job.data.driverId}`);
});

