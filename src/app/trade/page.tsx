import { AuthGuard } from "@/components/auth/AuthGuard";
import { TradeHub } from "@/components/trade/TradeHub";

export default function TradePage() {
  return (
    <AuthGuard>
      <TradeHub />
    </AuthGuard>
  );
}
