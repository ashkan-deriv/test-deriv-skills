export type RiseFallSide = "CALL" | "PUT";

export type RiseFallProposalInput = {
  symbol: string;
  currency: string;
  amount: number;
  duration: number;
  durationUnit: "t" | "s" | "m";
  contractType: RiseFallSide;
};

/** Subscribed Rise/Fall proposal — fields validated via Deriv API plugin. */
export function buildRiseFallProposal(input: RiseFallProposalInput) {
  return {
    proposal: 1 as const,
    subscribe: 1 as const,
    amount: input.amount,
    basis: "stake" as const,
    contract_type: input.contractType,
    currency: input.currency,
    duration: input.duration,
    duration_unit: input.durationUnit,
    underlying_symbol: input.symbol,
  };
}

export function buildBuyRequest(proposalId: string, price: number) {
  return {
    buy: proposalId,
    price,
  };
}
