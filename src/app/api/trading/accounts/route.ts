import { NextResponse } from "next/server";
import { listTradingAccounts } from "@/lib/deriv/rest";
import { requireAccessToken } from "@/lib/deriv/session";

export async function GET() {
  try {
    const accessToken = await requireAccessToken();
    const accounts = await listTradingAccounts(accessToken);
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "accounts_failed" }, { status: 502 });
  }
}
