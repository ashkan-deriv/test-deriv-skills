export type AccumulatorProposalInput = {
  symbol: string;
  currency: string;
  amount: number;
  growthRate: number;
  takeProfit?: number;
};

/** Subscribed Accumulator proposal — fields validated via Deriv API plugin. */
export function buildAccumulatorProposal(input: AccumulatorProposalInput) {
  const payload: Record<string, unknown> = {
    proposal: 1,
    subscribe: 1,
    amount: input.amount,
    basis: "stake",
    contract_type: "ACCU",
    currency: input.currency,
    growth_rate: input.growthRate,
    underlying_symbol: input.symbol,
  };

  if (input.takeProfit != null && input.takeProfit > 0) {
    payload.limit_order = { take_profit: input.takeProfit };
  }

  return payload;
}

export function buildSellRequest(contractId: number, price = 0) {
  return {
    sell: contractId,
    price,
  };
}

export function buildOpenContractSubscribe(contractId: number) {
  return {
    proposal_open_contract: 1 as const,
    contract_id: contractId,
    subscribe: 1 as const,
  };
}
