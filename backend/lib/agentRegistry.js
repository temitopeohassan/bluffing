/**
 * lib/agentRegistry.js
 *
 * Agent identity storage. Uses Upstash Redis in production (Vercel's
 * native Redis Marketplace integration — Vercel KV itself was deprecated
 * and migrated to Upstash); falls back to an in-memory Map for local
 * development so the API is runnable without any Redis credentials configured.
 *
 * Setup: Vercel Dashboard → Storage → connect an Upstash Redis integration.
 * This sets KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN depending on integration version) in your
 * project's environment variables automatically.
 */

import { nanoid } from "nanoid";
import { randomBytes, createHash } from "crypto";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_REDIS = !!(REDIS_URL && REDIS_TOKEN);

const redis = HAS_REDIS ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const memoryAgents = new Map(); // agentId -> agent record
const memoryApiKeys = new Map(); // hashedKey -> agentId

function hashApiKey(rawKey) {
  return createHash("sha256").update(rawKey).digest("hex");
}

function generateApiKey() {
  return `bf_${randomBytes(24).toString("hex")}`;
}

export async function registerAgent({ agentName, agentType, walletAddress }) {
  const agentId = nanoid();
  const rawKey = generateApiKey();
  const hashedKey = hashApiKey(rawKey);

  const record = {
    agentId,
    agentName,
    agentType,
    walletAddress: walletAddress || null,
    elo: 1200,
    matchesPlayed: 0,
    createdAt: new Date().toISOString(),
  };

  if (HAS_REDIS) {
    await redis.set(`agent:${agentId}`, record);
    await redis.set(`apikey:${hashedKey}`, agentId);
  } else {
    memoryAgents.set(agentId, record);
    memoryApiKeys.set(hashedKey, agentId);
  }

  return { agentId, apiKey: rawKey, startingElo: record.elo };
}

export async function getAgentByApiKey(rawKey) {
  if (!rawKey) return null;
  const hashedKey = hashApiKey(rawKey);

  const agentId = HAS_REDIS ? await redis.get(`apikey:${hashedKey}`) : memoryApiKeys.get(hashedKey);
  if (!agentId) return null;

  return HAS_REDIS ? await redis.get(`agent:${agentId}`) : memoryAgents.get(agentId);
}

export async function getAgentById(agentId) {
  return HAS_REDIS ? await redis.get(`agent:${agentId}`) : memoryAgents.get(agentId);
}

export async function updateAgentStats(agentId, { eloDelta, won }) {
  const agent = await getAgentById(agentId);
  if (!agent) return null;

  agent.elo += eloDelta;
  agent.matchesPlayed += 1;

  if (HAS_REDIS) {
    await redis.set(`agent:${agentId}`, agent);
  } else {
    memoryAgents.set(agentId, agent);
  }
  return agent;
}

export async function listLeaderboard({ limit = 50, agentTypeFilter = "all" } = {}) {
  let agents;
  if (HAS_REDIS) {
    // In production, consider maintaining a sorted set (ZADD elo) for efficient ranking
    // rather than scanning all agent keys. Scaffolded simply here for v1.
    const keys = await redis.keys("agent:*");
    agents = keys.length ? await redis.mget(...keys) : [];
  } else {
    agents = [...memoryAgents.values()];
  }

  const filtered =
    agentTypeFilter === "all" ? agents : agents.filter((a) => a.agentType === agentTypeFilter);

  return filtered
    .sort((a, b) => b.elo - a.elo)
    .slice(0, limit)
    .map((a, i) => ({
      rank: i + 1,
      agentId: a.agentId,
      agentName: a.agentName,
      agentType: a.agentType,
      elo: a.elo,
      matchesPlayed: a.matchesPlayed,
    }));
}
