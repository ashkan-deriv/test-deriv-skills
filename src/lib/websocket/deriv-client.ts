"use client";

export type DerivError = {
  code?: string;
  message?: string;
};

export type DerivMessage = Record<string, unknown> & {
  msg_type?: string;
  req_id?: number;
  error?: DerivError;
  subscription?: { id?: string };
  proposal?: {
    id?: string;
    ask_price?: number;
    payout?: number;
    longcode?: string;
    spot?: number;
  };
  buy?: {
    contract_id?: number;
    buy_price?: number;
    balance_after?: number;
    longcode?: string;
    transaction_id?: number;
  };
  tick?: {
    quote?: number;
    symbol?: string;
    epoch?: number;
    id?: string;
  };
  proposal_open_contract?: {
    contract_id?: number;
    longcode?: string;
    status?: string | null;
    buy_price?: string | number;
    bid_price?: string | number;
    profit?: string | number;
    is_sold?: number;
    is_valid_to_sell?: number;
    currency?: string;
    id?: string;
  };
  sell?: {
    sold_for?: number;
    contract_id?: number;
  };
};

type Pending = {
  resolve: (msg: DerivMessage) => void;
  reject: (err: Error) => void;
};

type Listener = (msg: DerivMessage) => void;

const PING_MS = 30_000;
const OPEN_TIMEOUT_MS = 12_000;

export class DerivClient {
  private ws: WebSocket | null = null;
  private nextReqId = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<Listener>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private subscriptionIds = new Set<string>();

  constructor(private readonly url: string) {}

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket open timed out"));
      }, OPEN_TIMEOUT_MS);

      ws.onopen = () => {
        clearTimeout(timer);
        this.startPing();
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = () => {
        this.stopPing();
        for (const [, p] of this.pending) {
          p.reject(new Error("WebSocket closed"));
        }
        this.pending.clear();
        this.subscriptionIds.clear();
      };

      ws.onmessage = (event) => {
        let msg: DerivMessage;
        try {
          msg = JSON.parse(String(event.data)) as DerivMessage;
        } catch {
          return;
        }

        const subId = msg.subscription?.id;
        if (typeof subId === "string") {
          this.subscriptionIds.add(subId);
        }
        const pocId = msg.proposal_open_contract?.id;
        if (typeof pocId === "string") {
          this.subscriptionIds.add(pocId);
        }
        const tickId = msg.tick?.id;
        if (typeof tickId === "string") {
          this.subscriptionIds.add(tickId);
        }

        const reqId = typeof msg.req_id === "number" ? msg.req_id : undefined;
        if (reqId != null && this.pending.has(reqId)) {
          const pending = this.pending.get(reqId)!;
          this.pending.delete(reqId);
          if (msg.error) {
            pending.reject(
              new Error(msg.error.message || msg.error.code || "Deriv error"),
            );
          } else {
            pending.resolve(msg);
          }
        }

        for (const listener of this.listeners) {
          listener(msg);
        }
      };
    });
  }

  onMessage(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  send(payload: Record<string, unknown>): number {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    const req_id = this.nextReqId++;
    this.ws.send(JSON.stringify({ ...payload, req_id }));
    return req_id;
  }

  request(payload: Record<string, unknown>): Promise<DerivMessage> {
    const req_id = this.send(payload);
    return new Promise<DerivMessage>((resolve, reject) => {
      this.pending.set(req_id, { resolve, reject });
    });
  }

  async forget(subscriptionId: string): Promise<void> {
    if (!subscriptionId) return;
    try {
      await this.request({ forget: subscriptionId });
    } catch {
      // ignore teardown failures
    } finally {
      this.subscriptionIds.delete(subscriptionId);
    }
  }

  async forgetAll(): Promise<void> {
    const ids = [...this.subscriptionIds];
    this.subscriptionIds.clear();
    await Promise.all(ids.map((id) => this.forget(id)));
  }

  close(): void {
    this.stopPing();
    for (const [, p] of this.pending) {
      p.reject(new Error("WebSocket closed"));
    }
    this.pending.clear();
    this.subscriptionIds.clear();
    this.listeners.clear();
    this.ws?.close();
    this.ws = null;
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      try {
        this.send({ ping: 1 });
      } catch {
        // ignore
      }
    }, PING_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
