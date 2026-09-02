"use client";

export function LoginButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <a
        href="/api/auth/login"
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
      >
        Log in with Deriv
      </a>
      <a
        href="/api/auth/signup"
        className="inline-flex items-center justify-center rounded-lg border border-emerald-700/40 bg-white px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-transparent dark:text-emerald-200 dark:hover:bg-emerald-950/40"
      >
        Sign up
      </a>
    </div>
  );
}
