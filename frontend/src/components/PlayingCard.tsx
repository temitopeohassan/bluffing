"use client";

import { suitGlyph, formatRank } from "@/lib/claims";
import type { Card } from "@/lib/types";
import clsx from "clsx";

const RED_SUITS = new Set(["hearts", "diamonds"]);

export function PlayingCard({
  card,
  hidden = false,
  size = "md",
}: {
  card?: Card;
  hidden?: boolean;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "w-10 h-14" : "w-14 h-20";

  if (hidden || !card) {
    return (
      <div
        className={clsx(dimensions, "bf-card-back flex items-center justify-center shrink-0")}
        aria-label="Hidden card"
      >
        <span className="font-display text-brass/50 text-lg italic">B</span>
      </div>
    );
  }

  const isRed = RED_SUITS.has(card.suit);

  return (
    <div
      className={clsx(dimensions, "bf-card-face flex flex-col items-center justify-center shrink-0 gap-0.5")}
      aria-label={`${formatRank(card.rank)} of ${card.suit}`}
    >
      <span className={clsx("font-display font-semibold text-lg leading-none", isRed ? "text-tell" : "text-ink")}>
        {formatRank(card.rank)}
      </span>
      <span className={clsx("text-base leading-none", isRed ? "text-tell" : "text-ink")}>
        {suitGlyph(card.suit)}
      </span>
    </div>
  );
}
