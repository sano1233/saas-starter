# Supabase Migration Guide

This application has been migrated from custom JWT authentication and direct PostgreSQL + Drizzle ORM to **Supabase Auth** and **Supabase Database**.

## What Changed

### Authentication
- ✅ **Before**: Custom JWT tokens with bcrypt password hashing
- ✅ **After**: Supabase Auth with built-in security best practices

### Database
- ✅ **Before**: Direct PostgreSQL connection with Drizzle ORM
- ✅ **After**: Supabase PostgreSQL with Row Level Security (RLS)

### Middleware
- ✅ **Before**: Custom session verification middleware
- ✅ **After**: Supabase SSR middleware for automatic session management

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/sign in
2. Create a new project
3. Wait for the project to finish setting up (takes 1-2 minutes)
4. Note your project reference: `kmuerfuvpfdvnvauajle` (visible in your project URL)

### 2. Set Up the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-schema.sql` in this repository
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the script

This will create:
- `profiles` table (extends auth.users)
- `teams` table
- `team_members` table
- `activity_logs` table
- `invitations` table
- Row Level Security policies
- Automatic profile creation trigger

### 3. Configure Environment Variables

Create a `.env` file in the root directory with:

```bash
# Get these from your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=https://kmuerfuvpfdvnvauajle.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Your existing Stripe configuration
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***

# Your application URL
BASE_URL=http://localhost:3000
```

**Where to find your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configure Supabase Auth

1. In your Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Site URL**: `https://yourdomain.com` (for production)
3. Add redirect URLs:
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**`

### 5. Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if desired:
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation, password reset, and other email templates

### 6. Deploy to Vercel

Your Vercel deployment will now work with the new Supabase configuration. Make sure to:

1. Add the environment variables to Vercel:
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Add all the variables from your `.env` file

2. Redeploy your application

## Key Features

### Row Level Security (RLS)
All tables are protected with RLS policies that ensure:
- Users can only access their own profile
- Users can only see teams they're members of
- Only team owners can manage team settings and members
- Activity logs are scoped to team members

### Automatic Profile Creation
When a user signs up through Supabase Auth, a corresponding profile is automatically created in the `profiles` table via a database trigger.

### Session Management
Sessions are automatically handled by Supabase's SSR package:
- Cookies are automatically set and refreshed
- Middleware protects routes requiring authentication
- Sessions persist across server and client components

## File Structure

```
lib/
├── supabase/
│   ├── server.ts          # Server-side Supabase client
│   ├── client.ts          # Client-side Supabase client
│   ├── middleware.ts      # Middleware for session management
│   └── queries.ts         # Database query functions
├── auth/
│   └── middleware.ts      # Auth validation helpers (updated for Supabase)
└── payments/
    └── stripe.ts          # Stripe integration (updated for Supabase)

app/
└── (login)/
    └── actions.ts         # Auth actions (sign in, sign up, etc.)

middleware.ts              # Root middleware (uses Supabase)
supabase-schema.sql        # Database schema and RLS policies
```

## Migration Notes

### What Was Kept
- All business logic and UI components
- Stripe payment integration
- Team management features
- Activity logging
- Invitation system

### What Changed
- Authentication system (JWT → Supabase Auth)
- Database queries (Drizzle → Supabase Client)
- Session management (custom → Supabase SSR)
- User IDs (integer → UUID)

### Breaking Changes
- User IDs are now UUIDs instead of integers
- Sessions are managed by Supabase (no more custom JWT)
- Password hashing is handled by Supabase Auth
- Email verification is built-in (can be enabled in Supabase settings)

## Testing

After migration, test these critical flows:

1. ✅ Sign up new user
2. ✅ Sign in existing user
3. ✅ Create team (automatic on signup)
4. ✅ Invite team member
5. ✅ Accept invitation
6. ✅ Update profile
7. ✅ Change password
8. ✅ Delete account
9. ✅ View activity logs
10. ✅ Stripe checkout flow

## Troubleshooting

### "Invalid API key" error
- Make sure you're using the `anon` key, not the `service_role` key
- Verify the key is correctly set in your `.env` file

### "User not found" error
- Make sure the database schema has been applied
- Check that the profile creation trigger is working
- Try creating a user through the Supabase dashboard

### RLS policy errors
- Verify all RLS policies were created correctly
- Check the Supabase dashboard → **Table Editor** → select table → **Policies**
- Make sure you're authenticated when making requests

### Middleware redirect loop
- Ensure middleware is not trying to protect auth pages (/sign-in, /sign-up)
- Check the middleware matcher configuration

## Support

For issues related to:
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **This application**: Open an issue in the repository
