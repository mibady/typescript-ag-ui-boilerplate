import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[50%] top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span className="font-medium">AI-Powered Development</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Build AI-First Applications{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Lightning Fast
            </span>
          </h1>

          {/* Subheading */}
          <p className="mb-10 text-lg leading-8 text-muted-foreground sm:text-xl">
            Production-ready boilerplate for building multi-tenant SaaS applications with AI agents,
            real-time streaming, and comprehensive features. Ship faster, scale smarter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="group" asChild>
              <Link href="/sign-up" prefetch={false}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs" prefetch={false}>View Documentation</Link>
            </Button>
          </div>

          {/* Features badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Next.js 14</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Agents</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Screenshot/Demo placeholder */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative rounded-xl border bg-card shadow-2xl">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-75 blur" />
            <div className="relative aspect-video rounded-xl bg-gradient-to-br from-muted to-muted/50 p-8">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Sparkles className="mx-auto h-16 w-16 text-primary" />
                  <p className="mt-4 text-lg font-medium text-muted-foreground">
                    Your AI-Powered Dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
