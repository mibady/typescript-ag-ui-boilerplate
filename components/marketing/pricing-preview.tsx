import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for side projects and small teams',
    price: '$0',
    period: 'forever',
    popular: false,
    features: [
      '1 organization',
      '5 team members',
      '10,000 AI tokens/month',
      'Basic analytics',
      'Community support',
      'Standard security',
    ],
    cta: 'Get Started Free',
    href: '/signup',
  },
  {
    name: 'Professional',
    description: 'For growing teams and businesses',
    price: '$49',
    period: '/month',
    popular: true,
    features: [
      '5 organizations',
      'Unlimited team members',
      '100,000 AI tokens/month',
      'Advanced analytics',
      'Priority support',
      'Advanced security',
      'Custom branding',
      'SSO integration',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
  },
  {
    name: 'Enterprise',
    description: 'For large-scale deployments',
    price: 'Custom',
    period: '',
    popular: false,
    features: [
      'Unlimited organizations',
      'Unlimited team members',
      'Unlimited AI tokens',
      'Real-time analytics',
      'Dedicated support',
      'Enterprise security',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    href: '/contact?inquiry=enterprise',
  },
];

export function PricingPreview() {
  return (
    <section className="bg-muted/30 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Pricing</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Choose the perfect plan for your needs. Start free, upgrade as you grow.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-16 grid max-w-7xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-xl ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary px-4 py-1 text-sm font-semibold">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link href={plan.href} prefetch={false}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial. No credit card required.{' '}
            <Link href="/pricing" className="font-medium text-primary hover:underline" prefetch={false}>
              View detailed pricing →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
