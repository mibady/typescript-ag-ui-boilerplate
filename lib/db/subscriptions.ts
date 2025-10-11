/**
 * Subscription Database Operations
 * Phase 6: Billing & Subscriptions
 */

import { createClient } from '@/lib/supabase-server';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: Record<string, unknown>;
  limits: PlanLimits;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  messages_per_month: number; // -1 = unlimited
  tokens_per_month: number; // -1 = unlimited
  documents: number; // -1 = unlimited
  team_members: number; // -1 = unlimited
  sessions: number; // -1 = unlimited
  api_calls_per_day: number; // -1 = unlimited
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  organization_id: string;
  subscription_id: string | null;
  metric_name: string;
  quantity: number;
  unit: string;
  period_start: string;
  period_end: string;
  metadata: Record<string, unknown>;
  recorded_at: string;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  organization_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded' | 'canceled';
  invoice_url: string | null;
  invoice_pdf: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
}

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

/**
 * Get all active subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }

    return data as SubscriptionPlan[];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

/**
 * Get a specific subscription plan by name
 */
export async function getSubscriptionPlanByName(
  name: string
): Promise<SubscriptionPlan | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }

    return data as SubscriptionPlan;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }
}

/**
 * Get a specific subscription plan by ID
 */
export async function getSubscriptionPlan(
  planId: string
): Promise<SubscriptionPlan | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }

    return data as SubscriptionPlan;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Get organization's active subscription
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<Subscription | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'trialing'])
      .single();

    if (error) {
      // No active subscription is not an error
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Get subscription with plan details
 */
export async function getSubscriptionWithPlan(
  organizationId: string
): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'trialing'])
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription with plan:', error);
      return null;
    }

    return data as Subscription & { plan: SubscriptionPlan };
  } catch (error) {
    console.error('Error fetching subscription with plan:', error);
    return null;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(params: {
  organizationId: string;
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  billingCycle?: BillingCycle;
  status?: SubscriptionStatus;
  trialEnd?: string;
  metadata?: Record<string, unknown>;
}): Promise<Subscription | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: params.organizationId,
        plan_id: params.planId,
        stripe_customer_id: params.stripeCustomerId || null,
        stripe_subscription_id: params.stripeSubscriptionId || null,
        stripe_price_id: params.stripePriceId || null,
        billing_cycle: params.billingCycle || 'monthly',
        status: params.status || 'active',
        trial_end: params.trialEnd || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: {
    planId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status?: SubscriptionStatus;
    billingCycle?: BillingCycle;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    trialEnd?: string;
    cancelAt?: string;
    canceledAt?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<Subscription | null> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (updates.planId !== undefined)
      updateData.plan_id = updates.planId;
    if (updates.stripeSubscriptionId !== undefined)
      updateData.stripe_subscription_id = updates.stripeSubscriptionId;
    if (updates.stripePriceId !== undefined)
      updateData.stripe_price_id = updates.stripePriceId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.billingCycle !== undefined)
      updateData.billing_cycle = updates.billingCycle;
    if (updates.currentPeriodStart !== undefined)
      updateData.current_period_start = updates.currentPeriodStart;
    if (updates.currentPeriodEnd !== undefined)
      updateData.current_period_end = updates.currentPeriodEnd;
    if (updates.trialEnd !== undefined)
      updateData.trial_end = updates.trialEnd;
    if (updates.cancelAt !== undefined)
      updateData.cancel_at = updates.cancelAt;
    if (updates.canceledAt !== undefined)
      updateData.canceled_at = updates.canceledAt;
    if (updates.metadata !== undefined)
      updateData.metadata = updates.metadata;

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAt?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: cancelAt ? 'active' : 'canceled',
        cancel_at: cancelAt || null,
        canceled_at: cancelAt ? null : new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Record usage for an organization
 */
export async function recordUsage(params: {
  organizationId: string;
  metricName: string;
  quantity: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}): Promise<UsageRecord | null> {
  try {
    const supabase = await createClient();

    // Get current subscription and billing period
    const subscription = await getOrganizationSubscription(
      params.organizationId
    );

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (
      subscription?.current_period_start &&
      subscription?.current_period_end
    ) {
      periodStart = new Date(subscription.current_period_start);
      periodEnd = new Date(subscription.current_period_end);
    } else {
      // Default to current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const { data, error } = await supabase
      .from('usage_records')
      .insert({
        organization_id: params.organizationId,
        subscription_id: subscription?.id || null,
        metric_name: params.metricName,
        quantity: params.quantity,
        unit: params.unit || 'count',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording usage:', error);
      return null;
    }

    return data as UsageRecord;
  } catch (error) {
    console.error('Error recording usage:', error);
    return null;
  }
}

/**
 * Get current usage for a metric
 */
export async function getCurrentUsage(
  organizationId: string,
  metricName: string
): Promise<number> {
  try {
    const supabase = await createClient();

    // Get current billing period
    const subscription = await getOrganizationSubscription(organizationId);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (
      subscription?.current_period_start &&
      subscription?.current_period_end
    ) {
      periodStart = new Date(subscription.current_period_start);
      periodEnd = new Date(subscription.current_period_end);
    } else {
      // Default to current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const { data, error } = await supabase
      .from('usage_records')
      .select('quantity')
      .eq('organization_id', organizationId)
      .eq('metric_name', metricName)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (error) {
      console.error('Error fetching usage:', error);
      return 0;
    }

    return data.reduce((sum, record) => sum + record.quantity, 0);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return 0;
  }
}

/**
 * Check if organization has exceeded usage limit
 */
export async function checkUsageLimit(
  organizationId: string,
  metricName: string
): Promise<{ allowed: boolean; currentUsage: number; limit: number }> {
  try {
    const subscriptionWithPlan = await getSubscriptionWithPlan(organizationId);

    // Default to free plan if no subscription
    let limits: PlanLimits;
    if (subscriptionWithPlan?.plan) {
      limits = subscriptionWithPlan.plan.limits;
    } else {
      const freePlan = await getSubscriptionPlanByName('free');
      limits = freePlan?.limits || {
        messages_per_month: 100,
        tokens_per_month: 50000,
        documents: 10,
        team_members: 1,
        sessions: 5,
        api_calls_per_day: 100,
      };
    }

    // Get limit for metric
    const limit = (limits as unknown as Record<string, number>)[metricName] || 0;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, currentUsage: 0, limit: -1 };
    }

    // Get current usage
    const currentUsage = await getCurrentUsage(organizationId, metricName);

    return {
      allowed: currentUsage < limit,
      currentUsage,
      limit,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: false, currentUsage: 0, limit: 0 };
  }
}

/**
 * Get all usage for organization in current period
 */
export async function getOrganizationUsage(
  organizationId: string
): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();

    // Get current billing period
    const subscription = await getOrganizationSubscription(organizationId);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (
      subscription?.current_period_start &&
      subscription?.current_period_end
    ) {
      periodStart = new Date(subscription.current_period_start);
      periodEnd = new Date(subscription.current_period_end);
    } else {
      // Default to current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const { data, error } = await supabase
      .from('usage_records')
      .select('metric_name, quantity')
      .eq('organization_id', organizationId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (error) {
      console.error('Error fetching organization usage:', error);
      return {};
    }

    // Aggregate by metric
    const usage: Record<string, number> = {};
    data.forEach((record) => {
      usage[record.metric_name] =
        (usage[record.metric_name] || 0) + record.quantity;
    });

    return usage;
  } catch (error) {
    console.error('Error fetching organization usage:', error);
    return {};
  }
}

// ============================================================================
// PAYMENT HISTORY
// ============================================================================

/**
 * Create payment record
 */
export async function createPaymentRecord(params: {
  organizationId: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount: number;
  currency?: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded' | 'canceled';
  invoiceUrl?: string;
  invoicePdf?: string;
  description?: string;
  paidAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaymentHistory | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payment_history')
      .insert({
        organization_id: params.organizationId,
        subscription_id: params.subscriptionId || null,
        stripe_invoice_id: params.stripeInvoiceId || null,
        stripe_payment_intent_id: params.stripePaymentIntentId || null,
        stripe_charge_id: params.stripeChargeId || null,
        amount: params.amount,
        currency: params.currency || 'usd',
        status: params.status,
        invoice_url: params.invoiceUrl || null,
        invoice_pdf: params.invoicePdf || null,
        description: params.description || null,
        paid_at: params.paidAt || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      return null;
    }

    return data as PaymentHistory;
  } catch (error) {
    console.error('Error creating payment record:', error);
    return null;
  }
}

/**
 * Get payment history for organization
 */
export async function getPaymentHistory(
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<PaymentHistory[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('payment_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('paid_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data as PaymentHistory[];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}
