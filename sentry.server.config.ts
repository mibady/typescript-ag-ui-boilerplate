/**
 * Sentry Server Configuration
 *
 * Captures errors from the server/API routes
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production
    tracesSampleRate: 1.0,

    // Ignore specific errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'AbortError',
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive environment variables
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env as any;
        delete env.STRIPE_SECRET_KEY;
        delete env.CLERK_SECRET_KEY;
        delete env.SUPABASE_SERVICE_ROLE_KEY;
        delete env.OPENAI_API_KEY;
        delete env.ANTHROPIC_API_KEY;
        delete env.SENTRY_DSN;
        delete env.ARCJET_KEY;
      }

      // Remove sensitive request data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
      }

      return event;
    },

    environment: process.env.NODE_ENV,
  });
}
