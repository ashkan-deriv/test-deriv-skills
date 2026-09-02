"use client";

export type TradeType = "rise_fall" | "accumulator";

export function TradeTypeTabs({
  value,
  onChange,
}: {
  value: TradeType;
  onChange: (value: TradeType) => void;
}) {
  return (
    <div className="flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {(
        [
          ["rise_fall", "Rise/Fall"],
          ["accumulator", "Accumulators"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            value === id
              ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-800 dark:text-emerald-200"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
