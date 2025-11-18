import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Team, TeamDataWithMembers, User } from './schema';

const supabase = getSupabaseServerClient();

const USER_FIELDS = `
  id,
  name,
  email,
  password_hash:passwordHash,
  role,
  created_at:createdAt,
  updated_at:updatedAt,
  deleted_at:deletedAt
`;

const TEAM_FIELDS = `
  id,
  name,
  created_at:createdAt,
  updated_at:updatedAt,
  stripe_customer_id:stripeCustomerId,
  stripe_subscription_id:stripeSubscriptionId,
  stripe_product_id:stripeProductId,
  plan_name:planName,
  subscription_status:subscriptionStatus
`;

const TEAM_MEMBER_FIELDS = `
  id,
  user_id:userId,
  team_id:teamId,
  role,
  joined_at:joinedAt
`;

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', sessionData.user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as unknown as User) || null;
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const { data } = await supabase
    .from('teams')
    .select(TEAM_FIELDS)
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return (data as unknown as Team) || null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await supabase
    .from('teams')
    .update({
      stripe_subscription_id: subscriptionData.stripeSubscriptionId,
      stripe_product_id: subscriptionData.stripeProductId,
      plan_name: subscriptionData.planName,
      subscription_status: subscriptionData.subscriptionStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', teamId);
}

export async function getUserWithTeam(userId: number) {
  const [{ data: user }, { data: membership }] = await Promise.all([
    supabase
      .from('users')
      .select(USER_FIELDS)
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('team_members')
      .select('team_id:teamId')
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  if (!user) {
    return null;
  }

  const typedMembership = (membership as { teamId: number | null } | null) ?? null;

  return {
    user: user as unknown as User,
    teamId: typedMembership?.teamId ?? null
  };
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      `
        id,
        action,
        timestamp,
        ip_address:ipAddress,
        users (
          name
        )
      `
    )
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data.map((log) => {
    const typedLog = log as unknown as {
      id: number;
      action: string;
      timestamp: string;
      ipAddress: string | null;
      users?: { name?: string | null };
    };

    return {
      id: typedLog.id,
      action: typedLog.action,
      timestamp: typedLog.timestamp,
      ipAddress: typedLog.ipAddress,
      userName: typedLog.users?.name ?? null
    };
  });
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('team_members')
    .select(
      `
        team:teams (
          ${TEAM_FIELDS},
          teamMembers:team_members (
            ${TEAM_MEMBER_FIELDS},
            user:users (
              id,
              name,
              email
            )
          )
        )
      `
    )
    .eq('user_id', user.id)
    .maybeSingle();

  return (data?.team as unknown as TeamDataWithMembers) || null;
}
