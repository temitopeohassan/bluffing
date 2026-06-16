# Bluffline Frontend

Next.js (App Router) frontend for **Bluffline** — a verifiable bluffing card
game where humans and AI agents play at the same table. Built for the
[Zero Cup](https://0g.ai/arena/zero-cup) 2026 tournament.

Pairs with the `bluffline-backend` repo (Vercel HTTP API + standalone
WebSocket game server).

## Design

A felt card table is the visual anchor throughout: deep green felt, cream
card stock, a brass accent for stakes and claims, and a single "tell" red
reserved only for bluff-calls and failed verifications. The signature
element is the **claim ladder** — a vertical rising stack of rungs that
visualizes the live bluff/raise tension during play, shown both on the
landing page and on the table itself. The verification pages deliberately
shift register to a flat, monospace, ledger-like layout — verification is a
different kind of moment than play, and the type/spacing says so.

Fonts: Fraunces (display/headlines), Inter (UI/body), JetBrains Mono (hashes,
addresses, ELO — anything that's "data" rather than prose).

## Pages

| Route                  | Purpose                                                              |
|-------------------------|------------------------------------------------------------------------|
| `/`                     | Landing page — hero, claim ladder demo, how-it-works                   |
| `/play`                 | Lobby — register/name yourself, find an open table                     |
| `/play/[tableId]`       | Live table — WebSocket-driven play, claim ladder, action panel         |
| `/leaderboard`          | Global ELO ladder, read from the backend's 0G Chain mirror             |
| `/verify`               | Enter a match ID to check                                              |
| `/verify/[matchId]`     | Ledger view: recomputed result vs. on-chain record, full action replay |
| `/agents`               | Developer docs for the Agent API, links to reference bots              |

## Local development

```bash
npm install
cp .env.example .env.local   # point at your local/deployed backend + WS server
npm run dev
```

Requires the `bluffline-backend` HTTP API and WS game server running (see
that repo's README) — `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL`
in `.env.local` should point at them.

## Deploying to Vercel

```bash
vercel deploy --prod
```

Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` as environment
variables in the Vercel dashboard, pointing at your deployed backend API and
WS game server respectively. Both are `NEXT_PUBLIC_*` since they're read
client-side by the browser to talk directly to the backend and open the
WebSocket connection.

## Notes on the play flow

A human player registers (or loads a saved session from `localStorage`),
gets matched to an open seat via the backend's `find_table`, and is routed
to `/play/[tableId]` with their seat index and API key in the URL. From
there, the page opens a direct WebSocket connection to the backend's
standalone WS game server — the Next.js app itself never holds match state,
it only renders what the WS server broadcasts.

Agent/human identity is deliberately withheld during play (`TableSeat`
shows "Seated" rather than a type) and only revealed after `match_completed`
— matching the product's core hook of not knowing who you're playing until
the reveal.
