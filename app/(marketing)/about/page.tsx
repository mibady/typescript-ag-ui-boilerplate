import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Zap, Shield, Heart, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | AI SaaS Boilerplate',
  description: 'Learn about our mission to accelerate AI application development with production-ready tools.',
};

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We exist to accelerate AI innovation by providing developers with production-ready tools that eliminate months of setup work.',
  },
  {
    icon: Users,
    title: 'Developer-First',
    description: 'Built by developers, for developers. Every feature is designed with the end-user developer experience in mind.',
  },
  {
    icon: Zap,
    title: 'Speed & Quality',
    description: 'We believe you should not have to choose between shipping fast and shipping quality code. Our tools enable both.',
  },
  {
    icon: Shield,
    title: 'Security by Default',
    description: 'Enterprise-grade security is not optional. Every component follows industry best practices from day one.',
  },
  {
    icon: Heart,
    title: 'Open Source',
    description: 'We believe in transparency and community. Our core is open source, enabling anyone to build and contribute.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Supporting developers worldwide to build AI applications that solve real problems for real people.',
  },
];

const team = [
  {
    name: 'Engineering Team',
    description: 'Full-stack engineers with expertise in AI, distributed systems, and developer tools.',
    count: '10+ engineers',
  },
  {
    name: 'Product Team',
    description: 'Product managers and designers focused on creating exceptional developer experiences.',
    count: '5+ members',
  },
  {
    name: 'Community',
    description: 'Open source contributors and community members from around the world.',
    count: '1,000+ developers',
  },
];

const milestones = [
  {
    year: '2024',
    title: 'Foundation',
    description: 'Started with a vision to simplify AI application development for startups and enterprises.',
  },
  {
    year: '2024',
    title: 'First Release',
    description: 'Launched v1.0 with core features: multi-tenant auth, AI agents, and RAG system.',
  },
  {
    year: '2025',
    title: 'Community Growth',
    description: 'Reached 1,000+ developers building AI applications with our platform.',
  },
  {
    year: '2025',
    title: 'Enterprise Ready',
    description: 'Added enterprise features: SSO, advanced security, and dedicated support.',
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6">About Us</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Building the Future of AI Development
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            We are a team of developers, designers, and AI enthusiasts on a mission to make
            building production-ready AI applications accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-lg leading-relaxed text-muted-foreground">
              <p>
                Every great AI application starts with months of infrastructure work: authentication,
                database setup, API integrations, security hardening, and more. We eliminate that
                overhead.
              </p>
              <p className="mt-4">
                Our boilerplate provides everything you need to build production-ready AI SaaS
                applications: multi-tenant authentication, AI agent systems, vector search, and
                comprehensive security—all pre-configured and ready to deploy.
              </p>
              <p className="mt-4">
                We believe developers should focus on solving unique problems, not rebuilding the
                same infrastructure over and over.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Our Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The principles that guide everything we build
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title}>
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{value.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Our Team</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Distributed team of passionate builders
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {team.map((group) => (
              <Card key={group.name} className="text-center">
                <CardHeader>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto mt-2 w-fit">
                    {group.count}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{group.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-muted/30 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Our Journey</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Key milestones in our story
            </p>
          </div>

          <div className="mt-12 space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {milestone.year.slice(-2)}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <p className="text-sm font-semibold text-primary">{milestone.year}</p>
                  <h3 className="mt-1 text-xl font-semibold text-foreground">
                    {milestone.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Built with Modern Tech
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We use the best tools to build the best product
            </p>
          </div>

          <div className="mt-12 grid gap-4 text-center sm:grid-cols-3 lg:grid-cols-4">
            {[
              'Next.js 14',
              'React 18',
              'TypeScript',
              'Tailwind CSS',
              'Vercel AI SDK',
              'Supabase',
              'Clerk',
              'Stripe',
              'Sanity',
              'shadcn/ui',
              'Arcjet',
              'Sentry',
            ].map((tech) => (
              <div
                key={tech}
                className="rounded-lg border bg-card p-4 text-sm font-medium text-foreground"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary to-purple-600 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join Our Community
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Connect with developers building the next generation of AI applications.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="https://github.com/yourusername/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-primary hover:bg-white/90"
            >
              View on GitHub
            </a>
            <a
              href="https://discord.gg/your-discord"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
