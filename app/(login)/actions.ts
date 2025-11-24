'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  ActivityType,
  logActivity,
  getUser,
  getUserWithTeam,
  type User,
  type Team,
} from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createCheckoutSession } from '@/lib/payments/stripe';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  // Get team info
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id, teams(*)')
    .eq('user_id', authData.user.id)
    .single();

  const team = teamMember?.teams as any;

  await logActivity(team?.id, authData.user.id, ActivityType.SIGN_IN);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team, priceId });
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;
  const supabase = await createClient();

  // Check if there's a valid invitation
  let invitation: any = null;
  if (inviteId) {
    const { data: invData } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', parseInt(inviteId))
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    invitation = invData;

    if (!invitation) {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: email.split('@')[0], // Use email prefix as default name
      },
    },
  });

  if (authError || !authData.user) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: Team | null = null;

  if (invitation) {
    // Join existing team
    teamId = invitation.team_id;
    userRole = invitation.role;

    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    await logActivity(teamId, authData.user.id, ActivityType.ACCEPT_INVITATION);

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    createdTeam = teamData;
  } else {
    // Create a new team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `${email}'s Team`,
      })
      .select()
      .single();

    if (teamError || !teamData) {
      return {
        error: 'Failed to create team. Please try again.',
        email,
        password,
      };
    }

    createdTeam = teamData;
    teamId = teamData.id;
    userRole = 'owner';

    await logActivity(teamId, authData.user.id, ActivityType.CREATE_TEAM);
  }

  // Add user to team
  await supabase.from('team_members').insert({
    user_id: authData.user.id,
    team_id: teamId,
    role: userRole,
  });

  await logActivity(teamId, authData.user.id, ActivityType.SIGN_UP);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
});

export async function signOut() {
  const user = await getUser();
  if (!user) return;

  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);

  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/sign-in');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.',
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.',
      };
    }

    const supabase = await createClient();

    // Verify current password by trying to sign in
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'User not found.',
      };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword,
    });

    if (signInError) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Failed to update password.',
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);
    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.UPDATE_PASSWORD
    );

    return {
      success: 'Password updated successfully.',
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;
    const supabase = await createClient();

    // Verify password
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return { password, error: 'User not found.' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password,
    });

    if (signInError) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.',
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete the profile
    await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Remove from team
    if (userWithTeam?.teamId) {
      await supabase
        .from('team_members')
        .delete()
        .eq('user_id', user.id)
        .eq('team_id', userWithTeam.teamId);
    }

    await supabase.auth.signOut();
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const supabase = await createClient();

    // Update profile
    await supabase.from('profiles').update({ name }).eq('id', user.id);

    // Update email in auth.users
    if (email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        return { error: 'Failed to update email.' };
      }
    }

    const userWithTeam = await getUserWithTeam(user.id);
    await logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.number(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const supabase = await createClient();

    await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', userWithTeam.teamId);

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const supabase = await createClient();

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('*, profiles!inner(*)')
      .eq('team_id', userWithTeam.teamId)
      .single();

    if (existingMember) {
      return { error: 'User is already a member of this team' };
    }

    // Check if there's an existing invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('team_id', userWithTeam.teamId)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create a new invitation
    await supabase.from('invitations').insert({
      team_id: userWithTeam.teamId,
      email,
      role,
      invited_by: user.id,
      status: 'pending',
    });

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, team.name, role)

    return { success: 'Invitation sent successfully' };
  }
);
