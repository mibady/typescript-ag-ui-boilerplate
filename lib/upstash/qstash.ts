/**
 * Upstash QStash Client
 * 
 * Serverless messaging and job queue for background processing.
 * Used for document processing, webhooks, and scheduled tasks.
 */

import { Client } from '@upstash/qstash';

if (!process.env.QSTASH_TOKEN) {
  throw new Error('QSTASH_TOKEN is not defined');
}

// Initialize QStash client
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

/**
 * Publish a message to a URL endpoint
 */
export async function publishMessage<T = any>(
  url: string,
  body: T,
  options?: {
    delay?: number; // Delay in seconds
    retries?: number; // Number of retries (default: 3)
    headers?: Record<string, string>;
  }
) {
  return qstash.publishJSON({
    url,
    body,
    retries: options?.retries ?? 3,
    delay: options?.delay,
    headers: options?.headers,
  });
}

/**
 * Schedule a recurring job (cron)
 */
export async function scheduleJob<T = any>(
  url: string,
  cron: string,
  body: T,
  options?: {
    headers?: Record<string, string>;
  }
) {
  return qstash.publishJSON({
    url,
    body,
    cron,
    headers: options?.headers,
  });
}

/**
 * Queue document processing job
 */
export async function queueDocumentProcessing(
  documentId: string,
  organizationId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return publishMessage(
    `${appUrl}/api/jobs/process-document`,
    {
      documentId,
      organizationId,
      timestamp: Date.now(),
    },
    {
      retries: 3,
    }
  );
}

/**
 * Queue email sending job
 */
export async function queueEmailJob(
  to: string,
  subject: string,
  template: string,
  data: Record<string, any>
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return publishMessage(
    `${appUrl}/api/jobs/send-email`,
    {
      to,
      subject,
      template,
      data,
      timestamp: Date.now(),
    },
    {
      retries: 5,
    }
  );
}

/**
 * Queue webhook delivery
 */
export async function queueWebhook(
  webhookUrl: string,
  event: string,
  payload: Record<string, any>
) {
  return publishMessage(
    webhookUrl,
    {
      event,
      payload,
      timestamp: Date.now(),
    },
    {
      retries: 5,
    }
  );
}

/**
 * Verify QStash signature (for incoming webhook requests)
 */
export async function verifySignature(
  signature: string,
  body: string
): Promise<boolean> {
  try {
    // QStash v2 doesn't have a built-in receiver - signature verification
    // should be done in the API route using the Receiver class
    // This is a placeholder that always returns true for now
    // TODO: Implement proper signature verification using @upstash/qstash/nextjs
    console.warn('QStash signature verification not fully implemented');
    return true;
  } catch (error) {
    console.error('QStash signature verification failed:', error);
    return false;
  }
}
