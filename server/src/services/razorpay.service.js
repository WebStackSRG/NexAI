import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { getPlanById } from '../config/plans.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Creates a Razorpay order and records a pending transaction in the ledger.
 *
 * @param {object} params
 * @param {string} params.planId - Server-defined plan identifier
 * @param {string} params.userId - Authenticated user ID
 * @returns {Promise<{ orderId: string, amount: number, currency: string, keyId: string }>}
 */
export async function createOrder({ planId, userId }) {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new ApiError(400, 'INVALID_PLAN', `Plan '${planId}' does not exist`);
  }

  let orderId = '';

  // If Razorpay live/test credentials are provided, call official Razorpay Orders REST API
  if (
    env.RAZORPAY_KEY_ID &&
    env.RAZORPAY_KEY_SECRET &&
    !env.RAZORPAY_KEY_ID.includes('mock')
  ) {
    try {
      const authHeader = `Basic ${Buffer.from(
        `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`,
      ).toString('base64')}`;

      const receipt = `rcpt_${String(userId).slice(-6)}_${Date.now()}`.slice(0, 40);

      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.amountPaise,
          currency: 'INR',
          receipt,
          notes: {
            userId: String(userId),
            planId: plan.id,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        logger.error({ errorData }, 'Failed to create order on Razorpay');
        throw new Error(errorData.error?.description || 'Razorpay order creation failed');
      }

      const orderData = await res.json();
      orderId = orderData.id;
    } catch (err) {
      logger.error({ err }, 'Razorpay API error, falling back to test order');
      // If external network is down or test keys fail during development, generate fallback test order
      if (process.env.NODE_ENV !== 'production') {
        orderId = `order_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      } else {
        throw new ApiError(502, 'PAYMENT_GATEWAY_ERROR', err.message || 'Payment gateway unreachable');
      }
    }
  } else {
    // Development/Test simulated order
    orderId = `order_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Pre-record pending transaction in the ledger
  await Transaction.create({
    userId,
    amountINR: plan.amountINR,
    creditsAdded: plan.credits,
    orderId,
    planId: plan.id,
    status: 'pending',
    paymentGateway: 'razorpay_test',
  });

  return {
    orderId,
    amount: plan.amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID || 'rzp_test_nexai_demo',
  };
}

/**
 * Verifies Razorpay Checkout HMAC SHA256 payment signature.
 *
 * @param {object} params
 * @param {string} params.razorpay_order_id
 * @param {string} params.razorpay_payment_id
 * @param {string} params.razorpay_signature
 * @returns {boolean}
 */
export function verifyPaymentSignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
    return false;
  }

  // Allow explicit dev mock signature for test recharge button in non-production
  if (
    process.env.NODE_ENV !== 'production' &&
    razorpay_signature === 'mock_valid_signature'
  ) {
    return true;
  }

  const secret = env.RAZORPAY_KEY_SECRET || 'nexai_dev_razorpay_secret';
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto.createHmac('sha256', secret).update(text).digest('hex');

  const matchesExpected =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  return matchesExpected;
}

/**
 * Verifies Razorpay raw webhook HMAC SHA256 signature.
 *
 * @param {Buffer|string} rawBody - Raw unparsed request body Buffer
 * @param {string} signature - Value of X-Razorpay-Signature header
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;

  // Allow explicit dev mock signature in non-production
  if (
    process.env.NODE_ENV !== 'production' &&
    signature === 'mock_valid_webhook_signature'
  ) {
    return true;
  }

  const secret =
    env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET || 'nexai_dev_webhook_secret';

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '', 'utf-8');
  const expectedSignature = crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex');

  const matchesExpected =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  return matchesExpected;
}

/**
 * Idempotently processes a successful payment and credits the user's wallet.
 * Ensures that even if verify and webhook arrive concurrently or repeatedly,
 * the transaction ledger is updated and credits are added EXACTLY ONCE.
 *
 * @param {object} params
 * @param {string} params.paymentId - Razorpay payment ID (e.g. pay_123456)
 * @param {string} params.orderId - Razorpay order ID (e.g. order_123456)
 * @param {string} [params.planId] - Optional plan ID
 * @param {string} [params.userId] - Optional user ID
 * @param {number} [params.amountINR] - Optional amount in rupees
 * @param {number} [params.creditsAdded] - Optional credits to add
 * @param {string} [params.source='verify'] - Source of credit invocation ('verify' | 'webhook')
 * @returns {Promise<{ credited: boolean, alreadyProcessed: boolean, transaction: object, creditsRemaining?: number }>}
 */
