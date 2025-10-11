import { Metadata } from 'next';
import { Check, X, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing | AI SaaS Boilerplate',
  description: 'Choose the perfect plan for your AI-powered application. Start free, scale as you grow.',
};

const plans = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfect for side projects and experimentation',
    icon: Sparkles,
    popular: false,
    features: [
      { name: '1 organization', included: true },
      { name: '5 team members', included: true },
      { name: '10,000 AI tokens/month', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Community support', included: true },
      { name: 'Standard security', included: true },
      { name: '1 GB storage', included: true },
      { name: 'Email support', included: false },
      { name: 'Custom branding', included: false },
      { name: 'SSO integration', included: false },
      { name: 'Advanced security', included: false },
      { name: 'SLA guarantee', included: false },
    ],
    cta: 'Get Started Free',
    href: '/signup',
  },
  {
    name: 'Professional',
    price: 49,
    description: 'For growing teams and businesses',
    icon: Zap,
    popular: true,
    features: [
      { name: '5 organizations', included: true },
      { name: 'Unlimited team members', included: true },
      { name: '100,000 AI tokens/month', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced security', included: true },
      { name: '50 GB storage', included: true },
      { name: 'Email support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'SSO integration', included: true },
      { name: 'API access', included: true },
      { name: 'SLA guarantee', included: false },
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'For large-scale deployments',
    icon: Crown,
    popular: false,
    features: [
      { name: 'Unlimited organizations', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Unlimited AI tokens', included: true },
      { name: 'Real-time analytics', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Enterprise security', included: true },
      { name: 'Unlimited storage', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'SSO integration', included: true },
      { name: 'API access', included: true },
      { name: '99.9% SLA guarantee', included: true },
    ],
    cta: 'Contact Sales',
    href: '/contact?inquiry=enterprise',
  },
];

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate any differences in cost.',
  },
  {
    question: 'What are AI tokens?',
    answer: 'AI tokens represent the usage of AI features in your application. Each API call to our AI agents consumes tokens based on the complexity and length of the interaction. The average conversation uses approximately 1,000-2,000 tokens.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All paid plans include a 14-day free trial with full access to all features. No credit card required to start your trial.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. You will continue to have access until the end of your billing period, and we will not charge you again.',
  },
  {
    question: 'Do you offer discounts for non-profits or educational institutions?',
    answer: 'Yes! We offer special pricing for non-profit organizations and educational institutions. Contact our sales team with your details to learn more about our discounts.',
  },
  {
    question: 'What happens if I exceed my AI token limit?',
    answer: 'If you exceed your monthly token limit, your AI features will be temporarily paused until the next billing cycle. You can upgrade your plan or purchase additional tokens at any time to continue using AI features.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade security including encryption at rest and in transit, regular security audits, SOC 2 Type II compliance, and GDPR compliance. Your data is stored in secure data centers with redundant backups.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'Starter plans receive community support through our forums. Professional plans include priority email support with response times under 24 hours. Enterprise plans receive 24/7 phone and email support with dedicated account management.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you are not satisfied within the first 30 days, contact support for a full refund, no questions asked.',
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Choose the perfect plan for your needs. Start free, scale as you grow.
            All plans include our core features.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.popular ? 'border-primary shadow-xl ring-2 ring-primary' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-primary px-4 py-1 text-sm font-semibold">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-8">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-8">
                      {plan.price === null ? (
                        <div>
                          <span className="text-4xl font-bold text-foreground">Custom</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="h-5 w-5 shrink-0 text-primary" />
                          ) : (
                            <X className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                          )}
                          <span
                            className={`text-sm ${
                              feature.included ? 'text-foreground' : 'text-muted-foreground/70'
                            }`}
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-8">
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className="w-full"
                      size="lg"
                      asChild
                    >
                      <Link href={plan.href} prefetch={false}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-muted/30 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            All plans include
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Core features available on every plan
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption' },
              { icon: Zap, title: 'Fast Performance', description: 'Edge network delivery' },
              { icon: Check, title: 'Regular Updates', description: 'New features monthly' },
              { icon: Sparkles, title: 'AI-Powered', description: 'Multiple LLM providers' },
              { icon: Shield, title: '99.9% Uptime', description: 'Reliable infrastructure' },
              { icon: Crown, title: 'Premium Support', description: 'Responsive team' },
            ].map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FeatureIcon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about our pricing
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary to-purple-600 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup" prefetch={false}>
                Start Free Trial
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact" prefetch={false}>
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
