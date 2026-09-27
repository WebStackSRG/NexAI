import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

const router = Router();

// Public webhook route for Razorpay payment notifications
router.post('/razorpay', webhookController.handleRazorpayWebhook);

export default router;
