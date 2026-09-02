import { LoginButtons } from "@/components/auth/LoginButtons";
import { AUTH_ERROR_MESSAGES } from "@/lib/deriv/constants";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const params = await searchParams;
  const authError = params.auth_error
    ? AUTH_ERROR_MESSAGES[params.auth_error] ||
      "Sign-in failed. Please try again."
    : null;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
          Deriv Options
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          Trade Rise/Fall & Accumulators
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Log in or sign up with Deriv. Prices, contracts, and settlements come
          live from the Deriv API — no mock data.
        </p>
      </div>

      {authError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {authError}
        </p>
      ) : null}

      <LoginButtons />

      <p className="max-w-md text-xs text-zinc-500">
        OAuth uses PKCE. Deriv access tokens stay on the server. Trading uses a
        short-lived OTP WebSocket URL.
      </p>
    </main>
  );
}
