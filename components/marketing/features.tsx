import {
  Bot,
  Database,
  Lock,
  Zap,
  Code,
  Globe,
  Users,
  BarChart,
  Palette,
  Shield,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Bot,
    title: 'AI Agent System',
    description: 'Real-time streaming with AG-UI protocol. LLM-agnostic support for OpenAI, Anthropic, Google, and Mistral.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Auth',
    description: 'Enterprise-grade authentication with Clerk. Organization management, role-based access, and SSO support.',
  },
  {
    icon: Database,
    title: 'RAG System',
    description: 'Vector database with Supabase pgvector. Semantic search and knowledge base management built-in.',
  },
  {
    icon: Zap,
    title: 'MCP Tools',
    description: 'Extensible tool system for external integrations. Connect to APIs, databases, and third-party services.',
  },
  {
    icon: Code,
    title: 'Modern Stack',
    description: 'Next.js 14, React 18, TypeScript 5 with strict mode. Server Components and App Router ready.',
  },
  {
    icon: Palette,
    title: 'Beautiful UI',
    description: '46+ shadcn/ui components with Tailwind CSS. Dark mode, animations, and responsive design included.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Arcjet protection with rate limiting, bot detection, and input validation. Secure by default.',
  },
  {
    icon: BarChart,
    title: 'Analytics & Tracking',
    description: 'Usage metrics, cost tracking, and performance monitoring. Real-time insights dashboard.',
  },
  {
    icon: Globe,
    title: 'Marketing Site',
    description: 'Complete marketing pages with Sanity CMS. Blog, docs, and landing pages ready to customize.',
  },
  {
    icon: Rocket,
    title: 'Production Ready',
    description: 'Full CI/CD pipeline with GitHub Actions. Vercel deployment with automatic previews.',
  },
  {
    icon: Shield,
    title: 'Type Safety',
    description: 'End-to-end TypeScript with strict mode. Runtime validation with Zod schemas.',
  },
  {
    icon: Sparkles,
    title: 'Developer Experience',
    description: 'Hot reload, ESLint, Prettier, and comprehensive testing suite. Build with confidence.',
  },
];

export function Features() {
  return (
    <section className="bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Production-Ready Features
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            A comprehensive boilerplate packed with modern tools and best practices. Start building immediately.
          </p>
        </div>

        {/* Features grid */}
        <div className="mx-auto mt-16 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
