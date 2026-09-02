import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  createOAuthState,
  createPkce,
  getAppConfig,
} from "@/lib/deriv/oauth";
import { getSession } from "@/lib/deriv/session";

export async function GET() {
  const config = getAppConfig();
  const appUrl = config?.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!config) {
    return NextResponse.redirect(new URL("/?auth_error=config", appUrl));
  }

  const { codeVerifier, codeChallenge } = createPkce();
  const state = createOAuthState();
  const session = await getSession();

  session.oauthState = state;
  session.codeVerifier = codeVerifier;
  await session.save();

  return NextResponse.redirect(
    buildAuthorizeUrl({
      appId: config.appId,
      redirectUri: config.redirectUri,
      state,
      codeChallenge,
      signup: false,
    }),
  );
}
