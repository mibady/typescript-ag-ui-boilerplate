/**
 * Subscription Status API
 * Phase 6: Billing & Subscriptions
 *
 * Get current subscription and usage information
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptionWithPlan,
  getOrganizationUsage,
  getPaymentHistory,
} from '@/lib/db/subscriptions';

/**
 * GET /api/billing/subscription
 * Returns current subscription, plan, and usage data
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription with plan details
    const subscriptionWithPlan = await getSubscriptionWithPlan(orgId);

    // Get current usage
    const usage = await getOrganizationUsage(orgId);

    // Get recent payment history
    const payments = await getPaymentHistory(orgId, { limit: 10 });

    // Default to free plan if no subscription
    let subscription = subscriptionWithPlan;
    if (!subscription) {
      // Return free plan as default
      subscription = {
        id: 'free',
        organization_id: orgId,
        plan_id: 'free',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        status: 'active' as const,
        billing_cycle: 'monthly' as const,
        current_period_start: null,
        current_period_end: null,
        trial_end: null,
        cancel_at: null,
        canceled_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan: {
          id: 'free',
          name: 'free',
          display_name: 'Free Plan',
          description: 'Perfect for trying out the platform',
          price_monthly: 0,
          price_yearly: 0,
          stripe_price_id_monthly: null,
          stripe_price_id_yearly: null,
          features: {
            chat: true,
            basic_agents: true,
            email_support: false,
            priority_support: false,
            custom_integrations: false,
          },
          limits: {
            messages_per_month: 100,
            tokens_per_month: 50000,
            documents: 10,
            team_members: 1,
            sessions: 5,
            api_calls_per_day: 100,
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end,
        cancel_at: subscription.cancel_at,
      },
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        display_name: subscription.plan.display_name,
        description: subscription.plan.description,
        price_monthly: subscription.plan.price_monthly,
        price_yearly: subscription.plan.price_yearly,
        features: subscription.plan.features,
        limits: subscription.plan.limits,
      },
      usage,
      payments,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
