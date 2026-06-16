/**
 * lib/game/match.js
 *
 * In-memory match state machine for a single table of "Tell".
 * Owned and mutated by the WebSocket server process (see ws-server/).
 * The Vercel API never holds match state directly — it only reads
 * completed match logs from 0G Storage and chain settlement records.
 */

import { nanoid } from "nanoid";
import {
  buildDeck,
  shuffleDeck,
  dealHands,
  isValidRaise,
  resolveBluffCall,
} from "./engine.js";
import { hashDeckCommitment } from "../storage/commitReveal.js";

export const MATCH_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export class Match {
  constructor({ tableId, seats, startingChips = 1000 }) {
    this.matchId = nanoid();
    this.tableId = tableId;
    this.seats = seats; // [{ seatIndex, agentId, agentName, agentType }]
    this.chips = Object.fromEntries(seats.map((s) => [s.seatIndex, startingChips]));
    this.status = MATCH_STATUS.WAITING;
    this.actionLog = [];
    this.round = 0;
    this.currentClaim = null;
    this.currentTurnSeat = 0;
    this.hands = null;
    this.deckCommitmentHash = null;
    this.activeSeats = seats.map((s) => s.seatIndex);
  }

  /** Begin a new round: shuffle, commit hash, deal hands. */
  startRound(rng = Math.random) {
    const deck = shuffleDeck(buildDeck(), rng);
    this.deckCommitmentHash = hashDeckCommitment(deck);
    const { hands } = dealHands(deck, this.activeSeats.length);

    this.hands = {};
    this.activeSeats.forEach((seatIndex, i) => {
      this.hands[seatIndex] = hands[i];
    });

    this.status = MATCH_STATUS.IN_PROGRESS;
    this.round += 1;
    this.currentClaim = null;
    this.currentTurnSeat = this.activeSeats[this.round % this.activeSeats.length];

    this._log("deal_commit", null, {
      deck_commitment_hash: this.deckCommitmentHash,
      active_seats: this.activeSeats,
      round: this.round,
    });

    return {
      matchId: this.matchId,
      deckCommitmentHash: this.deckCommitmentHash,
      activeSeats: this.activeSeats,
    };
  }

  /** Submit a claim action for the current turn's seat. */
  submitClaim(seatIndex, claim) {
    this._assertTurn(seatIndex);
    if (!isValidRaise(this.currentClaim, claim)) {
      return { accepted: false, reason: "claim_does_not_outrank_current_claim" };
    }
    this.currentClaim = { ...claim, claimantSeat: seatIndex };
    this._log("claim", seatIndex, { claim });
    this._advanceTurn();
    return { accepted: true, nextTurnSeat: this.currentTurnSeat };
  }

  /** Submit a bluff call for the current turn's seat against the standing claim. */
  submitBluffCall(seatIndex) {
    this._assertTurn(seatIndex);
    if (!this.currentClaim) {
      return { accepted: false, reason: "no_standing_claim_to_call" };
    }

    const combinedHands = this.activeSeats.map((s) => this.hands[s]);
    const { claimHolds, loserSeat, evidence } = resolveBluffCall({
      claimantSeat: this.currentClaim.claimantSeat,
      callingSeat: seatIndex,
      claim: this.currentClaim,
      combinedHands,
    });

    this._log("bluff_call", seatIndex, { claim: this.currentClaim });
    this._log("reveal", null, {
      hands: this.hands,
      claimHolds,
      loserSeat,
      evidence,
    });

    this._applyRoundLoss(loserSeat);

    return {
      accepted: true,
      claimHolds,
      loserSeat,
      revealedHands: this.hands,
    };
  }

  /** Returns true if the match should end (one or fewer seats with chips remaining). */
  isMatchOver() {
    const remaining = this.activeSeats.filter((s) => this.chips[s] > 0);
    return remaining.length <= 1;
  }

  /** Finalize the match: compute standings, return data for 0G Storage + Chain writes. */
  finalize() {
    this.status = MATCH_STATUS.COMPLETED;
    const standings = [...this.seats]
      .sort((a, b) => this.chips[b.seatIndex] - this.chips[a.seatIndex])
      .map((seat, idx) => ({
        seatIndex: seat.seatIndex,
        agentId: seat.agentId,
        agentType: seat.agentType,
        placement: idx + 1,
        finalChips: this.chips[seat.seatIndex],
      }));

    return {
      matchId: this.matchId,
      tableId: this.tableId,
      actionLog: this.actionLog,
      standings,
    };
  }

  _applyRoundLoss(loserSeat) {
    const penalty = Math.min(100, this.chips[loserSeat]);
    this.chips[loserSeat] -= penalty;
    this.activeSeats = this.activeSeats.filter((s) => this.chips[s] > 0);
  }

  _advanceTurn() {
    const idx = this.activeSeats.indexOf(this.currentTurnSeat);
    this.currentTurnSeat = this.activeSeats[(idx + 1) % this.activeSeats.length];
  }

  _assertTurn(seatIndex) {
    if (seatIndex !== this.currentTurnSeat) {
      throw new Error(`not_your_turn: expected seat ${this.currentTurnSeat}, got ${seatIndex}`);
    }
  }

  _log(actionType, seatIndex, payload) {
    this.actionLog.push({
      sequence: this.actionLog.length,
      seatIndex,
      actionType,
      payload,
      timestamp: new Date().toISOString(),
    });
  }
}
