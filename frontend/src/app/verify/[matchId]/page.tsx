"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { verifyMatch, getMatchLog, ApiError } from "@/lib/api";
import type { VerifyMatchResponse, MatchLogResponse } from "@/lib/types";
import clsx from "clsx";

export default function VerifyMatchPage() {
  const params = useParams<{ matchId: string }>();
  const [verification, setVerification] = useState<VerifyMatchResponse | null>(null);
  const [log, setLog] = useState<MatchLogResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!params.matchId) return;
    (async () => {
      try {
        const [verifyResult, logResult] = await Promise.all([
          verifyMatch(params.matchId),
          getMatchLog(params.matchId),
        ]);
        setVerification(verifyResult);
        setLog(logResult);
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof ApiError ? err.message : "Could not load this match.");
      }
    })();
  }, [params.matchId]);

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <section className="flex-1 bg-ink">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="bf-mono text-[11px] uppercase tracking-wider text-slate mb-1">
            Verification ledger
          </p>
          <h1 className="font-display text-3xl text-cream mb-1 break-all">{params.matchId}</h1>

          {status === "loading" && <p className="text-cream/50 text-sm mt-6">Recomputing result&hellip;</p>}

          {status === "error" && (
            <p className="text-tell text-sm mt-6" role="alert">
              {errorMessage}
            </p>
          )}

          {status === "ready" && verification && (
            <>
              <div
                className={clsx(
                  "mt-8 border rounded-md px-5 py-4 flex items-center gap-3",
                  verification.recomputed_result_matches_chain
                    ? "border-brass/40 bg-brass/10"
                    : "border-tell/50 bg-tell/10"
                )}
              >
                <span
                  className={clsx(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    verification.recomputed_result_matches_chain ? "bg-brass" : "bg-tell"
                  )}
                />
                <p className="font-display text-base text-cream">
                  {verification.recomputed_result_matches_chain
                    ? "Recomputed result matches the on-chain record."
                    : "Recomputed result does not match the on-chain record."}
                </p>
              </div>

              <dl className="mt-8 divide-y bf-hairline">
                <Row label="0G Storage content hash" value={verification.storage_content_hash} />
                <Row label="0G Chain transaction" value={verification.chain_tx_hash ?? "—"} />
              </dl>

              <h2 className="font-display text-xl text-cream mt-10 mb-3">Final standings</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bf-mono text-[11px] uppercase tracking-wider text-slate border-b bf-hairline">
                    <th className="py-2 pr-4">Placement</th>
                    <th className="py-2 pr-4">Agent</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 text-right">ELO delta</th>
                  </tr>
                </thead>
                <tbody>
                  {verification.final_standings
                    .slice()
                    .sort((a, b) => a.placement - b.placement)
                    .map((s) => (
                      <tr key={s.agent_id} className="border-b bf-hairline">
                        <td className="py-2.5 pr-4 text-cream">#{s.placement}</td>
                        <td className="py-2.5 pr-4 bf-mono text-cream/70 break-all">{s.agent_id}</td>
                        <td className="py-2.5 pr-4 text-cream/70">{s.agent_type}</td>
                        <td
                          className={clsx(
                            "py-2.5 text-right bf-mono",
                            s.elo_delta >= 0 ? "text-brass-bright" : "text-tell"
                          )}
                        >
                          {s.elo_delta >= 0 ? "+" : ""}
                          {s.elo_delta}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {log && (
                <>
                  <h2 className="font-display text-xl text-cream mt-10 mb-3">Action-by-action replay</h2>
                  <p className="text-cream/50 text-sm mb-4">
                    Reconstructed directly from the 0G Storage log &mdash; this is the same data the
                    on-chain result was computed from.
                  </p>
                  <ol className="flex flex-col gap-1.5">
                    {log.actions.map((action) => (
                      <li
                        key={action.sequence}
                        className="flex items-baseline gap-3 text-sm border-b bf-hairline py-1.5"
                      >
                        <span className="bf-mono text-cream/30 w-8 text-right">{action.sequence}</span>
                        <span className="bf-mono text-brass-bright w-24 shrink-0">{action.actionType}</span>
                        <span className="text-cream/60">
                          {action.seatIndex !== null ? `Seat ${action.seatIndex}` : "Table"}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="bf-mono text-[11px] uppercase tracking-wider text-slate">{label}</span>
      <span className="bf-mono text-sm text-cream/80 break-all text-right max-w-[60%]">{value}</span>
    </div>
  );
}
