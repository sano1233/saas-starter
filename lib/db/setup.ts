import { promises as fs } from 'node:fs';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';

function ask(question: string, fallback = ''): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans || fallback);
    })
  );
}

function generateAuthSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function writeEnvFile(envVars: Record<string, string>) {
  const envContent = Object.entries(envVars)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
}

async function main() {
  console.log('Setting up Supabase + PayPal environment variables.');

  const POSTGRES_URL = await ask(
    'Enter your POSTGRES_URL (optional, used for migrations): '
  );
  const SUPABASE_PROJECT_URL = await ask(
    'Enter your SUPABASE_PROJECT_URL (e.g. https://xyzcompany.supabase.co): '
  );
  const SUPABASE_PROJECT_ID = await ask(
    'Enter your SUPABASE_PROJECT_ID (e.g. xyzcompany): '
  );
  const SUPABASE_URL = SUPABASE_PROJECT_URL;
  const SUPABASE_ANON_PUBLIC = await ask(
    'Enter your SUPABASE_ANON_PUBLIC key: '
  );
  const SUPABASE_SERVICE_ROLE_SECRET = await ask(
    'Enter your SUPABASE_SERVICE_ROLE_SECRET: '
  );
  const SUPABASE_API_KEY = await ask(
    'Enter your SUPABASE_API_KEY (service role): '
  );
  const SUPABASE_LEGACY_JWT_SECRET = await ask(
    'Enter your SUPABASE_LEGACY_JWT_SECRET (optional): '
  );

  const PAYPAL_CLIENT_ID = await ask('Enter your PAYPAL_CLIENT_ID: ');
  const PAYPAL_CLIENT_SECRET = await ask('Enter your PAYPAL_CLIENT_SECRET: ');
  const PAYPAL_ENV = await ask('Enter PayPal environment (sandbox/live): ', 'sandbox');

  const BASE_URL = await ask('Enter BASE_URL for the app: ', 'http://localhost:3000');
  const AUTH_SECRET = generateAuthSecret();

  await writeEnvFile({
    POSTGRES_URL,
    SUPABASE_PROJECT_URL,
    SUPABASE_PROJECT_ID,
    SUPABASE_URL,
    SUPABASE_ANON_PUBLIC,
    SUPABASE_SERVICE_ROLE_SECRET,
    SUPABASE_API_KEY,
    SUPABASE_LEGACY_JWT_SECRET,
    PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET,
    PAYPAL_ENV,
    BASE_URL,
    AUTH_SECRET
  });

  console.log('.env file created. 🎉');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
