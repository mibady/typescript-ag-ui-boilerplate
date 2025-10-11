/**
 * Stripe Webhook Handler
 * Phase 6: Billing & Subscriptions
 *
 * Handles incoming webhook events from Stripe for subscription lifecycle
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  createSubscription,
  updateSubscription,
  getOrganizationSubscription,
  createPaymentRecord,
  getSubscriptionPlanByName,
} from '@/lib/db/subscriptions';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      // ========================================================================
      // CUSTOMER EVENTS
      // ========================================================================
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;

      // ========================================================================
      // SUBSCRIPTION EVENTS
      // ========================================================================
      case 'customer.subscription.created':
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.trial_will_end':
        await handleSubscriptionTrialWillEnd(
          event.data.object as Stripe.Subscription
        );
        break;

      // ========================================================================
      // PAYMENT EVENTS
      // ========================================================================
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_action_required':
        await handleInvoicePaymentActionRequired(
          event.data.object as Stripe.Invoice
        );
        break;

      // ========================================================================
      // PAYMENT INTENT EVENTS
      // ========================================================================
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      // ========================================================================
      // CHARGE EVENTS
      // ========================================================================
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// CUSTOMER EVENT HANDLERS
// ============================================================================

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);
  // Store customer metadata if needed
  // This is typically handled during checkout session completion
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  // Update customer details in database if needed
}

async function handleCustomerDeleted(customer: Stripe.Customer) {
  console.log('Customer deleted:', customer.id);
  // Handle customer deletion (GDPR compliance)
}

// ============================================================================
// SUBSCRIPTION EVENT HANDLERS
// ============================================================================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  try {
    const organizationId = subscription.metadata.organization_id;
    if (!organizationId) {
      console.error('No organization_id in subscription metadata');
      return;
    }

    // Get plan from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await getPlanFromPriceId(priceId);

    if (!plan) {
      console.error('Could not find plan for price:', priceId);
      return;
    }

    // Create subscription in database
    await createSubscription({
      organizationId,
      planId: plan.id,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      billingCycle: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      status: mapStripeStatus(subscription.status),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : undefined,
      metadata: {
        stripe_metadata: subscription.metadata,
      },
    });

    console.log('Subscription created in database for org:', organizationId);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  try {
    const organizationId = subscription.metadata.organization_id;
    if (!organizationId) {
      console.error('No organization_id in subscription metadata');
      return;
    }

    // Get existing subscription
    const existingSubscription = await getOrganizationSubscription(
      organizationId
    );

    if (!existingSubscription) {
      console.error('Subscription not found for org:', organizationId);
      return;
    }

    // Get plan from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await getPlanFromPriceId(priceId);

    // Update subscription
    await updateSubscription(existingSubscription.id, {
      planId: plan?.id,
      stripePriceId: priceId,
      status: mapStripeStatus(subscription.status),
      billingCycle: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      currentPeriodStart: (subscription as any).current_period_start
        ? new Date((subscription as any).current_period_start * 1000).toISOString()
        : undefined,
      currentPeriodEnd: (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : undefined,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : undefined,
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : undefined,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : undefined,
      metadata: {
        stripe_metadata: subscription.metadata,
      },
    });

    console.log('Subscription updated in database for org:', organizationId);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  try {
    const organizationId = subscription.metadata.organization_id;
    if (!organizationId) {
      console.error('No organization_id in subscription metadata');
      return;
    }

    const existingSubscription = await getOrganizationSubscription(
      organizationId
    );

    if (!existingSubscription) {
      console.error('Subscription not found for org:', organizationId);
      return;
    }

    // Mark subscription as canceled
    await updateSubscription(existingSubscription.id, {
      status: 'canceled',
      canceledAt: new Date().toISOString(),
    });

    console.log('Subscription canceled in database for org:', organizationId);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleSubscriptionTrialWillEnd(
  subscription: Stripe.Subscription
) {
  console.log('Trial will end:', subscription.id);
  // Send email notification to customer
  // TODO: Implement email notification
}

// ============================================================================
// INVOICE EVENT HANDLERS
// ============================================================================

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);

  try {
    const subscriptionId = typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;
    const organizationId = invoice.metadata?.organization_id;

    if (!organizationId) {
      console.log('No organization_id in invoice metadata');
      return;
    }

    const existingSubscription = await getOrganizationSubscription(
      organizationId
    );

    // Create payment record
    await createPaymentRecord({
      organizationId,
      subscriptionId: existingSubscription?.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      description: invoice.description || undefined,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : undefined,
      metadata: {
        subscription_id: subscriptionId,
      },
    });

    console.log('Payment record created for invoice:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  try {
    const organizationId = invoice.metadata?.organization_id;

    if (!organizationId) {
      console.log('No organization_id in invoice metadata');
      return;
    }

    const existingSubscription = await getOrganizationSubscription(
      organizationId
    );

    // Create payment record
    await createPaymentRecord({
      organizationId,
      subscriptionId: existingSubscription?.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      description: invoice.description || undefined,
      metadata: {
        error: 'Payment failed',
      },
    });

    // Send email notification
    // TODO: Implement email notification

    console.log('Payment failure recorded for invoice:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log('Invoice payment action required:', invoice.id);
  // Send email with payment link
  // TODO: Implement email notification
}

// ============================================================================
// PAYMENT INTENT EVENT HANDLERS
// ============================================================================

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  // Payment intent success is typically handled via invoice.paid
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  // Payment intent failure is typically handled via invoice.payment_failed
}

// ============================================================================
// CHARGE EVENT HANDLERS
// ============================================================================

async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log('Charge succeeded:', charge.id);
  // Charge success is typically handled via invoice.paid
}

async function handleChargeFailed(charge: Stripe.Charge) {
  console.log('Charge failed:', charge.id);
  // Charge failure is typically handled via invoice.payment_failed
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  try {
    const invoiceId = typeof (charge as any).invoice === 'string'
      ? (charge as any).invoice
      : (charge as any).invoice?.id;
    if (!invoiceId) return;

    // Find payment record and update status
    // TODO: Implement refund handling in payment_history table
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Stripe subscription status to our status enum
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' {
  const statusMap: Record<
    Stripe.Subscription.Status,
    'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  > = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid: 'unpaid',
    paused: 'active', // Treat paused as active
  };

  return statusMap[stripeStatus] || 'active';
}

/**
 * Get plan from Stripe price ID
 */
async function getPlanFromPriceId(priceId: string) {
  // In production, you'd store price IDs in the database
  // For now, we'll use environment variables or config

  const plans = await Promise.all([
    getSubscriptionPlanByName('free'),
    getSubscriptionPlanByName('pro'),
    getSubscriptionPlanByName('enterprise'),
  ]);

  for (const plan of plans) {
    if (
      plan?.stripe_price_id_monthly === priceId ||
      plan?.stripe_price_id_yearly === priceId
    ) {
      return plan;
    }
  }

  return null;
}
