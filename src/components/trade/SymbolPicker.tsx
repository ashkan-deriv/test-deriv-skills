"use client";

import { DEFAULT_SYMBOLS } from "@/lib/deriv/constants";

export function SymbolPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (symbol: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">Symbol</span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {DEFAULT_SYMBOLS.map((item) => (
          <option key={item.symbol} value={item.symbol}>
            {item.display_name}
          </option>
        ))}
      </select>
    </label>
  );
}
