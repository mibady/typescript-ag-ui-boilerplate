import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, BookOpen } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-purple-600 px-6 py-24 sm:py-32 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-0 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[20%] bottom-0 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Ready to Build Your Next AI Application?
        </h2>
        <p className="mt-6 text-lg leading-8 text-white/90">
          Join thousands of developers who are building production-ready AI applications with our boilerplate.
          Start for free today, no credit card required.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" variant="secondary" className="group min-w-[200px]" asChild>
            <Link href="/sign-up" prefetch={false}>
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-w-[200px] border-white/20 bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <Link href="/docs" prefetch={false}>
              <BookOpen className="mr-2 h-4 w-4" />
              View Documentation
            </Link>
          </Button>
        </div>

        {/* GitHub Star CTA */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <Button variant="link" className="text-white/80 hover:text-white" asChild>
            <Link href="https://github.com/yourusername/your-repo" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" />
              Star us on GitHub
            </Link>
          </Button>
          <span className="text-sm text-white/60">•</span>
          <span className="text-sm text-white/80">Open source & free forever</span>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 border-t border-white/20 pt-8">
          <p className="text-sm text-white/60">Trusted by developers at</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-white/40">
            <div className="text-lg font-semibold">Startup Inc.</div>
            <div className="text-lg font-semibold">Tech Corp</div>
            <div className="text-lg font-semibold">AI Labs</div>
            <div className="text-lg font-semibold">Dev Studio</div>
          </div>
        </div>
      </div>
    </section>
  );
}
