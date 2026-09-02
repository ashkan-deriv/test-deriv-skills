"use client";

import type { TradingAccount } from "@/lib/deriv/rest";

export function AccountSwitcher({
  accounts,
  selectedId,
  onSelect,
  disabled,
}: {
  accounts: TradingAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  if (accounts.length === 0) {
    return <p className="text-sm text-zinc-500">No trading accounts found.</p>;
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">Account</span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        value={selectedId ?? ""}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value)}
      >
        {accounts.map((account) => (
          <option key={account.account_id} value={account.account_id}>
            {account.account_type.toUpperCase()} · {account.currency}{" "}
            {Number(account.balance).toFixed(2)} · {account.account_id}
          </option>
        ))}
      </select>
    </label>
  );
}
