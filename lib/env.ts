import { z } from 'zod';

const envSchema = z.object({
  // Clerk - Validate key formats
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().refine(
    (val) => val.startsWith('pk_test_') || val.startsWith('pk_live_'),
    'Clerk publishable key must start with pk_test_ or pk_live_'
  ),
  CLERK_SECRET_KEY: z.string().refine(
    (val) => val.startsWith('sk_test_') || val.startsWith('sk_live_'),
    'Clerk secret key must start with sk_test_ or sk_live_'
  ),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/onboarding'),

  // Supabase - Validate URL and key formats
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine(
    (val) => val.includes('.supabase.co') || val.includes('localhost'),
    'Supabase URL must be a valid Supabase URL'
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100, 'Supabase anon key appears invalid'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100, 'Supabase service role key appears invalid'),

  // Upstash Redis - Validate URL format
  UPSTASH_REDIS_REST_URL: z.string().url().refine(
    (val) => val.includes('.upstash.io') || val.includes('localhost'),
    'Upstash Redis URL must be a valid Upstash URL'
  ),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(20, 'Upstash Redis token appears invalid'),

  // Upstash Vector (optional) - Validate URL format if provided
  UPSTASH_VECTOR_REST_URL: z.string().url().refine(
    (val) => val.includes('.upstash.io') || val.includes('localhost'),
    'Upstash Vector URL must be a valid Upstash URL'
  ).optional(),
  UPSTASH_VECTOR_REST_TOKEN: z.string().min(20).optional(),

  // Upstash Search (optional) - Validate URL format if provided
  UPSTASH_SEARCH_REST_URL: z.string().url().optional(),
  UPSTASH_SEARCH_REST_TOKEN: z.string().min(20).optional(),

  // Upstash QStash (optional) - For background jobs
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // LLM Providers (at least one required) - Validate key formats
  OPENAI_API_KEY: z.string().refine(
    (val) => val.startsWith('sk-'),
    'OpenAI API key must start with sk-'
  ).optional(),
  ANTHROPIC_API_KEY: z.string().refine(
    (val) => val.startsWith('sk-ant-'),
    'Anthropic API key must start with sk-ant-'
  ).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),

  // Sanity CMS (optional)
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default('production'),
  SANITY_API_TOKEN: z.string().optional(),

  // Resend (optional)
  RESEND_API_KEY: z.string().refine(
    (val) => val.startsWith('re_'),
    'Resend API key must start with re_'
  ).optional(),

  // Arcjet (optional)
  ARCJET_KEY: z.string().refine(
    (val) => val.startsWith('ajkey_'),
    'Arcjet key must start with ajkey_'
  ).optional(),

  // Stripe (optional) - Validate key formats if provided
  STRIPE_SECRET_KEY: z.string().refine(
    (val) => val.startsWith('sk_test_') || val.startsWith('sk_live_'),
    'Stripe secret key must start with sk_test_ or sk_live_'
  ).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().refine(
    (val) => val.startsWith('pk_test_') || val.startsWith('pk_live_'),
    'Stripe publishable key must start with pk_test_ or pk_live_'
  ).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().refine(
    (val) => val.startsWith('whsec_'),
    'Stripe webhook secret must start with whsec_'
  ).optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables at build time
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

// Ensure at least one LLM provider is configured
const hasLLMProvider =
  parsed.data.OPENAI_API_KEY ||
  parsed.data.ANTHROPIC_API_KEY ||
  parsed.data.GOOGLE_GENERATIVE_AI_API_KEY ||
  parsed.data.MISTRAL_API_KEY;

if (!hasLLMProvider) {
  throw new Error('At least one LLM provider API key is required (OpenAI, Anthropic, Google, or Mistral)');
}

export const env = parsed.data;

// Export type for environment variables
export type Env = z.infer<typeof envSchema>;
