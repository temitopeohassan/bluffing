# Bluffline

**A verifiable bluffing card game where humans and AI agents share the same table — and you can't tell which is which — with every hand provably fair and every result settled on 0G.**

Built for the **Zero Cup 2026** tournament on [0G](https://0g.ai).

🎮 **Play:** https://bluffing-frontend.vercel.app

---

## The hook

Bluffline is a real-time, multiplayer bluffing card game called **"Tell."** Humans and AI agents sit at the *same* table, and seats are deliberately unlabeled — you don't know whether you're bluffing against a person or a bot until the hand is revealed. What makes it more than a card game: every shuffle is committed before cards are dealt, every action is logged to **0G Storage**, and every result is settled on **0G Chain**. Nobody has to trust the house — any match can be independently re-verified by anyone.

---

## How to play ("Tell")

- **Deck & deal.** A 36-card deck (4 suits × ranks 1–9). Each round every seat is dealt **3 cards**. You see only your own hand.
- **The claim ladder.** Players take turns building one shared, *ascending* claim about **all** the cards on the table (not just their own):

  `high card < pair < two pair < straight run < set` — ties broken by a higher rank threshold.

  Every raise must **strictly outrank** the standing claim.
- **Your turn — raise or call.** Either **raise** the claim, or **call bluff** on the standing claim. A claim is a bet, not a fact; the only moment of truth is a bluff call.
- **The showdown.** Calling bluff reveals every hand:
  - The claim **holds** (true across all cards on the table) → the **caller** was wrong and loses the round.
  - The claim **fails** → the **claimant** was bluffing and loses.
- **Chips & winning.** Everyone starts a match with **1,000 chips**. Each round is a zero-sum transfer — the loser pays **100 to the winner**, so winning grows your stack. Reach 0 and you're out; the last player standing (most chips) wins. The showdown spells out who called, the claim, who was right, and the swing.
- **Ranking.** Chips decide a single match; your persistent score is **ELO** (start 1200), updated on match completion and settled on-chain — that's the leaderboard.

---

## Features

- **Two ways to play:** instant heads-up vs **The Dealer** (house bot), or open a **human table** with a minimum player count (2–6) and a **60-second pre-game countdown** once the minimum is met.
- **Find a game:** browse the live **Open Tables** list, **join by Table ID or invite link**, or share your table's invite link with a friend. One player, one table at a time.
- **Wallet-bound identity:** connect a wallet on the **0G testnet** and sign a message to prove ownership. Your **username is globally unique** and tied to your wallet — it loads on any device, and you can change it.
- **Provably fair:** pre-deal deck commitment + full action log on **0G Storage** + result/ELO settled on **0G Chain**, with a public **Verify** page that re-fetches the log and confirms it matches the on-chain record.
- **Anti-stall play:** a visible **20s turn timer** — a timeout *skips* your turn; 3 misses in a row warns you and speeds up your clock; 5 in a row treats you as away (forfeit). Leaving or disconnecting forfeits to your opponent (with a brief reconnect grace).
- **Game feel:** move sounds (deal, claim, your turn, bluff, reveal), a "get ready" fanfare at T‑5s of the countdown, and a confetti **win celebration** — including when an opponent forfeits.
- **Agent-friendly:** an MCP-style API (see [`mcp/mcp.json`](mcp/mcp.json)) and runnable reference bots in [`backend/agents/`](backend/agents) so anyone can plug a model into a seat.

---

## 0G integration

| Layer | Used for |
|---|---|
| **0G Storage** | Immutable, content-addressed match logs + pre-deal deck commitments (commit–reveal). |
| **0G Chain** | Single source of truth for match settlement and the ELO leaderboard, via the `BlufflineSettlement` contract. |

**Live testnet deployment (0G Galileo, chain ID 16602):**
- Settlement contract: `0xFd800FA84B797F273F82949BcAd1b08c48BB8D1b` ([explorer](https://chainscan-galileo.0g.ai))
- Storage SDK: `@0gfoundation/0g-storage-ts-sdk` against the testnet turbo indexer

A completed match is verifiable end-to-end: its log lives on 0G Storage (Merkle root), that root is pinned on 0G Chain, and `/verify` independently re-fetches and re-checks it.

---

## Architecture

```
┌────────────────────┐      ┌───────────────────────────┐
│  Next.js frontend   │      │   WebSocket game server     │
│  (Vercel)           │      │   (Railway)                 │
│  felt-table UI      │      │   - owns live match state   │
└─────────┬───────────┘      │   - turn loop, matchmaking  │
          │                  │   - writes to 0G on finalize │
          │ REST            └───────────┬─────────────────┘
          ▼                              │
┌────────────────────┐                   ▼
│  HTTP API (Vercel)  │        ┌────────────────────┐
│  register/login/    │───────▶│  0G Storage + Chain  │
│  matchmake/verify   │        └────────────────────┘
│  + Upstash Redis    │
└────────────────────┘
```

- **Frontend** (`frontend/`) — Next.js + Tailwind; the table, lobby, leaderboard, and verify pages.
- **HTTP API** (`backend/api/`) — stateless Vercel functions: registration, wallet sign-in, matchmaking proxy, leaderboard/verify reads. Agent identities persist in **Upstash Redis**.
- **WS game server** (`backend/ws-server/`) — a long-lived Node process that holds all live match state, runs the turn-by-turn loop, and writes to 0G Storage + Chain when a match finalizes. (Deployed separately because Vercel functions can't hold persistent sockets.)
- **Engine** (`backend/lib/game/engine.js`) — pure, unit-tested rules (deck, claim ladder, evaluation, ELO) shared by both.

---

## Repo layout

```
frontend/                Next.js app (UI)
backend/
  api/v1/                Vercel HTTP API (register, login, tables, matches, leaderboard)
  ws-server/server.js    Standalone WebSocket game server
  lib/game/              Pure rules engine + match state machine
  lib/storage/           0G Storage client + commit-reveal hashing
  lib/chain/             0G Chain client (ethers) + agent→address mapping
  lib/walletAuth.js      Wallet signature verification (sign-in)
  contracts/             BlufflineSettlement.sol
  agents/                Reference bots (rule-based + LLM)
mcp/mcp.json             Agent-facing API/tool specification
DEPLOY.md                Production deploy guide (Vercel + Railway)
```

---

## Local development

Requires **Node ≥ 20.9**. Without 0G credentials, the storage and chain clients fall back to in-memory mocks (`NODE_ENV !== "production"`), so the whole game loop is playable locally with zero external dependencies.

```bash
# 1) WebSocket game server  (terminal 1)
cd backend
npm install
WS_SERVER_INTERNAL_SHARED_SECRET=dev-secret npm run ws:dev   # :8080

# 2) HTTP API  (terminal 2) — Vercel dev, or any host for the api/v1 functions
WS_SERVER_INTERNAL_SHARED_SECRET=dev-secret npm run dev       # :3001

# 3) Frontend  (terminal 3)
cd ../frontend
npm install
npm run dev                                                  # :3000
```

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env.local` and fill in values as needed. To exercise live 0G on testnet, set the `ZEROG_*` vars plus `ZEROG_CHAIN_LIVE=1` / `ZEROG_STORAGE_LIVE=1` on the WS server.

Run the engine unit tests:

```bash
cd backend && npm test
```

See [`DEPLOY.md`](DEPLOY.md) for the full production deploy (Vercel × 2 + Railway + Upstash) and [`backend/README.md`](backend/README.md) for backend specifics.

---

## Reference agents

Anyone can build a bot for a seat. Runnable starting points:

```bash
cd backend
node agents/rule-based-agent.js http://localhost:3001/v1 ws://localhost:8080/v1/ws
ANTHROPIC_API_KEY=sk-... node agents/llm-agent.js http://localhost:3001/v1 ws://localhost:8080/v1/ws
```

---

## Team

- Believe
- Ola
- Temitope
