import { Job } from 'bull';
import { createQueueWithURI } from './queue.config';

/**
 * Job data types for driver assignment queue
 */
export interface AssignDriverJobData {
  jobType: 'assign-driver';
  quoteId: string;
}

export interface ProcessPendingQuotesJobData {
  jobType: 'process-pending-quotes';
}

export type DriverAssignmentJobData = AssignDriverJobData | ProcessPendingQuotesJobData;

/**
 * Driver Assignment Queue
 * Handles automatic driver assignment jobs
 */
export const driverAssignmentQueue = createQueueWithURI<DriverAssignmentJobData>('driver-assignment', {
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
driverAssignmentQueue.on('error', (error: Error) => {
  console.error('Driver assignment queue error:', error);
});

driverAssignmentQueue.on('waiting', (jobId: string | number) => {
  console.log(`Driver assignment job ${jobId} is waiting`);
});

driverAssignmentQueue.on('active', (job: Job<DriverAssignmentJobData>) => {
  console.log(`Processing driver assignment job ${job.id} - Type: ${job.data.jobType}`);
});

driverAssignmentQueue.on('completed', (job: Job<DriverAssignmentJobData>) => {
  console.log(`Driver assignment job ${job.id} completed - Type: ${job.data.jobType}`);
});

driverAssignmentQueue.on('failed', (job: Job<DriverAssignmentJobData> | undefined, err: Error) => {
  console.error(`Driver assignment job ${job?.id} failed - Type: ${job?.data.jobType}`, err);
});

driverAssignmentQueue.on('stalled', (job: Job<DriverAssignmentJobData>) => {
  console.warn(`Driver assignment job ${job.id} stalled - Type: ${job.data.jobType}`);
});
