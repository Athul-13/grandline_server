import { createQueueWithURI } from './queue.config';

/**
 * Job data type for quote expiry queue
 */
export interface QuoteExpiryJobData {
  quoteId: string;
}

/**
 * Quote Expiry Queue
 * Handles automatic quote expiry after 24-hour payment window
 */
export const quoteExpiryQueue = createQueueWithURI<QuoteExpiryJobData>('quote-expiry', {
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
quoteExpiryQueue.on('error', (error: Error) => {
  console.error('Quote expiry queue error:', error);
});

quoteExpiryQueue.on('waiting', (jobId: string | number) => {
  console.log(`Quote expiry job ${jobId} is waiting`);
});

quoteExpiryQueue.on('active', (job: import('bull').Job<QuoteExpiryJobData>) => {
  console.log(`Processing quote expiry job ${job.id} for quote: ${job.data.quoteId}`);
});

quoteExpiryQueue.on('completed', (job: import('bull').Job<QuoteExpiryJobData>) => {
  console.log(`Quote expiry job ${job.id} completed for quote: ${job.data.quoteId}`);
});

quoteExpiryQueue.on('failed', (job: import('bull').Job<QuoteExpiryJobData> | undefined, err: Error) => {
  console.error(`Quote expiry job ${job?.id} failed for quote: ${job?.data.quoteId}`, err);
});

quoteExpiryQueue.on('stalled', (job: import('bull').Job<QuoteExpiryJobData>) => {
  console.warn(`Quote expiry job ${job.id} stalled for quote: ${job.data.quoteId}`);
});

