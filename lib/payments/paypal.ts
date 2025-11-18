import { redirect } from 'next/navigation';
import type { Team } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { getPlanById, PRICING_PLANS } from './plans';

type PayPalOrderMetadata = {
  teamId: number;
  userId: number;
  planId: string;
};

type PayPalLink = {
  href: string;
  rel: string;
  method: string;
};

type PayPalPurchaseUnit = {
  custom_id?: string;
  amount?: {
    currency_code: string;
    value: string;
  };
};

type PayPalOrderResponse = {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: PayPalPurchaseUnit[];
  payer?: {
    payer_id?: string;
    name?: { given_name?: string; surname?: string };
    email_address?: string;
  };
};

const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
const PAYPAL_API_BASE =
  process.env.PAYPAL_BASE_URL ||
  (PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com');
const PAYPAL_PORTAL_URL =
  process.env.PAYPAL_PORTAL_URL ||
  (PAYPAL_ENV === 'live'
    ? 'https://www.paypal.com/myaccount/autopay/'
    : 'https://www.sandbox.paypal.com/myaccount/autopay/');

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_API_KEY;
const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET;

let cachedToken: { token: string; expiresAt: number } | null = null;

function ensurePayPalCredentials() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are not configured');
  }
}

async function getPayPalAccessToken() {
  ensurePayPalCredentials();

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
          'base64'
        ),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });

  if (!response.ok) {
    throw new Error('Unable to retrieve PayPal access token');
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000
  };

  return data.access_token as string;
}

export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const plan = getPlanById(priceId);
  if (!plan) {
    throw new Error('Invalid plan selected');
  }

  const order = await createPayPalOrder({
    planId: plan.id,
    teamId: team.id,
    userId: user.id,
    amount: (plan.priceInCents / 100).toFixed(2),
    currency: plan.currency
  });

  const approvalLink = order.links?.find((link) => link.rel === 'approve');
  if (!approvalLink?.href) {
    throw new Error('Unable to create PayPal checkout link');
  }

  redirect(approvalLink.href);
}

async function createPayPalOrder({
  planId,
  teamId,
  userId,
  amount,
  currency
}: {
  planId: string;
  teamId: number;
  userId: number;
  amount: string;
  currency: string;
}) {
  const token = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `${teamId}`,
          custom_id: JSON.stringify({ planId, teamId, userId }),
          amount: {
            currency_code: currency,
            value: amount
          },
          description: `${planId} subscription`
        }
      ],
      application_context: {
        brand_name: 'ACME',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.BASE_URL}/api/paypal/capture`,
        cancel_url: `${process.env.BASE_URL}/pricing`
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order creation failed: ${error}`);
  }

  return (await response.json()) as PayPalOrderResponse;
}

export async function createCustomerPortalSession() {
  return {
    url: PAYPAL_PORTAL_URL
  };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to capture PayPal order: ${error}`);
  }

  return (await response.json()) as PayPalOrderResponse;
}

export function parsePayPalMetadata(
  purchaseUnits: PayPalPurchaseUnit[] | undefined
): PayPalOrderMetadata | null {
  if (!purchaseUnits || purchaseUnits.length === 0) {
    return null;
  }
  const custom = purchaseUnits[0]?.custom_id;
  if (!custom) {
    return null;
  }
  try {
    return JSON.parse(custom) as PayPalOrderMetadata;
  } catch {
    return null;
  }
}

export function getAllPlans() {
  return PRICING_PLANS;
}
