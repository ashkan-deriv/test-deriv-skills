import { NextResponse } from "next/server";
import { getSession } from "@/lib/deriv/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: Boolean(session.isLoggedIn && session.accessToken),
  });
}
