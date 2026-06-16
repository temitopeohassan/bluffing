/**
 * src/lib/claims.ts
 * Display helpers for claims/the claim ladder. Mirrors the ranking logic in
 * bluffline-backend/lib/game/engine.js — kept separate since the frontend
 * never authoritatively resolves a claim, only renders one.
 */

import type { Claim, ClaimType } from "./types";

export const CLAIM_LADDER: ClaimType[] = ["high_card", "pair", "two_pair", "straight_run", "set"];

export const CLAIM_LABELS: Record<ClaimType, string> = {
  high_card: "High Card",
  pair: "Pair",
  two_pair: "Two Pair",
  straight_run: "Straight Run",
  set: "Set",
};

/** 0-4 rung index on the visual ladder, used to size/position the rising bar. */
export function claimRung(claim: Claim | null): number {
  if (!claim) return -1;
  return CLAIM_LADDER.indexOf(claim.claim_type);
}

export function formatClaim(claim: Claim | null): string {
  if (!claim) return "No claim yet — table is open";
  const label = CLAIM_LABELS[claim.claim_type];
  return `${label}, rank ${claim.rank_threshold}+`;
}

const RANK_LABELS: Record<number, string> = {
  1: "Ace", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
};

export function formatRank(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

const SUIT_GLYPH: Record<string, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

export function suitGlyph(suit: string): string {
  return SUIT_GLYPH[suit] ?? "?";
}
