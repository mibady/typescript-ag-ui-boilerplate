/**
 * Sentry Error Tracking Utilities
 *
 * Centralized error tracking and user context management
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  organizationId?: string;
  plan?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  // Add organization context
  if (user.organizationId) {
    Sentry.setContext('organization', {
      id: user.organizationId,
      plan: user.plan,
    });
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.captureException(error, {
    level: context?.level || 'error',
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Start a span for performance monitoring
 */
export function startSpan(
  name: string,
  op: string
): any {
  // Using any due to Sentry v8 API changes
  return Sentry.startSpan({ name, op }, () => {});
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Set multiple tags
 */
export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

/**
 * Set custom context
 */
export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * Wrapper for async operations with error tracking
 */
export async function trackAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    name: string;
    onError?: (error: Error) => void;
    context?: Record<string, any>;
  }
): Promise<T> {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        extra: options.context,
      });

      if (options.onError) {
        options.onError(error);
      }
    }

    throw error;
  }
}
