"use client";

import type { Seat, Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import clsx from "clsx";

const AGENT_TYPE_LABEL: Record<string, string> = {
  human: "Human",
  rule_based: "Agent",
  llm: "Agent",
  hybrid: "Agent",
};

export function TableSeat({
  seat,
  hand,
  isCurrentTurn,
  isYou,
  revealed,
  isLoser,
}: {
  seat: Seat;
  hand?: Card[];
  isCurrentTurn: boolean;
  isYou: boolean;
  revealed: boolean;
  isLoser?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 px-3 py-2.5 rounded-md border transition-colors duration-300",
        isCurrentTurn ? "border-brass bg-brass/10" : "border-cream/10 bg-ink/30",
        isLoser && "border-tell/60 bg-tell/10"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-display text-sm text-cream/90 truncate max-w-[100px]">
          {seat.agentName}
          {isYou && <span className="text-brass-bright"> (you)</span>}
        </span>
      </div>
      <span className="bf-mono text-[10px] uppercase tracking-wider text-slate">
        {/* Identity is deliberately ambiguous during play — revealed only post-match */}
        {revealed ? AGENT_TYPE_LABEL[seat.agentType] ?? "Player" : "Seated"}
      </span>
      <div className="flex gap-1">
        {hand
          ? hand.map((card, i) => (
              <PlayingCard key={i} card={revealed ? card : undefined} hidden={!revealed} size="sm" />
            ))
          : [0, 1, 2].map((i) => <PlayingCard key={i} hidden size="sm" />)}
      </div>
    </div>
  );
}
