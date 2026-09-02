"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountSwitcher } from "@/components/trade/AccountSwitcher";
import { AccumulatorPanel } from "@/components/trade/AccumulatorPanel";
import {
  ContractStatus,
  type OpenContractView,
} from "@/components/trade/ContractStatus";
import { ErrorBanner } from "@/components/trade/ErrorBanner";
import { RiseFallPanel } from "@/components/trade/RiseFallPanel";
import { SymbolPicker } from "@/components/trade/SymbolPicker";
import {
  TradeTypeTabs,
  type TradeType,
} from "@/components/trade/TradeTypeTabs";
import { DEFAULT_SYMBOLS } from "@/lib/deriv/constants";
import type { TradingAccount } from "@/lib/deriv/rest";
import {
  buildOpenContractSubscribe,
  buildSellRequest,
} from "@/lib/trading/accumulators";
import { DerivClient } from "@/lib/websocket/deriv-client";

export function TradeHub() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>(DEFAULT_SYMBOLS[0].symbol);
  const [tradeType, setTradeType] = useState<TradeType>("rise_fall");
  const [tick, setTick] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<OpenContractView | null>(null);
  const [selling, setSelling] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [client, setClient] = useState<DerivClient | null>(null);

  const selectedAccount = accounts.find((a) => a.account_id === accountId);
  const currency = selectedAccount?.currency || "USD";

  const onError = useCallback((message: string) => {
    setError(message || null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/trading/accounts", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/?auth_error=expired";
          return;
        }
        if (!res.ok) throw new Error("Failed to load accounts");
        const data = (await res.json()) as { accounts?: TradingAccount[] };
        if (cancelled) return;
        const list = data.accounts || [];
        setAccounts(list);
        const preferred =
          list.find((a) => a.account_type === "demo" && a.status === "active") ||
          list.find((a) => a.status === "active") ||
          list[0];
        setAccountId(preferred?.account_id ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load accounts");
        }
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;
    let activeClient: DerivClient | null = null;

    (async () => {
      setConnected(false);
      setClient(null);
      setTick(null);
      setError(null);

      try {
        const res = await fetch("/api/trading/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId }),
        });
        if (res.status === 401) {
          window.location.href = "/?auth_error=expired";
          return;
        }
        if (!res.ok) throw new Error("Unable to open trading connection");
        const data = (await res.json()) as { url?: string };
        if (!data.url) throw new Error("OTP URL missing");
        if (cancelled) return;

        activeClient = new DerivClient(data.url);
        await activeClient.connect();
        if (cancelled) {
          activeClient.close();
          return;
        }
        setClient(activeClient);
        setConnected(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Trading connection failed",
          );
          setConnected(false);
          setClient(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      activeClient?.close();
      setClient(null);
      setConnected(false);
    };
  }, [accountId]);

  useEffect(() => {
    if (!client || !connected) return;

    let active = true;
    let subId: string | undefined;

    const off = client.onMessage((msg) => {
      if (!active || msg.msg_type !== "tick" || msg.error) return;
      if (typeof msg.tick?.quote === "number") setTick(msg.tick.quote);
      if (msg.subscription?.id) subId = msg.subscription.id;
    });

    (async () => {
      try {
        const res = await client.request({ ticks: symbol, subscribe: 1 });
        if (!active) return;
        if (typeof res.tick?.quote === "number") setTick(res.tick.quote);
        if (res.subscription?.id) subId = res.subscription.id;
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Tick subscribe failed");
        }
      }
    })();

    return () => {
      active = false;
      off();
      if (subId) void client.forget(subId);
    };
  }, [client, connected, symbol]);

  const watchContract = useCallback(
    async (contractId: number) => {
      if (!client) return;

      const off = client.onMessage((msg) => {
        if (msg.msg_type !== "proposal_open_contract" || msg.error) return;
        const poc = msg.proposal_open_contract;
        if (!poc || poc.contract_id !== contractId) return;
        setContract({
          contractId,
          longcode: poc.longcode,
          status: poc.status,
          buyPrice: poc.buy_price,
          bidPrice: poc.bid_price,
          profit: poc.profit,
          isSold: poc.is_sold,
          isValidToSell: poc.is_valid_to_sell,
          currency: poc.currency,
        });
      });

      try {
        const res = await client.request(buildOpenContractSubscribe(contractId));
        const poc = res.proposal_open_contract;
        if (poc) {
          setContract({
            contractId,
            longcode: poc.longcode,
            status: poc.status,
            buyPrice: poc.buy_price,
            bidPrice: poc.bid_price,
            profit: poc.profit,
            isSold: poc.is_sold,
            isValidToSell: poc.is_valid_to_sell,
            currency: poc.currency,
          });
        }
      } catch (err) {
        off();
        setError(err instanceof Error ? err.message : "Contract watch failed");
      }
    },
    [client],
  );

  async function sellContract() {
    if (!client || !contract || selling) return;
    setSelling(true);
    setError(null);
    try {
      await client.request(buildSellRequest(contract.contractId, 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sell failed");
    } finally {
      setSelling(false);
    }
  }

  if (loadingAccounts) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Loading accounts…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Deriv Options
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Trade desk</h1>
        </div>
        <a
          href="/api/auth/logout"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Log out
        </a>
      </header>

      <ErrorBanner message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <AccountSwitcher
          accounts={accounts}
          selectedId={accountId}
          onSelect={setAccountId}
          disabled={!accounts.length}
        />
        <SymbolPicker
          value={symbol}
          onChange={setSymbol}
          disabled={!connected}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500">Live tick · {symbol}</span>
          <span
            className={`text-xs font-semibold uppercase ${
              connected ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {connected ? "Connected" : "Connecting…"}
          </span>
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {tick != null ? tick.toFixed(2) : "—"}
        </p>
      </div>

      <TradeTypeTabs value={tradeType} onChange={setTradeType} />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {tradeType === "rise_fall" ? (
          <RiseFallPanel
            client={client}
            symbol={symbol}
            currency={currency}
            connected={connected}
            onPurchased={(id) => void watchContract(id)}
            onError={onError}
          />
        ) : (
          <AccumulatorPanel
            client={client}
            symbol={symbol}
            currency={currency}
            connected={connected}
            onPurchased={(id) => void watchContract(id)}
            onError={onError}
          />
        )}
      </section>

      <ContractStatus
        contract={contract}
        onSell={
          contract?.isValidToSell === 1
            ? () => void sellContract()
            : undefined
        }
        selling={selling}
      />
    </div>
  );
}
