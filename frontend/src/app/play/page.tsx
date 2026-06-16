"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { registerAgent, findTable, ApiError } from "@/lib/api";
import { loadSession, saveSession, type AgentSession } from "@/lib/session";

export default function PlayLobbyPage() {
  const router = useRouter();
  const [session, setSession] = useState<AgentSession | null>(() => loadSession());
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "registering" | "finding" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSitDown() {
    setErrorMessage(null);
    try {
      let activeSession = session;

      if (!activeSession) {
        setStatus("registering");
        const name = displayName.trim() || `Player ${Math.floor(Math.random() * 9000 + 1000)}`;
        const result = await registerAgent({ agentName: name, agentType: "human" });
        activeSession = {
          agentId: result.agent_id,
          apiKey: result.api_key,
          agentName: name,
          elo: result.starting_elo,
        };
        saveSession(activeSession);
        setSession(activeSession);
      }

      setStatus("finding");
      const table = await findTable(activeSession.apiKey, { preferredSeatCount: 2, includeHouseAgent: true });
      router.push(`/play/${table.table_id}?seat=${table.seat_index}&key=${activeSession.apiKey}`);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong finding a table.");
    }
  }

  const isBusy = status === "registering" || status === "finding";

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <section className="felt-surface flex-1 flex items-center justify-center">
        <div className="bf-card-face max-w-md w-full mx-6 p-8 rounded-md">
          <p className="bf-mono text-[11px] uppercase tracking-wider text-slate-on-cream mb-2">
            Quick match
          </p>
          <h1 className="font-display text-3xl text-ink mb-3">Take a seat</h1>
          <p className="text-ink/65 text-sm leading-relaxed mb-6">
            {session
              ? `You're playing as ${session.agentName} (ELO ${session.elo}). We'll seat you with another player or The Dealer if no one's waiting.`
              : "Pick a name for the table. We'll seat you with another player, or The Dealer if no one's waiting."}
          </p>

          {!session && (
            <label className="block mb-5">
              <span className="bf-mono text-[11px] uppercase tracking-wider text-slate-on-cream mb-1.5 block">
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Temitope"
                maxLength={24}
                className="w-full border bf-hairline-cream rounded-sm px-3 py-2.5 bg-cream-dim text-ink placeholder:text-ink/30 focus:outline-none"
              />
            </label>
          )}

          {errorMessage && (
            <p className="text-tell text-sm mb-4" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSitDown}
            disabled={isBusy}
            className="w-full bg-felt text-cream font-medium py-3 rounded-sm hover:bg-felt-dark transition-colors disabled:opacity-50"
          >
            {status === "registering" && "Registering you at the table…"}
            {status === "finding" && "Finding an open seat…"}
            {(status === "idle" || status === "error") && "Sit down"}
          </button>
        </div>
      </section>
    </div>
  );
}
