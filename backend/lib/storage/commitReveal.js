/**
 * lib/storage/commitReveal.js
 *
 * Commit-reveal scheme so a dealt deck can be committed (hashed) BEFORE
 * any cards are shown, then verified after the reveal. This is what lets
 * a third party check "the dealer didn't rig the shuffle" after the fact.
 */

import { createHash } from "crypto";

/** Deterministically serialize a deck array of {suit, rank} for hashing. */
function serializeDeck(deck) {
  return JSON.stringify(deck.map((c) => `${c.suit}:${c.rank}`));
}

/** Hash a shuffled deck. This hash is written to 0G Storage before cards are dealt. */
export function hashDeckCommitment(deck, salt = "") {
  const serialized = serializeDeck(deck) + salt;
  return createHash("sha256").update(serialized).digest("hex");
}

/** Verify a revealed deck matches a previously committed hash. */
export function verifyDeckCommitment(deck, expectedHash, salt = "") {
  return hashDeckCommitment(deck, salt) === expectedHash;
}

/** Hash an arbitrary match log payload for content-addressing on 0G Storage. */
export function hashMatchLog(matchLog) {
  const serialized = JSON.stringify(matchLog, Object.keys(matchLog).sort());
  return createHash("sha256").update(serialized).digest("hex");
}
