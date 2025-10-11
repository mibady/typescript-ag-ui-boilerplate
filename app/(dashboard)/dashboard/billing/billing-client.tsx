'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BillingDashboardProps {
  organizationId: string;
}

interface Subscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at: string | null;
}

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, boolean>;
  limits: {
    messages_per_month: number;
    tokens_per_month: number;
    documents: number;
    team_members: number;
    sessions: number;
    api_calls_per_day: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_url: string | null;
  invoice_pdf: string | null;
  description: string | null;
  paid_at: string | null;
  created_at: string;
}

interface BillingData {
  subscription: Subscription;
  plan: Plan;
  usage: Record<string, number>;
  payments: Payment[];
}

export function BillingDashboard({ organizationId: _organizationId }: BillingDashboardProps) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      const billingData = await response.json();
      setData(billingData);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load billing data</p>
            <Button onClick={fetchBillingData} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { subscription, plan, usage, payments } = data;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      trialing: { label: 'Trial', variant: 'secondary' },
      past_due: { label: 'Past Due', variant: 'destructive' },
      canceled: { label: 'Canceled', variant: 'outline' },
      incomplete: { label: 'Incomplete', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUsagePercentage = (metricName: string) => {
    const currentUsage = usage[metricName] || 0;
    const limit = (plan.limits as Record<string, number>)[metricName] || 0;

    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No limit means full

    return Math.min((currentUsage / limit) * 100, 100);
  };

  const formatUsage = (metricName: string) => {
    const currentUsage = usage[metricName] || 0;
    const limit = (plan.limits as Record<string, number>)[metricName] || 0;

    if (limit === -1) return `${currentUsage.toLocaleString()} / Unlimited`;
    return `${currentUsage.toLocaleString()} / ${limit.toLocaleString()}`;
  };

  const usageMetrics = [
    { name: 'Messages', key: 'messages_per_month', icon: TrendingUp },
    { name: 'Tokens', key: 'tokens_per_month', icon: TrendingUp },
    { name: 'Documents', key: 'documents', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                ${(subscription.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly) / 100}
              </div>
              <div className="text-sm text-muted-foreground">
                per {subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Status:</span>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          {subscription.current_period_end && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Next billing date:</span>
              </div>
              <span className="text-sm font-medium">
                {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {subscription.trial_end && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Trial ends:</span>
              </div>
              <span className="text-sm font-medium">
                {format(new Date(subscription.trial_end), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {subscription.cancel_at && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Cancels on:</span>
              </div>
              <span className="text-sm font-medium text-destructive">
                {format(new Date(subscription.cancel_at), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button onClick={handleManageSubscription} disabled={portalLoading}>
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
            <Button variant="outline" asChild>
              <a href="/pricing" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Plans
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>
            {subscription.current_period_start && subscription.current_period_end
              ? `${format(new Date(subscription.current_period_start), 'MMM d')} - ${format(new Date(subscription.current_period_end), 'MMM d, yyyy')}`
              : 'Current billing period'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {usageMetrics.map((metric) => {
            const percentage = getUsagePercentage(metric.key);
            const isNearLimit = percentage > 80;
            const isOverLimit = percentage >= 100;

            return (
              <div key={metric.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <span className={`text-sm ${isOverLimit ? 'text-destructive font-semibold' : isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
                    {formatUsage(metric.key)}
                  </span>
                </div>
                {(plan.limits as Record<string, number>)[metric.key] !== -1 && (
                  <Progress
                    value={percentage}
                    className={isOverLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent billing transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment history yet
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                      </span>
                      <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.description || 'Subscription payment'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy') : 'Pending'}
                    </div>
                  </div>
                  {payment.invoice_pdf && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={payment.invoice_pdf} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
