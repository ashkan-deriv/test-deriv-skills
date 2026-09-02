"use client";

import { useEffect, useMemo, useState } from "react";
import type { DerivClient } from "@/lib/websocket/deriv-client";
import {
  buildBuyRequest,
  buildRiseFallProposal,
  type RiseFallSide,
} from "@/lib/trading/rise-fall";

type Quote = { id: string; askPrice: number; payout: number };

export function RiseFallPanel({
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
  const [side, setSide] = useState<RiseFallSide>("CALL");
  const [stake, setStake] = useState("10");
  const [duration, setDuration] = useState("5");
  const [durationUnit, setDurationUnit] = useState<"t" | "s" | "m">("t");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [buying, setBuying] = useState(false);

  const stakeNum = Number(stake);
  const durationNum = Number(duration);
  const ready =
    connected &&
    !!client &&
    Number.isFinite(stakeNum) &&
    stakeNum > 0 &&
    Number.isFinite(durationNum) &&
    durationNum > 0;

  const key = useMemo(
    () =>
      `${symbol}|${currency}|${side}|${stakeNum}|${durationNum}|${durationUnit}`,
    [symbol, currency, side, stakeNum, durationNum, durationUnit],
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
      setQuote({
        id: proposal.id,
        askPrice: proposal.ask_price,
        payout: typeof proposal.payout === "number" ? proposal.payout : 0,
      });
    });

    (async () => {
      try {
        setQuote(null);
        const res = await client.request(
          buildRiseFallProposal({
            symbol,
            currency,
            amount: stakeNum,
            duration: durationNum,
            durationUnit,
            contractType: side,
          }),
        );
        if (!active) return;
        const proposal = res.proposal;
        if (proposal?.id && typeof proposal.ask_price === "number") {
          setQuote({
            id: proposal.id,
            askPrice: proposal.ask_price,
            payout: typeof proposal.payout === "number" ? proposal.payout : 0,
          });
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
    durationNum,
    durationUnit,
    side,
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
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["CALL", "Rise"],
            ["PUT", "Fall"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSide(id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              side === id
                ? id === "CALL"
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-600 text-white"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
          <span className="mb-1 block font-medium">Duration</span>
          <input
            type="number"
            min={1}
            step={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Unit</span>
          <select
            value={durationUnit}
            onChange={(e) =>
              setDurationUnit(e.target.value as "t" | "s" | "m")
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="t">Ticks</option>
            <option value="s">Seconds</option>
            <option value="m">Minutes</option>
          </select>
        </label>
      </div>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900/60">
        {quote ? (
          <p>
            Ask <strong>{quote.askPrice.toFixed(2)}</strong> · Payout{" "}
            <strong>{quote.payout.toFixed(2)}</strong> {currency}
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
        {buying ? "Buying…" : `Buy ${side === "CALL" ? "Rise" : "Fall"}`}
      </button>
    </div>
  );
}
