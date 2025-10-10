import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { PricingPreview } from '@/components/marketing/pricing-preview';
import { CTA } from '@/components/marketing/cta';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <Features />
      <PricingPreview />
      <CTA />
    </main>
  );
}
