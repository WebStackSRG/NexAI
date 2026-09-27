import * as razorpayService from '../services/razorpay.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/webhooks/razorpay
 * Public webhook handler for Razorpay asynchronous payment events.
 * Requires raw body buffer to compute HMAC SHA256 signature.
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
    throw new ApiError(400, 'EMPTY_BODY', 'Webhook payload body is missing');
  }

  // 1. Verify HMAC SHA256 against RAZORPAY_WEBHOOK_SECRET
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.warn({ signature }, 'Rejected Razorpay webhook with invalid HMAC signature');
    throw new ApiError(400, 'INVALID_WEBHOOK_SIGNATURE', 'Invalid Razorpay webhook signature');
  }

  // 2. Parse raw buffer to JSON
  let payload;
  try {
    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : String(rawBody);
    payload = JSON.parse(rawString);
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Malformed webhook JSON payload');
  }

  const { event, payload: eventPayload } = payload;
  logger.info({ event }, 'Received verified Razorpay webhook event');

  // 3. Handle successful payment events (payment.captured, order.paid)
  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = eventPayload?.payment?.entity;
    const order = eventPayload?.order?.entity;

    const paymentId = payment?.id;
    const orderId = payment?.order_id || order?.id;
    const amountINR = payment?.amount
      ? payment.amount / 100
      : order?.amount_paid
        ? order.amount_paid / 100
        : undefined;

    const userId = payment?.notes?.userId || order?.notes?.userId;
    const planId = payment?.notes?.planId || order?.notes?.planId;

    if (paymentId) {
      await razorpayService.processSuccessfulPayment({
        paymentId,
        orderId,
        planId,
        userId,
        amountINR,
        source: 'webhook',
      });
    }
  }

  // Always acknowledge received events with HTTP 200 to satisfy Razorpay webhook delivery
  res.status(200).json({
    status: 'ok',
    received: true,
  });
});
