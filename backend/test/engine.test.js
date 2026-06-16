import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDeck,
  shuffleDeck,
  dealHands,
  compareClaims,
  isValidRaise,
  evaluateClaim,
  resolveBluffCall,
  updateElo,
} from "../lib/game/engine.js";

test("buildDeck produces 36 unique cards", () => {
  const deck = buildDeck();
  assert.equal(deck.length, 36);
  const unique = new Set(deck.map((c) => `${c.suit}:${c.rank}`));
  assert.equal(unique.size, 36);
});

test("shuffleDeck preserves all cards, just reorders", () => {
  const deck = buildDeck();
  const shuffled = shuffleDeck(deck, () => 0.42);
  assert.equal(shuffled.length, deck.length);
  const sortKey = (c) => `${c.suit}:${c.rank}`;
  assert.deepEqual(
    [...shuffled].map(sortKey).sort(),
    [...deck].map(sortKey).sort()
  );
});

test("dealHands deals correct hand sizes with no overlap", () => {
  const deck = shuffleDeck(buildDeck(), () => 0.5);
  const { hands, remainder } = dealHands(deck, 4);
  assert.equal(hands.length, 4);
  hands.forEach((hand) => assert.equal(hand.length, 3));
  assert.equal(remainder.length, 36 - 4 * 3);
});

test("compareClaims ranks claim_type above rank_threshold above suit_count", () => {
  const pairClaim = { claim_type: "pair", rank_threshold: 5 };
  const twoPairClaim = { claim_type: "two_pair", rank_threshold: 1 };
  assert.ok(compareClaims(pairClaim, twoPairClaim) > 0, "two_pair should outrank pair regardless of rank_threshold");
});

test("isValidRaise accepts any opening claim", () => {
  assert.ok(isValidRaise(null, { claim_type: "high_card", rank_threshold: 1 }));
});

test("isValidRaise rejects a claim that does not outrank current", () => {
  const current = { claim_type: "pair", rank_threshold: 5 };
  const sameRank = { claim_type: "pair", rank_threshold: 5 };
  assert.equal(isValidRaise(current, sameRank), false);
});

test("isValidRaise accepts a strictly higher rank within same claim_type", () => {
  const current = { claim_type: "pair", rank_threshold: 5 };
  const higher = { claim_type: "pair", rank_threshold: 6 };
  assert.ok(isValidRaise(current, higher));
});

test("evaluateClaim correctly validates a true pair claim", () => {
  const hands = [
    [{ suit: "spades", rank: 7 }, { suit: "hearts", rank: 2 }, { suit: "clubs", rank: 3 }],
    [{ suit: "diamonds", rank: 7 }, { suit: "spades", rank: 4 }, { suit: "hearts", rank: 9 }],
  ];
  const { claimHolds } = evaluateClaim({ claim_type: "pair", rank_threshold: 7 }, hands);
  assert.equal(claimHolds, true);
});

test("evaluateClaim correctly flags a false pair claim as not holding", () => {
  const hands = [
    [{ suit: "spades", rank: 7 }, { suit: "hearts", rank: 2 }, { suit: "clubs", rank: 3 }],
    [{ suit: "diamonds", rank: 6 }, { suit: "spades", rank: 4 }, { suit: "hearts", rank: 9 }],
  ];
  const { claimHolds } = evaluateClaim({ claim_type: "pair", rank_threshold: 7 }, hands);
  assert.equal(claimHolds, false);
});

test("resolveBluffCall: claimant loses when claim doesn't hold", () => {
  const hands = [
    [{ suit: "spades", rank: 2 }, { suit: "hearts", rank: 2 }, { suit: "clubs", rank: 3 }],
  ];
  const { loserSeat, claimHolds } = resolveBluffCall({
    claimantSeat: 0,
    callingSeat: 1,
    claim: { claim_type: "set", rank_threshold: 9 },
    combinedHands: hands,
  });
  assert.equal(claimHolds, false);
  assert.equal(loserSeat, 0);
});

test("resolveBluffCall: caller loses when claim does hold", () => {
  const hands = [
    [{ suit: "spades", rank: 7 }, { suit: "hearts", rank: 7 }, { suit: "clubs", rank: 7 }],
  ];
  const { loserSeat, claimHolds } = resolveBluffCall({
    claimantSeat: 0,
    callingSeat: 1,
    claim: { claim_type: "set", rank_threshold: 5 },
    combinedHands: hands,
  });
  assert.equal(claimHolds, true);
  assert.equal(loserSeat, 1);
});

test("updateElo gives more points for an upset win", () => {
  const upset = updateElo(1100, 1400); // lower-rated player wins
  const expected = updateElo(1400, 1100); // higher-rated player wins
  assert.ok(upset.winnerDelta > expected.winnerDelta, "upset win should award more ELO than expected win");
});