export async function processSuccessfulPayment({
  paymentId,
  orderId,
  planId,
  userId,
  amountINR,
  creditsAdded,
  source = 'verify',
}) {
  if (!paymentId) {
    throw new ApiError(400, 'PAYMENT_ID_REQUIRED', 'Payment ID is required to process recharge');
  }

  // 1. Check if a transaction with this paymentId has already been successfully recorded
  const alreadySuccess = await Transaction.findOne({ paymentId, status: 'success' });
  if (alreadySuccess) {
    const user = await User.findById(alreadySuccess.userId).select('wallet');
    return {
      credited: false,
      alreadyProcessed: true,
      transaction: alreadySuccess,
      creditsRemaining: user?.wallet?.creditsRemaining,
    };
  }

  let transaction = null;

  // 2. Concurrency protection: Try atomic transition of pending transaction for this order
  if (orderId) {
    transaction = await Transaction.findOneAndUpdate(
      {
        orderId,
        status: { $ne: 'success' },
      },
      {
        $set: {
          paymentId,
          status: 'success',
          ...(planId ? { planId } : {}),
          ...(amountINR ? { amountINR } : {}),
          ...(creditsAdded ? { creditsAdded } : {}),
        },
      },
      { new: true },
    );
  }

  // If findOneAndUpdate returned null, either:
  // (a) Another concurrent request just flipped it to 'success'
  // (b) No pending transaction was created for this orderId
  if (!transaction) {
    // Check if another concurrent request completed it
    const existing = await Transaction.findOne({
      $or: [{ paymentId, status: 'success' }, { orderId, status: 'success' }],
    });

    if (existing) {
      const user = await User.findById(existing.userId).select('wallet');
      return {
        credited: false,
        alreadyProcessed: true,
        transaction: existing,
        creditsRemaining: user?.wallet?.creditsRemaining,
      };
    }

    // No transaction existed yet (e.g. direct webhook arrived first without prior order record)
    // Create new with paymentId unique constraint
    try {
      transaction = await Transaction.create({
        userId,
        amountINR: amountINR || 0,
        creditsAdded: creditsAdded || 0,
        orderId,
        planId,
        paymentId,
        status: 'success',
        paymentGateway: 'razorpay_test',
      });
    } catch (err) {
      if (err.code === 11000) {
        // Unique index collision: concurrent worker succeeded just before us
        const dupTx = await Transaction.findOne({ paymentId });
        const user = await User.findById(dupTx?.userId || userId).select('wallet');
        return {
          credited: false,
          alreadyProcessed: true,
          transaction: dupTx,
          creditsRemaining: user?.wallet?.creditsRemaining,
        };
      }
      throw err;
    }
  }

  // 3. ATOMIC CREDIT: At this point, this execution uniquely holds the transition lock.
  // Resolve plan and exact credits to add.
  const resolvedPlan = getPlanById(transaction.planId || planId);
  const finalCredits = transaction.creditsAdded || creditsAdded || resolvedPlan?.credits || 0;
  const targetUserId = transaction.userId || userId;

  const updateOps = {
    $inc: { 'wallet.creditsRemaining': finalCredits },
  };

  // If purchasing pro tier, elevate tier
  if (resolvedPlan?.tier === 'pro_monthly') {
    updateOps.$set = { 'wallet.tier': 'pro_monthly' };
  }

  const updatedUser = await User.findByIdAndUpdate(targetUserId, updateOps, { new: true });

  logger.info(
    {
      source,
      paymentId,
      orderId,
      userId: targetUserId,
      creditsAdded: finalCredits,
      newBalance: updatedUser?.wallet?.creditsRemaining,
    },
    'Successfully credited user wallet via idempotent payment ledger',
  );

  return {
    credited: true,
    alreadyProcessed: false,
    transaction,
    creditsRemaining: updatedUser?.wallet?.creditsRemaining,
  };
}
