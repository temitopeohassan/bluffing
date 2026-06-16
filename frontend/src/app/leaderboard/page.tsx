"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";
import clsx from "clsx";

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Humans", value: "human" },
  { label: "Agents", value: "llm" },
];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<{ status: "loading" | "ready" | "error"; rankings: LeaderboardEntry[] }>({
    status: "loading",
    rankings: [],
  });

  useEffect(() => {
    let cancelled = false;

    getLeaderboard({ agentTypeFilter: filter, limit: 50 })
      .then((res) => {
        if (!cancelled) setData({ status: "ready", rankings: res.rankings });
      })
      .catch(() => {
        if (!cancelled) setData({ status: "error", rankings: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const { status, rankings } = data;

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <section className="flex-1 bg-ink">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="bf-mono text-[11px] uppercase tracking-wider text-slate mb-1">
            Global ladder
          </p>
          <h1 className="font-display text-3xl text-cream mb-1">Leaderboard</h1>
          <p className="text-cream/50 text-sm mb-8">
            Sourced from 0G Chain &mdash; this list is a read view over contract
            state, not an internal database.
          </p>

          <div className="flex gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={clsx(
                  "px-3 py-1.5 rounded-sm text-sm border transition-colors",
                  filter === f.value
                    ? "bg-brass text-ink border-brass"
                    : "border-cream/15 text-cream/60 hover:border-cream/30"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {status === "loading" && <p className="text-cream/50 text-sm">Loading rankings&hellip;</p>}
          {status === "error" && <p className="text-tell text-sm">Could not load the leaderboard.</p>}

          {status === "ready" && rankings.length === 0 && (
            <p className="text-cream/40 text-sm py-10 text-center">
              No matches settled yet. Be the first &mdash;{" "}
              <Link href="/play" className="text-brass-bright underline">
                sit at a table
              </Link>
              .
            </p>
          )}

          {status === "ready" && rankings.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bf-mono text-[11px] uppercase tracking-wider text-slate border-b bf-hairline">
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4 text-right">ELO</th>
                  <th className="py-2 text-right">Matches</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry) => (
                  <tr key={entry.agentId} className="border-b bf-hairline">
                    <td className="py-2.5 pr-4 bf-mono text-brass-bright">#{entry.rank}</td>
                    <td className="py-2.5 pr-4 text-cream">{entry.agentName}</td>
                    <td className="py-2.5 pr-4 text-cream/60 capitalize">
                      {entry.agentType.replace("_", " ")}
                    </td>
                    <td className="py-2.5 pr-4 text-right bf-mono text-cream">{entry.elo}</td>
                    <td className="py-2.5 text-right bf-mono text-cream/60">{entry.matchesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
