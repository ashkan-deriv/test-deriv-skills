/** Live Deriv API endpoints from the Deriv API plugin guides. */

export const DERIV_AUTH_URL = "https://auth.deriv.com/oauth2/auth";
export const DERIV_TOKEN_URL = "https://auth.deriv.com/oauth2/token";
export const DERIV_API_BASE = "https://api.derivws.com";
export const DERIV_PUBLIC_WS =
  "wss://api.derivws.com/trading/v1/options/ws/public";

/**
 * Scopes requested at authorize time.
 * This App ID is registered for `trade` only — do not request others
 * or Deriv returns invalid_scope.
 */
export const OAUTH_SCOPES = "trade";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Sign-in could not be verified. Please try again.",
  expired: "Sign-in expired. Please try again.",
  denied: "Sign-in was cancelled or denied.",
  invalid_scope:
    "This Deriv app is not allowed to request the required OAuth scopes. Enable them in the Deriv dashboard, or use an app that includes trade.",
  missing_code: "Sign-in response was incomplete. Please try again.",
  exchange_failed: "Unable to complete sign-in. Please try again.",
  config: "App is not configured for Deriv sign-in.",
};

/** Volatility indices that support Rise/Fall and Accumulators. */
export const DEFAULT_SYMBOLS = [
  { symbol: "R_10", display_name: "Volatility 10 Index" },
  { symbol: "R_25", display_name: "Volatility 25 Index" },
  { symbol: "R_50", display_name: "Volatility 50 Index" },
  { symbol: "R_75", display_name: "Volatility 75 Index" },
  { symbol: "R_100", display_name: "Volatility 100 Index" },
] as const;

export const ACCU_GROWTH_RATES = [0.01, 0.02, 0.03, 0.04, 0.05] as const;
