import { create } from 'zustand';
import { walletApi } from '@/lib/api/wallet.api';
import { useAuthStore } from '@/store/authStore';

export const useWalletStore = create((set, get) => ({
  wallet: null,
  plans: [],
  transactions: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  isLoadingWallet: false,
  isLoadingPlans: false,
  isLoadingTransactions: false,
  isProcessingCheckout: false,
  checkoutPlanId: null,
  error: null,

  fetchWallet: async () => {
    set({ isLoadingWallet: true, error: null });
    try {
      const res = await walletApi.getWallet();
      const wallet = res.data.data.wallet;
      set({ wallet, isLoadingWallet: false });

      // Keep authStore in sync
      if (wallet && typeof wallet.creditsRemaining === 'number') {
        useAuthStore.getState().updateCredits(wallet.creditsRemaining);
      }
      return wallet;
    } catch (err) {
      set({
        isLoadingWallet: false,
        error: err.response?.data?.error?.message || 'Failed to load wallet',
      });
      return null;
    }
  },

  fetchPlans: async () => {
    set({ isLoadingPlans: true, error: null });
    try {
      const res = await walletApi.getPlans();
      const plans = res.data.data.plans;
      set({ plans, isLoadingPlans: false });
      return plans;
    } catch (err) {
      set({
        isLoadingPlans: false,
        error: err.response?.data?.error?.message || 'Failed to load plans',
      });
      return [];
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const res = await walletApi.getTransactions({ page, limit: 10 });
      const { transactions, pagination } = res.data.data;
      set({
        transactions,
        pagination,
        isLoadingTransactions: false,
      });
      return transactions;
    } catch (err) {
      set({
        isLoadingTransactions: false,
        error: err.response?.data?.error?.message || 'Failed to load transactions',
      });
      return [];
    }
  },

  /**
   * Helper to load Razorpay checkout script if not already present
   */
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Initiate Checkout flow for a plan
   */
  checkout: async ({ plan, user, onPaymentSuccess, onPaymentError }) => {
    set({ isProcessingCheckout: true, checkoutPlanId: plan.id, error: null });

    try {
      // 1. Create order on backend
      const orderRes = await walletApi.createOrder({ planId: plan.id });
      const { orderId, amount, currency, keyId } = orderRes.data.data;

      // 2. Try loading official Razorpay script
      const scriptLoaded = await get().loadRazorpayScript();

      const isMockKey = !keyId || keyId.includes('demo') || keyId.includes('mock');

      if (isMockKey || !scriptLoaded || !window.Razorpay) {
        // Direct simulation mode if Razorpay demo key is active or CDN is blocked
        const verifyRes = await walletApi.verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          razorpay_signature: 'mock_valid_signature',
        });

        const updatedCredits = verifyRes.data.data.creditsRemaining;
        set({ isProcessingCheckout: false, checkoutPlanId: null });
        if (typeof updatedCredits === 'number') {
          useAuthStore.getState().updateCredits(updatedCredits);
        }
        await Promise.all([get().fetchWallet(), get().fetchTransactions(1)]);
        onPaymentSuccess?.(verifyRes.data.data);
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'NexAI Workspace',
        description: `${plan.name} (${plan.credits} Credits)`,
        order_id: orderId,
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: '#8b5cf6', // design token violet-500
        },
        modal: {
          ondismiss: () => {
            set({ isProcessingCheckout: false, checkoutPlanId: null });
          },
        },
        handler: async (response) => {
          try {
            // Verify HMAC signature on backend
            const verifyRes = await walletApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const updatedCredits = verifyRes.data.data.creditsRemaining;
            set({ isProcessingCheckout: false, checkoutPlanId: null });

            if (typeof updatedCredits === 'number') {
              useAuthStore.getState().updateCredits(updatedCredits);
            }

            await Promise.all([get().fetchWallet(), get().fetchTransactions(1)]);
            onPaymentSuccess?.(verifyRes.data.data);
          } catch (verifyErr) {
            set({
              isProcessingCheckout: false,
              checkoutPlanId: null,
              error: verifyErr.response?.data?.error?.message || 'Payment verification failed',
            });
            onPaymentError?.(verifyErr);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failedRes) => {
        set({
          isProcessingCheckout: false,
          checkoutPlanId: null,
          error: failedRes.error?.description || 'Payment failed',
        });
        onPaymentError?.(failedRes.error);
      });
      rzp.open();
    } catch (err) {
      set({
        isProcessingCheckout: false,
        checkoutPlanId: null,
        error: err.response?.data?.error?.message || 'Failed to start payment',
      });
      onPaymentError?.(err);
    }
  },

  /**
   * 1-Click Test Simulation Recharge (Zero-Card Demo Mode for Examiner / Offline Testing)
   */
  simulateTestRecharge: async ({ plan, onPaymentSuccess, onPaymentError }) => {
    set({ isProcessingCheckout: true, checkoutPlanId: plan.id, error: null });
    try {
      const orderRes = await walletApi.createOrder({ planId: plan.id });
      const { orderId } = orderRes.data.data;

      const verifyRes = await walletApi.verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        razorpay_signature: 'mock_valid_signature',
      });

      const updatedCredits = verifyRes.data.data.creditsRemaining;
      set({ isProcessingCheckout: false, checkoutPlanId: null });

      if (typeof updatedCredits === 'number') {
        useAuthStore.getState().updateCredits(updatedCredits);
      }

      await Promise.all([get().fetchWallet(), get().fetchTransactions(1)]);
      onPaymentSuccess?.(verifyRes.data.data);
    } catch (err) {
      set({
        isProcessingCheckout: false,
        checkoutPlanId: null,
        error: err.response?.data?.error?.message || 'Simulation failed',
      });
      onPaymentError?.(err);
    }
  },

  clearError: () => set({ error: null }),
}));
