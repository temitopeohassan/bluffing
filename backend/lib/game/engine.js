/**
 * lib/game/engine.js
 *
 * Core rules engine for "Tell", Bluffline's bluffing card game.
 * Pure functions only — no I/O, no 0G calls — so this can be unit tested
 * in isolation and reused identically by both the Vercel API and the
 * standalone WebSocket game server.
 */

export const SUITS = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const HAND_SIZE = 3;

export const CLAIM_TYPES = ["high_card", "pair", "two_pair", "straight_run", "set"];

// Ordering weight for claim_type — used to compare claims on the ladder.
const CLAIM_TYPE_WEIGHT = {
  high_card: 0,
  pair: 1,
  two_pair: 2,
  straight_run: 3,
  set: 4,
};

/** Build a fresh 36-card deck: [{ suit, rank }] */
export function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle. Accepts an injectable RNG for deterministic tests. */
export function shuffleDeck(deck, rng = Math.random) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal `seatCount` hands of HAND_SIZE cards each from a shuffled deck.
 * Returns { hands: Card[][], remainder: Card[] }
 */
export function dealHands(shuffledDeck, seatCount) {
  const hands = Array.from({ length: seatCount }, () => []);
  let cursor = 0;
  for (let i = 0; i < HAND_SIZE; i++) {
    for (let seat = 0; seat < seatCount; seat++) {
      hands[seat].push(shuffledDeck[cursor]);
      cursor++;
    }
  }
  return { hands, remainder: shuffledDeck.slice(cursor) };
}

/**
 * Compare two claims per the claim ladder.
 * Returns positive if claimB outranks claimA, negative if claimA outranks claimB, 0 if equal.
 */
export function compareClaims(claimA, claimB) {
  const typeWeightA = CLAIM_TYPE_WEIGHT[claimA.claim_type];
  const typeWeightB = CLAIM_TYPE_WEIGHT[claimB.claim_type];
  if (typeWeightA !== typeWeightB) return typeWeightB - typeWeightA;

  if (claimA.rank_threshold !== claimB.rank_threshold) {
    return claimB.rank_threshold - claimA.rank_threshold;
  }

  const suitCountA = claimA.suit_count ?? 0;
  const suitCountB = claimB.suit_count ?? 0;
  return suitCountB - suitCountA;
}

/** Returns true if `claim` strictly outranks `currentClaim` (or currentClaim is null, i.e. opening claim). */
export function isValidRaise(currentClaim, claim) {
  if (!CLAIM_TYPES.includes(claim.claim_type)) return false;
  if (claim.rank_threshold < 1 || claim.rank_threshold > 9) return false;
  if (!currentClaim) return true;
  return compareClaims(currentClaim, claim) > 0;
}

/**
 * Evaluate whether a claim holds true against the combined hands at the table.
 * combinedHands: Card[][] (one array per seat)
 * Returns { claimHolds: boolean, evidence: object } for transparency in the reveal.
 */
export function evaluateClaim(claim, combinedHands) {
  const allCards = combinedHands.flat();
  const rankCounts = {};
  for (const card of allCards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }

  switch (claim.claim_type) {
    case "high_card": {
      const hasHighCard = allCards.some((c) => c.rank >= claim.rank_threshold);
      return { claimHolds: hasHighCard, evidence: { rankCounts } };
    }
    case "pair": {
      const hasPairAtOrAbove = Object.entries(rankCounts).some(
        ([rank, count]) => Number(rank) >= claim.rank_threshold && count >= 2
      );
      return { claimHolds: hasPairAtOrAbove, evidence: { rankCounts } };
    }
    case "two_pair": {
      const pairRanks = Object.entries(rankCounts).filter(
        ([rank, count]) => Number(rank) >= claim.rank_threshold && count >= 2
      );
      return { claimHolds: pairRanks.length >= 2, evidence: { rankCounts } };
    }
    case "straight_run": {
      const presentRanks = new Set(allCards.map((c) => c.rank));
      let longestRun = 0;
      let currentRun = 0;
      for (let r = 1; r <= 9; r++) {
        if (presentRanks.has(r)) {
          currentRun++;
          longestRun = Math.max(longestRun, currentRun);
        } else {
          currentRun = 0;
        }
      }
      const runLengthNeeded = claim.suit_count || 3;
      return { claimHolds: longestRun >= runLengthNeeded, evidence: { presentRanks: [...presentRanks] } };
    }
    case "set": {
      const hasSetAtOrAbove = Object.entries(rankCounts).some(
        ([rank, count]) => Number(rank) >= claim.rank_threshold && count >= 3
      );
      return { claimHolds: hasSetAtOrAbove, evidence: { rankCounts } };
    }
    default:
      return { claimHolds: false, evidence: {} };
  }
}

/**
 * Resolve a bluff call: returns the seat index that loses the round.
 * If the claim holds, the caller loses. If it doesn't, the claimant loses.
 */
export function resolveBluffCall({ claimantSeat, callingSeat, claim, combinedHands }) {
  const { claimHolds, evidence } = evaluateClaim(claim, combinedHands);
  const loserSeat = claimHolds ? callingSeat : claimantSeat;
  return { claimHolds, loserSeat, evidence };
}

/** Simple ELO update. Returns { winnerNewElo, loserNewElo, winnerDelta, loserDelta } */
export function updateElo(winnerElo, loserElo, kFactor = 24) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;
  const winnerDelta = Math.round(kFactor * (1 - expectedWinner));
  const loserDelta = Math.round(kFactor * (0 - expectedLoser));
  return {
    winnerNewElo: winnerElo + winnerDelta,
    loserNewElo: loserElo + loserDelta,
    winnerDelta,
    loserDelta,
  };
}
