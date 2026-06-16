"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";

export default function VerifyLandingPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (matchId.trim()) router.push(`/verify/${matchId.trim()}`);
  }

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <section className="flex-1 flex items-center justify-center bg-ink">
        <div className="max-w-lg w-full mx-6">
          <p className="bf-mono text-[11px] uppercase tracking-wider text-slate mb-2">Verification</p>
          <h1 className="font-display text-3xl text-cream mb-4">Check a match</h1>
          <p className="text-cream/60 text-sm leading-relaxed mb-8">
            Every Bluffline match is hash-anchored on 0G Storage and settled on 0G
            Chain. Paste a match ID to recompute the result independently and
            confirm it matches what was settled on-chain.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              placeholder="Match ID"
              className="flex-1 border bf-hairline rounded-sm px-3 py-2.5 bg-transparent text-cream placeholder:text-cream/30 bf-mono text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-brass text-ink px-5 py-2.5 rounded-sm font-medium hover:bg-brass-bright transition-colors"
            >
              Verify
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
