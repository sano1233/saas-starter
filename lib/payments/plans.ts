export type PricingPlan = {
  id: string;
  name: string;
  priceInCents: number;
  currency: string;
  interval: 'month' | 'year';
  trialDays: number;
  features: string[];
  description?: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'base-plan',
    name: 'Base',
    priceInCents: 800,
    currency: 'USD',
    interval: 'month',
    trialDays: 7,
    features: [
      'Unlimited Usage',
      'Unlimited Workspace Members',
      'Email Support'
    ]
  },
  {
    id: 'plus-plan',
    name: 'Plus',
    priceInCents: 1200,
    currency: 'USD',
    interval: 'month',
    trialDays: 7,
    features: [
      'Everything in Base, and:',
      'Early Access to New Features',
      '24/7 Support + Slack Access'
    ]
  }
];

export function getPlanById(id: string | null | undefined) {
  if (!id) return null;
  return PRICING_PLANS.find((plan) => plan.id === id) ?? null;
}
