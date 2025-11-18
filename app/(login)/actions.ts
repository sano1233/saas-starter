"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { comparePasswords, hashPassword, setSession } from "@/lib/auth/session";
import {
  ActivityType,
  type NewActivityLog,
  type NewTeam,
  type NewTeamMember,
  type NewUser,
  type Team,
  type User,
} from "@/lib/db/schema";
import { createCheckoutSession } from "@/lib/payments/paypal";
import { getUser, getUserWithTeam } from "@/lib/db/queries";
import {
  validatedAction,
  validatedActionWithUser,
} from "@/lib/auth/middleware";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const supabase = getSupabaseServerClient();

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

const TEAM_SELECT = `
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

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string,
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || "",
  };
  await supabase.from("activity_logs").insert({
    team_id: newActivity.teamId,
    user_id: newActivity.userId,
    action: newActivity.action,
    ip_address: newActivity.ipAddress,
  });
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const { data: foundUser, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("email", email)
    .maybeSingle();

  const typedFoundUser = (foundUser as unknown as User) || null;

  if (error || !typedFoundUser || typedFoundUser.deletedAt) {
    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      `
        team:teams (
          ${TEAM_SELECT}
        )
      `,
    )
    .eq("user_id", typedFoundUser.id)
    .maybeSingle();

  const foundTeam = (membership?.team as unknown as Team) || null;

  const isPasswordValid = await comparePasswords(
    password,
    typedFoundUser.passwordHash,
  );

  if (!isPasswordValid) {
    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  await Promise.all([
    setSession(typedFoundUser),
    logActivity(foundTeam?.id, typedFoundUser.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo === "checkout") {
    const priceId = formData.get("priceId") as string;
    return createCheckoutSession({ team: foundTeam, priceId });
  }

  redirect("/dashboard");
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return {
      error: "Failed to create user. Please try again.",
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: "owner", // Default role, will be overridden if there's an invitation
  };

  const { data: createdUser, error: createUserError } = await supabase
    .from("users")
    .insert({
      email: newUser.email,
      password_hash: newUser.passwordHash,
      role: newUser.role,
    })
    .select(USER_SELECT)
    .single();

  const typedCreatedUser = (createdUser as unknown as User) || null;

  if (createUserError || !typedCreatedUser) {
    return {
      error: "Failed to create user. Please try again.",
      email,
      password,
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: Team | null = null;

  if (inviteId) {
    const { data: invitation } = await supabase
      .from("invitations")
      .select(
        `
          id,
          team_id:teamId,
          role,
          email,
          status
        `,
      )
      .eq("id", Number(inviteId))
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (invitation) {
      const typedInvitation = invitation as unknown as {
        id: number;
        teamId: number;
        role: string;
      };
      teamId = typedInvitation.teamId;
      userRole = typedInvitation.role;

      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", typedInvitation.id);

      await logActivity(
        teamId,
        typedCreatedUser.id,
        ActivityType.ACCEPT_INVITATION,
      );

      const { data: invitedTeam } = await supabase
        .from("teams")
        .select(TEAM_SELECT)
        .eq("id", teamId)
        .maybeSingle();

      createdTeam = (invitedTeam as unknown as Team) || null;
    } else {
      return { error: "Invalid or expired invitation.", email, password };
    }
  } else {
    const newTeam: NewTeam = {
      name: `${email}'s Team`,
    };

    const { data: insertedTeam, error: createTeamError } = await supabase
      .from("teams")
      .insert({ name: newTeam.name })
      .select(TEAM_SELECT)
      .single();

    if (createTeamError || !insertedTeam) {
      return {
        error: "Failed to create team. Please try again.",
        email,
        password,
      };
    }

    createdTeam = (insertedTeam as unknown as Team) || null;
    teamId = createdTeam.id;
    userRole = "owner";

    await logActivity(teamId, typedCreatedUser.id, ActivityType.CREATE_TEAM);
  }

  const newTeamMember: NewTeamMember = {
    userId: typedCreatedUser.id,
    teamId: teamId,
    role: userRole,
  };

  await Promise.all([
    supabase.from("team_members").insert({
      user_id: newTeamMember.userId,
      team_id: newTeamMember.teamId,
      role: newTeamMember.role,
    }),
    logActivity(teamId, typedCreatedUser.id, ActivityType.SIGN_UP),
    setSession(typedCreatedUser),
  ]);

  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo === "checkout") {
    const priceId = formData.get("priceId") as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  redirect("/dashboard");
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete("session");
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

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "Current password is incorrect.",
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "New password must be different from the current password.",
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "New password and confirmation password do not match.",
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      supabase
        .from("users")
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return {
      success: "Password updated successfully.",
    };
  },
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: "Incorrect password. Account deletion failed.",
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT,
    );

    await supabase
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
        email: `${user.email}-${user.id}-deleted`,
      })
      .eq("id", user.id);

    if (userWithTeam?.teamId) {
      await supabase
        .from("team_members")
        .delete()
        .eq("user_id", user.id)
        .eq("team_id", userWithTeam.teamId);
    }

    (await cookies()).delete("session");
    redirect("/sign-in");
  },
);

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      supabase
        .from("users")
        .update({
          name,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { name, success: "Account updated successfully." };
  },
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
      return { error: "User is not part of a team" };
    }

    await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)
      .eq("team_id", userWithTeam.teamId);

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER,
    );

    return { success: "Team member removed successfully" };
  },
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "owner"]),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: "User is not part of a team" };
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      const { data: member } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", userWithTeam.teamId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (member) {
        return { error: "User is already a member of this team" };
      }
    }

    const { data: existingInvitation } = await supabase
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("team_id", userWithTeam.teamId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      return { error: "An invitation has already been sent to this email" };
    }

    await supabase.from("invitations").insert({
      team_id: userWithTeam.teamId,
      email,
      role,
      invited_by: user.id,
      status: "pending",
    });

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER,
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, userWithTeam.team.name, role)

    return { success: "Invitation sent successfully" };
  },
);
