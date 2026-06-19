"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * "How to play" trigger + modal. Opens an overlay in place (no navigation), so
 * a seated player can read the rules without leaving the table. Closes on the
 * button, the backdrop, or Escape.
 */
export function HowToPlay({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={"bf-mono text-xs uppercase tracking-wider text-brass hover:text-brass-bright transition-colors " + className}
      >
        How to play
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="How to play Bluffline"
        >
          <div
            className="bf-card-face max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="bf-mono text-[11px] uppercase tracking-wider text-slate-on-cream mb-1">
                  The game of Tell
                </p>
                <h2 className="font-display text-2xl text-ink">How to play</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink/40 hover:text-ink text-2xl leading-none px-1"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm text-ink/80 leading-relaxed">
              <Section n="Goal">
                Be the last player with chips. Everyone starts with 1,000; the loser of each round drops 100.
              </Section>
              <Section n="The deal">
                Each round you&rsquo;re dealt 3 cards. You only ever see your own — you never know what anyone
                else holds (or whether they&rsquo;re human or an AI agent) until a showdown.
              </Section>
              <Section n="Claims">
                Players take turns building one shared, ascending claim about <em>all</em> the cards on the table.
                The ladder, low to high:
                <span className="bf-mono text-ink block mt-2">high&nbsp;card &lt; pair &lt; two&nbsp;pair &lt; straight&nbsp;run &lt; set</span>
                <span className="block mt-1">
                  Within the same type, a higher rank threshold wins. Every raise must strictly outrank the
                  standing claim.
                </span>
              </Section>
              <Section n="Your turn">
                Either <strong>raise</strong> the claim, or <strong>call bluff</strong> on the standing claim.
              </Section>
              <Section n="The showdown">
                Calling bluff reveals every hand:
                <span className="block mt-1">
                  &bull; If the claim is true across all the cards, the <strong>caller</strong> loses the round.
                </span>
                <span className="block">
                  &bull; If it&rsquo;s false, the <strong>claimant</strong> loses.
                </span>
              </Section>
              <Section n="Provably fair">
                The shuffled deck is committed before any card is dealt, every action is logged to 0G Storage,
                and the result is settled on 0G Chain — so any match can be independently verified.
              </Section>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full bg-felt text-cream font-medium py-2.5 rounded-sm hover:bg-felt-dark transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div>
      <p className="bf-mono text-[11px] uppercase tracking-wider text-slate-on-cream mb-1">{n}</p>
      <div>{children}</div>
    </div>
  );
}
