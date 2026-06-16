"use client";

/**
 * src/components/ClaimLadder.tsx
 *
 * Bluffline's signature visual element: the claim ladder rendered as a
 * vertical rising stack of rungs. As players escalate their claim, the
 * filled rung rises and the rank threshold glows brighter — this is the
 * one truly unique visual in the app and doubles as a live tension meter
 * during play.
 */

import { CLAIM_LADDER, CLAIM_LABELS, claimRung } from "@/lib/claims";
import type { Claim } from "@/lib/types";
import clsx from "clsx";

export function ClaimLadder({ claim }: { claim: Claim | null }) {
  const activeRung = claimRung(claim);

  return (
    <div className="flex flex-col items-stretch gap-0.5 w-full max-w-[220px]" aria-label="Claim ladder">
      {[...CLAIM_LADDER].reverse().map((type) => {
        const rung = CLAIM_LADDER.indexOf(type);
        const isActive = rung === activeRung;
        const isPassed = rung < activeRung;

        return (
          <div
            key={type}
            className={clsx(
              "relative flex items-center justify-between px-3 py-2 rounded-sm border transition-all duration-300",
              isActive && "border-brass bg-brass/15",
              isPassed && !isActive && "border-brass/20 bg-cream/[0.02]",
              !isActive && !isPassed && "border-cream/[0.06] bg-transparent"
            )}
          >
            <span
              className={clsx(
                "font-display text-sm tracking-wide transition-colors duration-300",
                isActive ? "text-brass-bright" : isPassed ? "text-cream/40" : "text-cream/25"
              )}
            >
              {CLAIM_LABELS[type]}
            </span>
            {isActive && claim && (
              <span className="bf-mono text-xs text-brass-bright tabular-nums">
                {claim.rank_threshold}+
              </span>
            )}
            {isActive && (
              <span
                className="absolute inset-0 rounded-sm pointer-events-none"
                style={{ boxShadow: "0 0 0 1px var(--bf-brass), 0 0 16px -2px var(--bf-brass)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
