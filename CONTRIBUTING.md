# Contributing to TypeScript AG-UI Boilerplate

> **This is a boilerplate template** designed to be forked and customized for your own AI-powered SaaS projects.

---

## 🎯 About This Boilerplate

This repository serves as a **production-ready starting point** for building AI-powered multi-tenant SaaS applications. It's meant to be:

1. **Forked** - Clone this repo as the foundation for your project
2. **Customized** - Modify and extend to fit your specific needs
3. **Maintained** - Keep your fork updated with improvements

---

## 🚀 Getting Started with the Boilerplate

### **Option 1: Fork for Your Project**

```bash
# 1. Fork this repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/your-project-name.git
cd your-project-name

# 3. Install dependencies
npm install

# 4. Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 5. Start building!
npm run dev
```

### **Option 2: Use as Template**

Click "Use this template" on GitHub to create a new repository based on this boilerplate.

---

## 📝 Customization Guide

### **1. Branding & Identity**

Update these files with your project information:

- `README.md` - Project name, description, badges
- `package.json` - Name, description, repository URL
- `app/layout.tsx` - Site metadata, title, description
- `components/` - Replace placeholder text and branding

### **2. Environment Configuration**

Configure your services in `.env.local`:

```bash
# Required services
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
OPENAI_API_KEY=your_key

# Optional services
STRIPE_SECRET_KEY=your_key
RESEND_API_KEY=your_key
SENTRY_DSN=your_dsn
```

See **[SETUP.md](./SETUP.md)** for detailed setup instructions.

### **3. Database Schema**

The base schema is in `supabase/migrations/20251011000001_complete_schema.sql`.

**To add custom tables:**

```sql
-- Create new migration file
-- supabase/migrations/20251012000001_add_custom_tables.sql

CREATE TABLE IF NOT EXISTS custom_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- your columns here
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE custom_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON custom_table
  FOR ALL
  TO authenticated
  USING (organization_id = (current_setting('app.clerk_org_id'))::uuid);
```

### **4. Custom Agents**

Extend the base agent for your use case:

```typescript
// lib/agents/my-custom-agent.ts
import { BaseAgent, AgentConfig } from './base-agent';

export class MyCustomAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super('my-custom-agent', {
      ...config,
      systemPrompt: `You are a specialized AI assistant for...`,
      tools: [
        // Define your custom tools
      ]
    });
  }

  async executeCustomLogic() {
    // Your custom agent logic
  }
}
```

### **5. Custom API Routes**

Add new endpoints in `app/api/`:

```typescript
// app/api/my-feature/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId || !orgId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient();
  
  // Your logic here
  
  return Response.json({ success: true });
}
```

### **6. UI Components**

Customize the UI using shadcn/ui:

```bash
# Add new shadcn/ui components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form

# Components are added to components/ui/
# Customize them in your project
```

---

## 🧪 Testing Your Changes

Always test your customizations:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🏗️ Extending the Architecture

### **Adding a New Service**

1. **Install the SDK**
   ```bash
   npm install @new-service/sdk
   ```

2. **Create a client wrapper**
   ```typescript
   // lib/new-service.ts
   import { NewService } from '@new-service/sdk';
   
   export const newService = new NewService({
     apiKey: process.env.NEW_SERVICE_API_KEY!
   });
   ```

3. **Add environment variables**
   ```bash
   # .env.local
   NEW_SERVICE_API_KEY=your_key
   ```

4. **Update documentation**
   - Add to `SETUP.md`
   - Update `README.md`
   - Document in `docs/reference/`

### **Adding a New Feature**

1. **Plan the feature**
   - Define requirements
   - Design database schema
   - Plan API endpoints

2. **Implement backend**
   - Create database migrations
   - Add API routes
   - Implement business logic

3. **Implement frontend**
   - Create UI components
   - Add state management
   - Connect to API

4. **Add tests**
   - Unit tests for utilities
   - Integration tests for API
   - E2E tests for user flows

5. **Document**
   - Update relevant guides
   - Add code comments
   - Update README if needed

---

## 📚 Documentation Standards

When adding features, maintain documentation:

### **Code Comments**

```typescript
/**
 * Processes a document and generates embeddings
 * @param documentId - UUID of the document to process
 * @param organizationId - UUID of the organization
 * @returns Promise<ProcessingResult>
 */
export async function processDocument(
  documentId: string,
  organizationId: string
): Promise<ProcessingResult> {
  // Implementation
}
```

### **Guide Structure**

If creating new guides in `docs/guides/`:

```markdown
# Feature Name

Brief description of what this feature does.

## Overview

High-level explanation.

## Implementation

Step-by-step implementation details.

## Usage

Code examples showing how to use the feature.

## Testing

How to test this feature.

## Troubleshooting

Common issues and solutions.
```

---

## 🔒 Security Best Practices

When extending the boilerplate:

1. **Never commit secrets**
   - Use `.env.local` (gitignored)
   - Use environment variables
   - Use secret management tools

2. **Maintain RLS policies**
   - Every new table needs RLS
   - Test multi-tenant isolation
   - Verify organization filtering

3. **Validate inputs**
   - Use Zod schemas
   - Sanitize user input
   - Validate on both client and server

4. **Follow authentication patterns**
   ```typescript
   // Always check auth
   const { userId, orgId } = await auth();
   if (!userId || !orgId) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

---

## 🚢 Deployment

### **Pre-Deployment Checklist**

```bash
# 1. Run all validation
npm run validate:env
npm run validate:clerk
npm run validate:supabase
npm run validate:stripe
npm run validate:ai

# 2. Run tests
npm run test:pre-deploy

# 3. Build and verify
npm run build
npm run start

# 4. Check for errors
# - No TypeScript errors
# - No ESLint warnings
# - All tests passing
```

### **Environment Variables**

Ensure all environment variables are set in your deployment platform:

- Vercel: Project Settings → Environment Variables
- Railway: Project → Variables
- Render: Environment → Environment Variables

---

## 🤝 Contributing Back to the Boilerplate

If you've made improvements that would benefit others:

1. **Fork the original boilerplate repo**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/improved-rag-system
   ```
3. **Make your changes**
   - Follow existing code style
   - Add tests
   - Update documentation
4. **Submit a Pull Request**
   - Clear description of changes
   - Link to any related issues
   - Include screenshots if UI changes

---

## 📖 Additional Resources

### **Documentation**
- [Setup Guide](./SETUP.md) - Complete setup instructions
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Documentation Hub](./docs/README.md) - All documentation

### **Guides**
- [AG-UI Integration](./docs/guides/AG-UI-SDK-INTEGRATION.md)
- [Hybrid Search](./docs/guides/hybrid-search-guide.md)
- [State Management](./docs/guides/state-management-guide.md)
- [Testing](./docs/guides/testing.md)

### **Reference**
- [API Reference](./docs/reference/api.md)
- [Database Schema](./docs/reference/database.md)
- [Build Specification](./docs/reference/build-specification.md)

---

## 💡 Tips for Success

1. **Start Small** - Don't try to customize everything at once
2. **Follow Patterns** - Use existing code as examples
3. **Test Often** - Run tests after each change
4. **Document Changes** - Update docs as you go
5. **Ask Questions** - Use GitHub Discussions for help

---

## 📄 License

This boilerplate is MIT licensed. You're free to use it for any purpose, including commercial projects.

When you fork this repository, you can:
- ✅ Use it commercially
- ✅ Modify it freely
- ✅ Distribute it
- ✅ Use it privately
- ✅ Sublicense it

---

**Happy building! 🚀**

For questions or support, open an issue or discussion on GitHub.
