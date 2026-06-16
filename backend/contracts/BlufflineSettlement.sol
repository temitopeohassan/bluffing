// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * BlufflineSettlement
 *
 * Minimal on-chain settlement contract for Bluffline matches.
 * This is the single source of truth for match results and the ELO
 * leaderboard — the frontend leaderboard is a read view over this state,
 * so results can't be quietly edited off-chain.
 *
 * Deploy to 0G Chain testnet. Only the designated `settler` address
 * (the backend's signing key) may record results, preventing arbitrary
 * leaderboard manipulation by end users.
 */
contract BlufflineSettlement {
    address public owner;
    address public settler;

    struct MatchResult {
        string matchId;
        string storageContentHash; // 0G Storage content hash of the full action log
        address[] participants;
        int32[] eloDeltas;
        uint8[] placements;
        uint256 timestamp;
        bool recorded;
    }

    mapping(string => MatchResult) public matchResults; // matchId => result
    mapping(address => int32) public elo; // participant => current ELO
    mapping(address => uint32) public matchesPlayed;

    event MatchSettled(
        string matchId,
        string storageContentHash,
        address[] participants,
        int32[] eloDeltas,
        uint256 timestamp
    );

    event SettlerUpdated(address indexed newSettler);

    modifier onlyOwner() {
        require(msg.sender == owner, "not_owner");
        _;
    }

    modifier onlySettler() {
        require(msg.sender == settler, "not_settler");
        _;
    }

    constructor(address _settler) {
        owner = msg.sender;
        settler = _settler;
    }

    function setSettler(address _settler) external onlyOwner {
        settler = _settler;
        emit SettlerUpdated(_settler);
    }

    /**
     * Record a completed match's result. Called by the backend after a match
     * finalizes and its full log has been uploaded to 0G Storage.
     *
     * eloDeltas correspond 1:1 with participants by index. New participants
     * (first match) start from a base ELO of 1200.
     */
    function recordMatch(
        string calldata matchId,
        string calldata storageContentHash,
        address[] calldata participants,
        int32[] calldata eloDeltas,
        uint8[] calldata placements
    ) external onlySettler {
        require(!matchResults[matchId].recorded, "match_already_recorded");
        require(
            participants.length == eloDeltas.length && participants.length == placements.length,
            "array_length_mismatch"
        );

        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            if (matchesPlayed[participant] == 0 && elo[participant] == 0) {
                elo[participant] = 1200; // base starting ELO
            }
            elo[participant] += eloDeltas[i];
            matchesPlayed[participant] += 1;
        }

        matchResults[matchId] = MatchResult({
            matchId: matchId,
            storageContentHash: storageContentHash,
            participants: participants,
            eloDeltas: eloDeltas,
            placements: placements,
            timestamp: block.timestamp,
            recorded: true
        });

        emit MatchSettled(matchId, storageContentHash, participants, eloDeltas, block.timestamp);
    }

    function getMatchResult(string calldata matchId) external view returns (MatchResult memory) {
        require(matchResults[matchId].recorded, "match_not_found");
        return matchResults[matchId];
    }

    function getElo(address participant) external view returns (int32) {
        return elo[participant] == 0 && matchesPlayed[participant] == 0 ? int32(1200) : elo[participant];
    }
}
