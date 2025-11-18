import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder, parsePayPalMetadata } from '@/lib/payments/paypal';
import { getPlanById } from '@/lib/payments/plans';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { setSession } from '@/lib/auth/session';
import type { User } from '@/lib/db/schema';

const USER_SELECT = `
  id,
  name,
  email,
  password_hash:passwordHash,
  role,
  created_at:createdAt,
  updated_at:updatedAt,
  deleted_at:deletedAt
`;

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('token');

  if (!orderId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    const order = await capturePayPalOrder(orderId);
    const metadata = parsePayPalMetadata(order.purchase_units);

    if (!metadata) {
      throw new Error('Missing order metadata');
    }

    const plan = getPlanById(metadata.planId);
    if (!plan) {
      throw new Error('Unknown plan selected');
    }

    const supabase = getSupabaseServerClient();

    await supabase
      .from('teams')
      .update({
        stripe_customer_id: order.payer?.payer_id ?? null,
        stripe_subscription_id: order.id,
        stripe_product_id: plan.id,
        plan_name: plan.name,
        subscription_status: order.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadata.teamId);

    const { data: user } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('id', metadata.userId)
      .maybeSingle();

    const typedUser = (user as unknown as User) || null;
    if (typedUser) {
      await setSession(typedUser);
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Failed to capture PayPal order', error);
    return NextResponse.redirect(new URL('/pricing', request.url));
  }
}
