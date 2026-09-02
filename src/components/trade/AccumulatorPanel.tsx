"use client";

import { useEffect, useMemo, useState } from "react";
import { ACCU_GROWTH_RATES } from "@/lib/deriv/constants";
import { buildAccumulatorProposal } from "@/lib/trading/accumulators";
import { buildBuyRequest } from "@/lib/trading/rise-fall";
import type { DerivClient } from "@/lib/websocket/deriv-client";

type Quote = { id: string; askPrice: number };

export function AccumulatorPanel({
  client,
  symbol,
  currency,
  connected,
  onPurchased,
  onError,
}: {
  client: DerivClient | null;
  symbol: string;
  currency: string;
  connected: boolean;
  onPurchased: (contractId: number) => void;
  onError: (message: string) => void;
}) {
  const [stake, setStake] = useState("10");
  const [growthRate, setGrowthRate] = useState(0.01);
  const [takeProfit, setTakeProfit] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [buying, setBuying] = useState(false);

  const stakeNum = Number(stake);
  const takeProfitNum = takeProfit.trim() ? Number(takeProfit) : undefined;
  const ready =
    connected &&
    !!client &&
    Number.isFinite(stakeNum) &&
    stakeNum > 0 &&
    (takeProfitNum == null ||
      (Number.isFinite(takeProfitNum) && takeProfitNum > 0));

  const key = useMemo(
    () =>
      `${symbol}|${currency}|${stakeNum}|${growthRate}|${takeProfitNum ?? ""}`,
    [symbol, currency, stakeNum, growthRate, takeProfitNum],
  );

  useEffect(() => {
    if (!ready || !client) {
      setQuote(null);
      return;
    }

    let active = true;
    let subId: string | undefined;

    const off = client.onMessage((msg) => {
      if (!active || msg.msg_type !== "proposal" || msg.error) return;
      const proposal = msg.proposal;
      if (!proposal?.id || typeof proposal.ask_price !== "number") return;
      if (msg.subscription?.id) subId = msg.subscription.id;
      setQuote({ id: proposal.id, askPrice: proposal.ask_price });
    });

    (async () => {
      try {
        setQuote(null);
        const res = await client.request(
          buildAccumulatorProposal({
            symbol,
            currency,
            amount: stakeNum,
            growthRate,
            takeProfit: takeProfitNum,
          }),
        );
        if (!active) return;
        const proposal = res.proposal;
        if (proposal?.id && typeof proposal.ask_price === "number") {
          setQuote({ id: proposal.id, askPrice: proposal.ask_price });
        }
        if (res.subscription?.id) subId = res.subscription.id;
      } catch (err) {
        if (active) {
          onError(err instanceof Error ? err.message : "Proposal failed");
        }
      }
    })();

    return () => {
      active = false;
      off();
      if (subId) void client.forget(subId);
    };
  }, [
    key,
    ready,
    client,
    symbol,
    currency,
    stakeNum,
    growthRate,
    takeProfitNum,
    onError,
  ]);

  async function buy() {
    if (!client || !quote || buying) return;
    setBuying(true);
    onError("");
    try {
      const res = await client.request(
        buildBuyRequest(quote.id, quote.askPrice),
      );
      const contractId = res.buy?.contract_id;
      if (!contractId) {
        onError("Purchase did not return a contract id");
        return;
      }
      onPurchased(contractId);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Buy failed");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Stake</span>
          <input
            type="number"
            min={0.35}
            step={0.01}
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Take profit (optional)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="None"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Growth rate</legend>
        <div className="flex flex-wrap gap-2">
          {ACCU_GROWTH_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setGrowthRate(rate)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                growthRate === rate
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {(rate * 100).toFixed(0)}%
            </button>
          ))}
        </div>
      </fieldset>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900/60">
        {quote ? (
          <p>
            Ask <strong>{quote.askPrice.toFixed(2)}</strong> {currency}
          </p>
        ) : (
          <p className="text-zinc-500">Waiting for live price…</p>
        )}
      </div>

      <button
        type="button"
        disabled={!quote || buying || !connected}
        onClick={() => void buy()}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {buying ? "Buying…" : "Buy Accumulator"}
      </button>
    </div>
  );
}
