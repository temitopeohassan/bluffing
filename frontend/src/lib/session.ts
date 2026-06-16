"use client";

/**
 * src/lib/session.ts
 * Persists the current browser's registered agent identity (id + api key)
 * in localStorage so a human player doesn't have to re-register on every visit.
 * This is a real Next.js app (not a sandboxed artifact), so localStorage is safe here.
 */

const STORAGE_KEY = "bluffline:agent_session";

export interface AgentSession {
  agentId: string;
  apiKey: string;
  agentName: string;
  elo: number;
}

export function loadSession(): AgentSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: AgentSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
