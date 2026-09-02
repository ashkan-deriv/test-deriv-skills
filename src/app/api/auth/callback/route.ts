import { NextRequest, NextResponse } from "next/server";
import {
  exchangeAuthorizationCode,
  getAppConfig,
} from "@/lib/deriv/oauth";
import { getSession } from "@/lib/deriv/session";

function errorRedirect(appUrl: string, code: string) {
  return NextResponse.redirect(new URL(`/?auth_error=${code}`, appUrl));
}

export async function GET(request: NextRequest) {
  const config = getAppConfig();
  const appUrl = config?.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!config) {
    return errorRedirect(appUrl, "config");
  }

  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");

  const session = await getSession();
  const expectedState = session.oauthState;
  const codeVerifier = session.codeVerifier;

  session.oauthState = undefined;
  session.codeVerifier = undefined;

  if (!expectedState || !state || state !== expectedState) {
    await session.save();
    return errorRedirect(appUrl, "invalid_state");
  }

  if (error) {
    await session.save();
    // Map known OAuth error codes to safe app messages (never echo error_description).
    const mapped =
      error === "access_denied"
        ? "denied"
        : error === "invalid_scope"
          ? "invalid_scope"
          : error === "invalid_request"
            ? "config"
            : "denied";
    return errorRedirect(appUrl, mapped);
  }

  if (!code) {
    await session.save();
    return errorRedirect(appUrl, "missing_code");
  }

  if (!codeVerifier) {
    await session.save();
    return errorRedirect(appUrl, "expired");
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      appId: config.appId,
      redirectUri: config.redirectUri,
      code,
      codeVerifier,
    });

    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(new URL("/trade", appUrl));
  } catch {
    session.accessToken = undefined;
    session.refreshToken = undefined;
    session.isLoggedIn = false;
    await session.save();
    return errorRedirect(appUrl, "exchange_failed");
  }
}
