import Stripe from 'stripe';
import { supabase } from '../../config/database';
import { logger } from '../../utils/logger';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // in cents
  messagesLimit: number;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
}

// Subscription plans
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free Tier',
    price: 0,
    messagesLimit: 10,
    features: [
      '10 messages per day',
      'Basic fire recovery information',
      'Community support',
    ],
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    name: 'Pro Tier',
    price: 9999, // $99.99
    messagesLimit: 100,
    features: [
      '100 messages per day',
      'Voice input/output',
      'Multilingual support',
      'Priority support',
      'Conversation history',
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise Tier',
    price: 49999, // $499.99
    messagesLimit: -1, // unlimited
    features: [
      'Unlimited messages',
      'All Pro features',
      'Custom integrations',
      'Dedicated support',
      'API access',
      'Multi-user organization',
    ],
  },
};

export class StripeService {
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(
    userId: number,
    email: string,
    name?: string
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString(),
        },
      });

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      logger.info(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer.id;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get or create Stripe customer ID for a user
   */
  static async getOrCreateCustomer(
    userId: number,
    email: string,
    name?: string
  ): Promise<string> {
    // Check if user already has a customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (user?.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    // Create new customer
    return await this.createCustomer(userId, email, name);
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: number,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const plan = SUBSCRIPTION_PLANS[tier];

      if (!plan.stripePriceId) {
        throw new Error(`No Stripe price ID configured for ${tier} tier`);
      }

      // Get user info
      const { data: user } = await supabase
        .from('users')
        .select('email, name, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create customer
      const customerId = await this.getOrCreateCustomer(userId, user.email, user.name);

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString(),
          tier,
        },
      });

      logger.info(`Created checkout session ${session.id} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  static async createPortalSession(
    userId: number,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!user?.stripe_customer_id) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      logger.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhookEvent(
    event: Stripe.Event
  ): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle subscription created/updated
   */
  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const userId = parseInt(subscription.metadata.userId);
    const tier = subscription.metadata.tier as SubscriptionTier;

    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        tier,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000),
        current_period_end: new Date((subscription as any).current_period_end * 1000),
      });

    logger.info(`Updated subscription for user ${userId} to ${tier}`);
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = parseInt(subscription.metadata.userId);

    // Downgrade to free tier
    await supabase
      .from('subscriptions')
      .update({
        tier: SubscriptionTier.FREE,
        status: 'canceled',
      })
      .eq('stripe_subscription_id', subscription.id);

    logger.info(`Subscription canceled for user ${userId}, downgraded to free tier`);
  }

  /**
   * Handle payment succeeded
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`Payment succeeded for invoice ${invoice.id}`);
    // Additional logic for successful payments (e.g., send receipt email)
  }

  /**
   * Handle payment failed
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.warn(`Payment failed for invoice ${invoice.id}`);
    // Additional logic for failed payments (e.g., send notification)
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: number): Promise<{
    tier: SubscriptionTier;
    status: string;
    messagesUsed: number;
    messagesLimit: number;
    currentPeriodEnd?: Date;
  } | null> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!subscription) {
        // Return free tier by default
        return {
          tier: SubscriptionTier.FREE,
          status: 'active',
          messagesUsed: 0,
          messagesLimit: SUBSCRIPTION_PLANS[SubscriptionTier.FREE].messagesLimit,
        };
      }

      // Get usage quota
      const { data: quota } = await supabase
        .from('usage_quotas')
        .select('messages_used, messages_limit')
        .eq('user_id', userId)
        .gte('period_end', new Date().toISOString())
        .single();

      return {
        tier: subscription.tier,
        status: subscription.status,
        messagesUsed: quota?.messages_used || 0,
        messagesLimit: quota?.messages_limit || SUBSCRIPTION_PLANS[subscription.tier as SubscriptionTier].messagesLimit,
        currentPeriodEnd: subscription.current_period_end,
      };
    } catch (error) {
      logger.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Check if user can send a message (within quota)
   */
  static async canUserSendMessage(userId: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return false;
    }

    // Unlimited for enterprise
    if (subscription.messagesLimit === -1) {
      return true;
    }

    return subscription.messagesUsed < subscription.messagesLimit;
  }

  /**
   * Increment user's message usage
   */
  static async incrementMessageUsage(userId: number): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);

    // Get subscription tier
    const subscription = await this.getUserSubscription(userId);
    const messagesLimit = subscription?.messagesLimit || SUBSCRIPTION_PLANS[SubscriptionTier.FREE].messagesLimit;

    // Upsert usage quota
    await supabase.rpc('increment_message_usage', {
      p_user_id: userId,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
      p_messages_limit: messagesLimit,
    });
  }

  /**
   * Construct webhook event from request
   */
  static constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  }
}

export default StripeService;
