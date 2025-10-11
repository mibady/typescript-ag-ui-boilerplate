import { Metadata } from 'next';
import { Check, X, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getSubscriptionPlans } from '@/lib/db/subscriptions';
import { PricingButton } from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing | AI SaaS Boilerplate',
  description: 'Choose the perfect plan for your AI-powered application. Start free, scale as you grow.',
};

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate any differences in cost.',
  },
  {
    question: 'What are message limits?',
    answer: 'Message limits represent the number of AI chat messages you can send per month. Each conversation message (both user and AI responses) counts toward this limit. Unused messages do not roll over to the next month.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! The Pro plan includes a 14-day free trial with full access to all features. No credit card required to start your trial.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through Stripe. All payments are processed securely.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your subscription at any time from your billing dashboard. You will continue to have access until the end of your billing period.',
  },
  {
    question: 'Do you offer discounts for non-profits or educational institutions?',
    answer: 'Yes! Contact our sales team with your details to learn more about special pricing for non-profit organizations and educational institutions.',
  },
  {
    question: 'What happens if I exceed my message limit?',
    answer: 'If you exceed your monthly message limit, you will need to upgrade your plan to continue using AI features. You can upgrade at any time from your billing dashboard.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade security including encryption at rest and in transit, regular security audits, and GDPR compliance. Your data is stored in secure data centers with redundant backups.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'Free plan receives community support. Pro plan includes email support with response times under 24 hours. Enterprise plans receive 24/7 priority support with dedicated account management.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you are not satisfied within the first 30 days, contact support for a full refund.',
  },
];

const planIcons: Record<string, typeof Sparkles> = {
  free: Sparkles,
  pro: Zap,
  enterprise: Crown,
};

export default async function PricingPage() {
  // Fetch plans from database
  const dbPlans = await getSubscriptionPlans();

  // Transform database plans to UI format
  const plans = dbPlans.map((plan) => {
    const limits = plan.limits;
    const features = plan.features as Record<string, boolean>;

    return {
      id: plan.id,
      name: plan.display_name,
      price: plan.price_monthly / 100, // Convert from cents to dollars
      yearlyPrice: plan.price_yearly / 100,
      description: plan.description || '',
      icon: planIcons[plan.name] || Sparkles,
      popular: plan.name === 'pro',
      features: [
        {
          name: limits.messages_per_month === -1
            ? 'Unlimited messages'
            : `${limits.messages_per_month.toLocaleString()} messages/month`,
          included: true,
        },
        {
          name: limits.tokens_per_month === -1
            ? 'Unlimited tokens'
            : `${limits.tokens_per_month.toLocaleString()} tokens/month`,
          included: true,
        },
        {
          name: limits.documents === -1
            ? 'Unlimited documents'
            : `${limits.documents} documents`,
          included: true,
        },
        {
          name: limits.team_members === -1
            ? 'Unlimited team members'
            : `${limits.team_members} team member${limits.team_members > 1 ? 's' : ''}`,
          included: true,
        },
        {
          name: limits.sessions === -1
            ? 'Unlimited sessions'
            : `${limits.sessions} concurrent sessions`,
          included: true,
        },
        { name: 'Chat interface', included: features.chat || false },
        { name: 'Basic agents', included: features.basic_agents || false },
        { name: 'Advanced agents', included: features.advanced_agents || false },
        { name: 'Custom agents', included: features.custom_agents || false },
        { name: 'Email support', included: features.email_support || false },
        { name: 'Priority support', included: features.priority_support || false },
        { name: 'Custom integrations', included: features.custom_integrations || false },
        { name: 'API access', included: features.api_access || false },
        { name: 'SSO', included: features.sso || false },
      ],
      cta: plan.name === 'free' ? 'Get Started Free' :
           plan.name === 'enterprise' ? 'Contact Sales' :
           'Start Free Trial',
      href: plan.name === 'enterprise' ? '/contact?inquiry=enterprise' : undefined,
    };
  });

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
                  key={plan.id}
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
                      {plan.name === 'Enterprise Plan' ? (
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
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
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
                    <PricingButton
                      planId={plan.id}
                      planName={plan.name}
                      cta={plan.cta}
                      variant={plan.popular ? 'default' : 'outline'}
                      href={plan.href}
                    />
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
            <PricingButton
              planId="pro"
              planName="Pro"
              cta="Start Free Trial"
              variant="default"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
