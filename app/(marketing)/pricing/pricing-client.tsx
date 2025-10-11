'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PricingButtonProps {
  planId: string;
  planName: string;
  cta: string;
  variant?: 'default' | 'outline';
  href?: string;
}

export function PricingButton({
  planId,
  planName: _planName,
  cta,
  variant = 'default',
  href,
}: PricingButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // If it's a custom href (like for Enterprise), just navigate
      if (href && (href.startsWith('/contact') || href.startsWith('/signup'))) {
        router.push(href);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle: 'monthly',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className="w-full"
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {cta}
    </Button>
  );
}

interface BillingCycleSwitchProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}

export function BillingCycleSwitch({
  value,
  onChange,
}: BillingCycleSwitchProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-medium ${
          value === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value === 'yearly'}
        onClick={() => onChange(value === 'monthly' ? 'yearly' : 'monthly')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          value === 'yearly' ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value === 'yearly' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium ${
          value === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Yearly{' '}
        <span className="ml-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          Save 20%
        </span>
      </span>
    </div>
  );
}
