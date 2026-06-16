"use client";

import { useState } from "react";
import { CLAIM_LADDER, CLAIM_LABELS, formatClaim } from "@/lib/claims";
import type { Claim, ClaimType } from "@/lib/types";
import clsx from "clsx";

export function ActionPanel({
  currentClaim,
  isYourTurn,
  onSubmitClaim,
  onCallBluff,
}: {
  currentClaim: Claim | null;
  isYourTurn: boolean;
  onSubmitClaim: (claim: Claim) => void;
  onCallBluff: () => void;
}) {
  const minType: ClaimType = currentClaim?.claim_type ?? "high_card";
  const minTypeIndex = CLAIM_LADDER.indexOf(minType);

  const [claimType, setClaimType] = useState<ClaimType>(minType);
  const [rankThreshold, setRankThreshold] = useState<number>(
    currentClaim ? Math.min(9, currentClaim.rank_threshold + 1) : 3
  );

  if (!isYourTurn) {
    return (
      <div className="flex items-center justify-center py-6 text-slate text-sm">
        Waiting for the table&rsquo;s move&hellip;
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bf-card-face p-4 rounded-md">
      <div>
        <p className="bf-mono text-[11px] uppercase tracking-wider text-slate-on-cream mb-2">
          Standing claim
        </p>
        <p className="font-display text-base text-ink">{formatClaim(currentClaim)}</p>
      </div>

      <div className="h-px bf-hairline-cream" />

      <div>
        <p className="bf-mono text-[11px] uppercase tracking-wider text-slate-on-cream mb-2">
          Raise the claim
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CLAIM_LADDER.map((type, i) => (
            <button
              key={type}
              type="button"
              disabled={i < minTypeIndex}
              onClick={() => setClaimType(type)}
              className={clsx(
                "px-2.5 py-1.5 rounded-sm text-xs font-medium border transition-colors",
                claimType === type
                  ? "bg-felt text-cream border-felt"
                  : "border-ink/15 text-ink/70 hover:border-ink/40",
                i < minTypeIndex && "opacity-30 cursor-not-allowed"
              )}
            >
              {CLAIM_LABELS[type]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 text-sm text-ink/80">
          Rank threshold
          <input
            type="range"
            min={1}
            max={9}
            value={rankThreshold}
            onChange={(e) => setRankThreshold(Number(e.target.value))}
            className="flex-1 accent-[var(--bf-felt)]"
          />
          <span className="bf-mono w-6 text-right">{rankThreshold}</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSubmitClaim({ claim_type: claimType, rank_threshold: rankThreshold })}
          className="flex-1 bg-felt text-cream font-medium text-sm py-2.5 rounded-sm hover:bg-felt-dark transition-colors"
        >
          Raise claim
        </button>
        <button
          type="button"
          disabled={!currentClaim}
          onClick={onCallBluff}
          className={clsx(
            "flex-1 font-medium text-sm py-2.5 rounded-sm transition-colors border",
            currentClaim
              ? "bg-tell text-cream border-tell hover:bg-tell/85"
              : "border-ink/15 text-ink/30 cursor-not-allowed"
          )}
        >
          Call bluff
        </button>
      </div>
    </div>
  );
}
