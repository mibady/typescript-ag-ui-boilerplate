/**
 * Vitest Setup File
 *
 * Global test setup and configuration
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
process.env.CLERK_SECRET_KEY = 'sk_test_123';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_key';
