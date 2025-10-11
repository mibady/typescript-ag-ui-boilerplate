/**
 * Stripe Checkout Session API
 * Phase 6: Billing & Subscriptions
 *
 * Creates a Stripe Checkout session for subscription
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSubscriptionPlan } from '@/lib/db/subscriptions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, billingCycle = 'monthly' } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await getSubscriptionPlan(planId);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get price ID based on billing cycle
    const priceId =
      billingCycle === 'yearly'
        ? plan.stripe_price_id_yearly
        : plan.stripe_price_id_monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this plan' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    const customer = await getOrCreateCustomer(userId, orgId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        organization_id: orgId,
        user_id: userId,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          organization_id: orgId,
          user_id: userId,
          plan_id: planId,
        },
        trial_period_days: plan.name === 'pro' ? 14 : undefined, // 14-day trial for Pro
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * Get or create Stripe customer for organization
 */
async function getOrCreateCustomer(
  userId: string,
  orgId: string
): Promise<Stripe.Customer> {
  // Search for existing customer
  const customers = await stripe.customers.list({
    email: `org-${orgId}@placeholder.com`, // You'd use actual org email
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: `org-${orgId}@placeholder.com`, // Replace with actual org email
    metadata: {
      organization_id: orgId,
      user_id: userId,
    },
  });

  return customer;
}
