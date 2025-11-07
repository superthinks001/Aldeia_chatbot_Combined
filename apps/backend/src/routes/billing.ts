import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth/authenticate.middleware';
import StripeService, { SubscriptionTier, SUBSCRIPTION_PLANS } from '../services/billing/stripe.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/billing/plans
 * Get available subscription plans
 */
router.get('/plans', (req: Request, res: Response) => {
  try {
    res.json({
      plans: Object.values(SUBSCRIPTION_PLANS),
    });
  } catch (error) {
    logger.error('Error getting plans:', error);
    res.status(500).json({ error: 'Failed to retrieve plans' });
  }
});

/**
 * GET /api/billing/subscription
 * Get user's current subscription details
 */
router.get('/subscription', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.userId);
    const subscription = await StripeService.getUserSubscription(userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ subscription });
  } catch (error) {
    logger.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription' });
  }
});

/**
 * POST /api/billing/checkout
 * Create a checkout session for subscription upgrade
 */
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.userId);
    const { tier } = req.body;

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    if (tier === SubscriptionTier.FREE) {
      return res.status(400).json({ error: 'Cannot checkout for free tier' });
    }

    const successUrl = `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/billing/canceled`;

    const session = await StripeService.createCheckoutSession(
      userId,
      tier as SubscriptionTier,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

/**
 * POST /api/billing/portal
 * Create a billing portal session for managing subscription
 */
router.post('/portal', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.userId);
    const returnUrl = `${process.env.FRONTEND_URL}/billing`;

    const session = await StripeService.createPortalSession(userId, returnUrl);

    res.json({
      url: session.url,
    });
  } catch (error: any) {
    logger.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message || 'Failed to create portal session' });
  }
});

/**
 * POST /api/billing/webhook
 * Stripe webhook endpoint for handling events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    // Get raw body (must be configured in express to keep raw body for webhooks)
    const event = StripeService.constructWebhookEvent(
      req.body,
      signature
    );

    // Handle the event
    await StripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

/**
 * GET /api/billing/usage
 * Get user's usage statistics
 */
router.get('/usage', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.userId);
    const subscription = await StripeService.getUserSubscription(userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const usagePercentage =
      subscription.messagesLimit === -1
        ? 0
        : (subscription.messagesUsed / subscription.messagesLimit) * 100;

    res.json({
      usage: {
        messagesUsed: subscription.messagesUsed,
        messagesLimit: subscription.messagesLimit,
        usagePercentage: Math.round(usagePercentage),
        unlimited: subscription.messagesLimit === -1,
      },
    });
  } catch (error) {
    logger.error('Error getting usage:', error);
    res.status(500).json({ error: 'Failed to retrieve usage' });
  }
});

/**
 * GET /api/billing/can-send-message
 * Check if user can send a message (within quota)
 */
router.get('/can-send-message', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.userId);
    const canSend = await StripeService.canUserSendMessage(userId);

    res.json({
      canSend,
      message: canSend ? 'You can send a message' : 'Message limit reached for your plan',
    });
  } catch (error) {
    logger.error('Error checking message quota:', error);
    res.status(500).json({ error: 'Failed to check message quota' });
  }
});

export default router;
