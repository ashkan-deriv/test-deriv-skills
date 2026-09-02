import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueOtpUrl } from "@/lib/deriv/rest";
import { requireAccessToken } from "@/lib/deriv/session";

const bodySchema = z.object({
  accountId: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = await requireAccessToken();
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_account" }, { status: 400 });
    }

    const url = await issueOtpUrl(accessToken, parsed.data.accountId);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (message === "INVALID_ACCOUNT") {
      return NextResponse.json({ error: "invalid_account" }, { status: 400 });
    }
    return NextResponse.json({ error: "otp_failed" }, { status: 502 });
  }
}
