#!/usr/bin/env tsx

/**
 * Test Data Setup Script
 *
 * Creates test users, organizations, and sample data for testing.
 * Run this before executing E2E tests to ensure test environment is ready.
 *
 * Usage:
 * npm run setup:test-data
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

// Test data
const TEST_ORGANIZATIONS = [
  {
    id: 'test-org-1',
    name: 'Test Organization 1',
    slug: 'test-org-1',
    plan: 'free',
  },
  {
    id: 'test-org-2',
    name: 'Test Organization 2',
    slug: 'test-org-2',
    plan: 'pro',
  },
];

const TEST_USERS = [
  {
    clerk_user_id: 'test-user-1',
    email: process.env.TEST_USER_EMAIL || 'test-user@example.com',
    organization_id: 'test-org-1',
  },
  {
    clerk_user_id: 'test-admin-1',
    email: process.env.TEST_ORG_ADMIN_EMAIL || 'test-admin@example.com',
    organization_id: 'test-org-2',
  },
  {
    clerk_user_id: 'test-member-1',
    email: process.env.TEST_ORG_MEMBER_EMAIL || 'test-member@example.com',
    organization_id: 'test-org-2',
  },
];

const TEST_DOCUMENTS = [
  {
    title: 'AI and Machine Learning Overview',
    content: `Artificial Intelligence (AI) and Machine Learning (ML) are transforming the technology landscape.

Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. Deep Learning, a subset of ML, uses neural networks with multiple layers to analyze data.

Key applications include:
- Natural Language Processing (NLP)
- Computer Vision
- Recommendation Systems
- Autonomous Vehicles

The future of AI promises even more advanced capabilities with the development of AGI (Artificial General Intelligence).`,
    type: 'text/markdown',
  },
  {
    title: 'TypeScript Best Practices',
    content: `TypeScript is a strongly typed programming language that builds on JavaScript.

Best Practices:
1. Use strict mode
2. Prefer interfaces over types for object shapes
3. Leverage union types and type guards
4. Use generics for reusable components
5. Avoid 'any' type

Example:
\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}
\`\`\`

TypeScript provides excellent tooling support and catches errors at compile time.`,
    type: 'text/markdown',
  },
  {
    title: 'Database Design Principles',
    content: `Good database design is crucial for application performance and maintainability.

Key Principles:
1. Normalization - Reduce data redundancy
2. Proper indexing - Speed up queries
3. Use constraints - Ensure data integrity
4. Plan for scalability
5. Consider query patterns

PostgreSQL specific features:
- JSONB for semi-structured data
- Full-text search
- Row Level Security (RLS)
- Vector similarity search with pgvector

Always test with production-like data volumes.`,
    type: 'text/markdown',
  },
];

async function main() {
  console.log('🚀 Setting up test data...\n');

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

  try {
    // 1. Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await cleanupTestData(supabase, redis);
    console.log('✅ Cleanup complete\n');

    // 2. Create test organizations
    console.log('🏢 Creating test organizations...');
    for (const org of TEST_ORGANIZATIONS) {
      const { error } = await supabase.from('organizations').upsert(org);

      if (error) {
        console.error(`Failed to create organization ${org.name}:`, error.message);
      } else {
        console.log(`✅ Created organization: ${org.name}`);
      }
    }
    console.log('');

    // 3. Create test users
    console.log('👥 Creating test users...');
    for (const user of TEST_USERS) {
      const { error } = await supabase.from('users').upsert(user);

      if (error) {
        console.error(`Failed to create user ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created user: ${user.email}`);
      }
    }
    console.log('');

    // 4. Create test documents
    console.log('📄 Creating test documents...');
    for (const doc of TEST_DOCUMENTS) {
      const documentData = {
        title: doc.title,
        content: doc.content,
        type: doc.type,
        organization_id: TEST_ORGANIZATIONS[0].id,
        size_bytes: Buffer.byteLength(doc.content, 'utf8'),
        chunk_count: Math.ceil(doc.content.length / 1000),
      };

      const { error } = await supabase.from('documents').insert(documentData);

      if (error) {
        console.error(`Failed to create document ${doc.title}:`, error.message);
      } else {
        console.log(`✅ Created document: ${doc.title}`);
      }
    }
    console.log('');

    // 5. Populate Redis cache with test data
    console.log('💾 Populating Redis cache...');
    await redis.set('test:status', 'ready');
    await redis.set('test:timestamp', Date.now().toString());
    console.log('✅ Redis cache populated\n');

    // 6. Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Test data setup complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Test Organizations:');
    TEST_ORGANIZATIONS.forEach((org) => {
      console.log(`  - ${org.name} (${org.plan} plan)`);
    });
    console.log('');
    console.log('Test Users:');
    TEST_USERS.forEach((user) => {
      console.log(`  - ${user.email}`);
    });
    console.log('');
    console.log('Test Documents:', TEST_DOCUMENTS.length);
    console.log('');
    console.log('⚠️  Note: You still need to create test users in Clerk manually');
    console.log('   or use the Clerk API to create them programmatically.');
    console.log('');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

async function cleanupTestData(supabase: any, redis: Redis) {
  // Delete test documents
  await supabase
    .from('documents')
    .delete()
    .in('organization_id', TEST_ORGANIZATIONS.map((o) => o.id));

  // Delete test users
  await supabase
    .from('users')
    .delete()
    .in('clerk_user_id', TEST_USERS.map((u) => u.clerk_user_id));

  // Delete test organizations
  await supabase
    .from('organizations')
    .delete()
    .in('id', TEST_ORGANIZATIONS.map((o) => o.id));

  // Clear test Redis keys
  await redis.del('test:status', 'test:timestamp');
}

// Run the script
main();
