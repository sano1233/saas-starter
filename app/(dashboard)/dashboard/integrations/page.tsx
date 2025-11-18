'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { updateIntegrationKeys } from '@/app/(login)/actions';
import type { IntegrationKeys } from '@/lib/db/schema';
import {
  integrationKeyDefinitions,
  IntegrationKeyName
} from '@/lib/integrations/keys';

type IntegrationFormState = {
  error?: string;
  success?: string;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load integration keys');
  }
  return response.json();
};

type SecretInputProps = {
  id: string;
  name: IntegrationKeyName;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
};

function SecretInput({
  id,
  name,
  defaultValue,
  placeholder,
  disabled
}: SecretInputProps) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={revealed ? 'text' : 'password'}
        autoComplete="off"
        spellCheck={false}
        className="pr-10"
        disabled={disabled}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={revealed ? 'Hide key' : 'Reveal key'}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function getFieldValue(name: IntegrationKeyName, source?: IntegrationKeys) {
  const value = source?.[name as keyof IntegrationKeys];
  return typeof value === 'string' ? value : value ?? '';
}

export default function IntegrationsPage() {
  const { data, isLoading, mutate } = useSWR<IntegrationKeys>(
    '/api/team/integrations',
    fetcher
  );
  const [state, formAction, isPending] = useActionState<IntegrationFormState, FormData>(
    updateIntegrationKeys,
    {}
  );

  useEffect(() => {
    if (state?.success) {
      mutate();
    }
  }, [state?.success, mutate]);

  const lastUpdated = useMemo(() => {
    if (!data?.updatedAt) {
      return 'Never';
    }
    return new Date(data.updatedAt).toLocaleString();
  }, [data?.updatedAt]);

  const isInitialLoad = !data && isLoading;
  const formKey = data?.updatedAt ?? 'initial';

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Integrations Control Plane
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Centralize every provider credential once, and let Agentica orchestrate
          Gemini, Mistral, Qwen, ElevenLabs, GitHub and more as a single
          autonomous fabric.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unified API Vault</CardTitle>
          <CardDescription>
            Rotate, revoke, and audit every API key powering the self-automated SaaS agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            key={formKey}
            action={formAction}
            className="space-y-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
              {integrationKeyDefinitions.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <SecretInput
                    id={field.name}
                    name={field.name}
                    placeholder={field.placeholder}
                    defaultValue={getFieldValue(field.name, data)}
                    disabled={isPending || isInitialLoad}
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {state?.error && (
                <p className="flex items-center text-sm text-red-500">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {state.error}
                </p>
              )}
              {state?.success && (
                <p className="flex items-center text-sm text-green-600">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {state.success}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={isPending || isInitialLoad}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Save API Keys
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
