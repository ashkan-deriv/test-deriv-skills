import { DERIV_API_BASE } from "@/lib/deriv/constants";
import { getAppConfig } from "@/lib/deriv/oauth";

export type TradingAccount = {
  account_id: string;
  balance: number;
  currency: string;
  group: string;
  status: "active" | "inactive";
  account_type: "demo" | "real";
};

type AccountsResponse = {
  data?: TradingAccount[];
};

type OtpResponse = {
  data?: { url?: string };
};

function authHeaders(accessToken: string): HeadersInit {
  const config = getAppConfig();
  if (!config) {
    throw new Error("CONFIG");
  }

  return {
    "Deriv-App-ID": config.appId,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

export async function listTradingAccounts(
  accessToken: string,
): Promise<TradingAccount[]> {
  // Live path from Deriv API plugin: GET /trading/v1/options/accounts
  const response = await fetch(
    `${DERIV_API_BASE}/trading/v1/options/accounts`,
    {
      method: "GET",
      headers: authHeaders(accessToken),
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    throw new Error(`ACCOUNTS_${response.status}`);
  }

  const json = (await response.json()) as AccountsResponse;
  return Array.isArray(json.data) ? json.data : [];
}

export async function issueOtpUrl(
  accessToken: string,
  accountId: string,
): Promise<string> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(accountId)) {
    throw new Error("INVALID_ACCOUNT");
  }

  // Live path: POST /trading/v1/options/accounts/{accountId}/otp
  const response = await fetch(
    `${DERIV_API_BASE}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    throw new Error(`OTP_${response.status}`);
  }

  const json = (await response.json()) as OtpResponse;
  const url = json.data?.url;
  if (!url || typeof url !== "string" || !url.startsWith("wss://")) {
    throw new Error("OTP_INVALID");
  }
  return url;
}
