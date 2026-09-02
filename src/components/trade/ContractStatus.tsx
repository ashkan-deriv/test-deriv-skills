"use client";

export type OpenContractView = {
  contractId: number;
  longcode?: string;
  status?: string | null;
  buyPrice?: string | number;
  bidPrice?: string | number;
  profit?: string | number;
  isSold?: number;
  isValidToSell?: number;
  currency?: string;
};

export function ContractStatus({
  contract,
  onSell,
  selling,
}: {
  contract: OpenContractView | null;
  onSell?: () => void;
  selling?: boolean;
}) {
  if (!contract) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        No open contract yet.
      </div>
    );
  }

  const canSell =
    contract.isValidToSell === 1 && contract.isSold !== 1 && Boolean(onSell);

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Contract {contract.contractId}
          </p>
          <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
            {contract.longcode || "Open contract"}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {contract.status || "open"}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Buy price</dt>
          <dd className="font-medium">
            {contract.buyPrice ?? "—"} {contract.currency || ""}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Bid / profit</dt>
          <dd className="font-medium">
            {contract.bidPrice ?? "—"} / {contract.profit ?? "—"}
          </dd>
        </div>
      </dl>
      {canSell ? (
        <button
          type="button"
          disabled={selling}
          onClick={onSell}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {selling ? "Selling…" : "Sell now"}
        </button>
      ) : null}
    </div>
  );
}
