import { SupabaseClient, createClient } from '@supabase/supabase-js';

let supabaseAdminClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL ||
    (process.env.SUPABASE_PROJECT_ID
      ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
      : undefined)
  );
}

function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_SECRECT ||
    process.env.SUPABASE_SERVICE_ROLE_SECRET ||
    process.env.SUPABASE_API_KEY
  );
}

export function getSupabaseServerClient() {
  if (!supabaseAdminClient) {
    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = getServiceRoleKey();

    if (!supabaseUrl) {
      throw new Error(
        'Missing Supabase URL. Set SUPABASE_URL or SUPABASE_PROJECT_URL.'
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        'Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_SECRET (or SECRECT) or SUPABASE_API_KEY.'
      );
    }

    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  return supabaseAdminClient;
}
