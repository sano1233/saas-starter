import { hashPassword } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const supabase = getSupabaseServerClient();

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    console.log('Seed user already exists. Skipping user creation.');
    return;
  }

  const { data: createdUser, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      role: 'owner'
    })
    .select('id')
    .single();

  if (userError || !createdUser) {
    throw userError || new Error('Failed to create user');
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name: 'Test Team' })
    .select('id')
    .single();

  if (teamError || !team) {
    throw teamError || new Error('Failed to create team');
  }

  await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: createdUser.id,
    role: 'owner'
  });

  console.log('Seed data created successfully.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
