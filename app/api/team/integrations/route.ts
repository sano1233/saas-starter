import { getIntegrationKeysForCurrentUser, getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const integrations = await getIntegrationKeysForCurrentUser();

  return Response.json(integrations ?? {});
}
