/**
 * Sentry Edge Configuration
 *
 * Captures errors from Edge Runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production
    tracesSampleRate: 1.0,

    // Filter sensitive data
    beforeSend(event, hint) {
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
