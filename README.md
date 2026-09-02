# Deriv Options Trader

Focused Next.js trading app for **Rise/Fall** and **Accumulators**, built against the live Deriv API (OAuth PKCE + OTP WebSocket).

## Features

- Deriv OAuth login / signup (PKCE; tokens stay server-side)
- Account switcher (demo / real)
- Live ticks over OTP WebSocket
- Rise/Fall (`CALL` / `PUT`) proposal → buy → open-contract status
- Accumulators (`ACCU`) with growth rate + optional take profit, plus sell

## Setup (Vercel — required for OAuth)

Deriv does not accept `localhost` redirect URIs. Use the production deployment:

**App URL:** https://deriv-trading-app-jade.vercel.app

1. In the [Deriv developers dashboard](https://developers.deriv.com/docs/), register/update your app with redirect URI **exactly**:

   `https://deriv-trading-app-jade.vercel.app/api/auth/callback`

2. In the Vercel project `deriv-trading-app`, set production env vars:

| Variable | Value |
|----------|--------|
| `DERIV_APP_ID` | Your Deriv App ID |
| `DERIV_REDIRECT_URI` | `https://deriv-trading-app-jade.vercel.app/api/auth/callback` |
| `NEXT_PUBLIC_APP_URL` | `https://deriv-trading-app-jade.vercel.app` |
| `SESSION_SECRET` | Random string ≥ 32 chars (already set on Vercel) |

3. Redeploy after setting `DERIV_APP_ID`:

```bash
vercel --prod
```

## Architecture

| Concern | Transport |
|---------|-----------|
| OAuth, accounts, OTP | REST `https://api.derivws.com` + `Deriv-App-ID` + Bearer |
| Pricing, ticks, buy/sell | OTP WebSocket from `POST /trading/v1/options/accounts/{id}/otp` |

Scopes requested: `trade account_manage` (OAuth `scope=trade+account_manage`).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint
