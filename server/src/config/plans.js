/**
 * Server-side recharge plans and pricing configuration.
 *
 * Golden Rule: Plans, amounts, and credits are defined ONLY on the server.
 * The client never specifies credit amounts or prices.
 */

export const PLANS = [
  {
    id: 'starter_pack',
    name: 'Starter Top-Up',
    description: 'Perfect for quick tests, assignments, and light chat sessions',
    amountINR: 49,
    amountPaise: 4900,
    credits: 500,
    tier: 'free',
    badge: null,
    popular: false,
    features: [
      '500 AI credits (~50,000 tokens)',
      'Gemini 3.8 Flash access',
      'Personal Library storage',
      'PDF & Document export',
    ],
  },
  {
    id: 'pro_pack',
    name: 'Pro Developer Pack',
    description: 'Best value for active development, mock interviews, and project workspaces',
    amountINR: 99,
    amountPaise: 9900,
    credits: 1200,
    tier: 'free',
    badge: 'Popular',
    popular: true,
    features: [
      '1,200 AI credits (~120,000 tokens)',
      'Gemini Flash & Pro models',
      'Priority SSE streaming',
      'AI Mock Interview simulations',
      'Full Library & Hybrid Search',
    ],
  },
  {
    id: 'power_pack',
    name: 'Power Studio Tier',
    description: 'Massive capacity for extensive document drafting, capstone prep, and heavy usage',
    amountINR: 249,
    amountPaise: 24900,
    credits: 3500,
    tier: 'pro_monthly',
    badge: 'Best Value',
    popular: false,
    features: [
      '3,500 AI credits (~350,000 tokens)',
      'Pro Monthly tier upgrade',
      'Unlimited project workspaces',
      'Comprehensive interview analytics',
      'Full cross-domain vector search',
    ],
  },
];

/**
 * Find plan by its unique ID
 * @param {string} planId
 * @returns {object|undefined}
 */
export function getPlanById(planId) {
  return PLANS.find((plan) => plan.id === planId);
}
