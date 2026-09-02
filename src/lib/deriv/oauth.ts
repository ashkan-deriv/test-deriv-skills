import { createHash, randomBytes } from "node:crypto";
import {
  DERIV_AUTH_URL,
  DERIV_TOKEN_URL,
  OAUTH_SCOPES,
} from "@/lib/deriv/constants";

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkce(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(
    createHash("sha256").update(codeVerifier).digest(),
  );
  return { codeVerifier, codeChallenge };
}

export function createOAuthState(): string {
  return base64Url(randomBytes(24));
}

export type AppConfig = {
  appId: string;
  redirectUri: string;
  appUrl: string;
};

export function getAppConfig(): AppConfig | null {
  const appId = process.env.DERIV_APP_ID?.trim();
  const redirectUri = process.env.DERIV_REDIRECT_URI?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appId || !redirectUri || !appUrl) return null;
  return { appId, redirectUri, appUrl };
}

export function buildAuthorizeUrl(options: {
  appId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  signup?: boolean;
}): string {
  const url = new URL(DERIV_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", options.appId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (options.signup) {
    url.searchParams.set("prompt", "registration");
  }
  return url.toString();
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

export async function exchangeAuthorizationCode(options: {
  appId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: options.appId,
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });

  const response = await fetch(DERIV_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TOKEN_EXCHANGE_${response.status}`);
  }

  return (await response.json()) as TokenResponse;
}
