import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/deriv/oauth";
import { getSession } from "@/lib/deriv/session";

async function logout() {
  const session = await getSession();
  session.destroy();
  const appUrl =
    getAppConfig()?.appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return NextResponse.redirect(new URL("/", appUrl));
}

export async function GET() {
  return logout();
}

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
