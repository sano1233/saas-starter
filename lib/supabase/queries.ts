import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Team = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_product_id: string | null;
  plan_name: string | null;
  subscription_status: string | null;
};

export type TeamMember = {
  id: number;
  user_id: string;
  team_id: number;
  role: string;
  joined_at: string;
};

export type ActivityLog = {
  id: number;
  team_id: number;
  user_id: string | null;
  action: string;
  timestamp: string;
  ip_address: string | null;
};

export type Invitation = {
  id: number;
  team_id: number;
  email: string;
  role: string;
  invited_by: string;
  invited_at: string;
  status: string;
};

export type User = Profile & {
  email: string;
};

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .is('deleted_at', null)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    ...profile,
    email: authUser.email!,
  };
}

export async function getTeamByStripeCustomerId(
  customerId: string
): Promise<Team | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
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
  const supabase = await createClient();

  await supabase
    .from('teams')
    .update({
      stripe_subscription_id: subscriptionData.stripeSubscriptionId,
      stripe_product_id: subscriptionData.stripeProductId,
      plan_name: subscriptionData.planName,
      subscription_status: subscriptionData.subscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId);
}

export async function getUserWithTeam(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      team_members (
        team_id
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: authUser } = await supabase.auth.getUser();

  return {
    user: {
      ...data,
      email: authUser.user?.email || '',
    },
    teamId: data.team_members?.[0]?.team_id || null,
  };
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      id,
      action,
      timestamp,
      ip_address,
      profiles!activity_logs_user_id_fkey (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return data.map((log: any) => ({
    id: log.id,
    action: log.action,
    timestamp: log.timestamp,
    ipAddress: log.ip_address,
    userName: log.profiles?.name || null,
  }));
}

export async function getTeamForUser(): Promise<TeamDataWithMembers | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const { data: teamMemberData, error: teamMemberError } = await supabase
    .from('team_members')
    .select(`
      team_id,
      teams (
        id,
        name,
        created_at,
        updated_at,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_product_id,
        plan_name,
        subscription_status
      )
    `)
    .eq('user_id', user.id)
    .single();

  if (teamMemberError || !teamMemberData?.teams) {
    return null;
  }

  const team = teamMemberData.teams as any;

  // Get all team members
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      id,
      user_id,
      team_id,
      role,
      joined_at
    `)
    .eq('team_id', team.id);

  if (membersError || !members) {
    return null;
  }

  // Get user details for each member
  const membersWithUsers = await Promise.all(
    members.map(async (member) => {
      const { data: authData } = await supabase.auth.admin.getUserById(
        member.user_id
      );

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', member.user_id)
        .single();

      return {
        ...member,
        user: {
          id: member.user_id,
          name: profile?.name || null,
          email: authData?.user?.email || '',
        },
      };
    })
  );

  return {
    ...team,
    teamMembers: membersWithUsers,
  };
}

export async function logActivity(
  teamId: number | null | undefined,
  userId: string,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }

  const supabase = await createClient();

  await supabase.from('activity_logs').insert({
    team_id: teamId,
    user_id: userId,
    action: type,
    ip_address: ipAddress || null,
  });
}
