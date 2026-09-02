import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type DerivSessionData = {
  isLoggedIn: boolean;
  accessToken?: string;
  refreshToken?: string;
  oauthState?: string;
  codeVerifier?: string;
};

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }

  return {
    password,
    cookieName: "deriv_trading_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<DerivSessionData>(await cookies(), sessionOptions());
}

export async function requireAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("UNAUTHORIZED");
  }
  return session.accessToken;
}
