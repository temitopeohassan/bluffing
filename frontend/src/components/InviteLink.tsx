"use client";

import { useState } from "react";

/** Shareable invite link + bare table ID shown while a human waits for others. */
export function InviteLink({ tableId }: { tableId: string }) {
  const [copied, setCopied] = useState<"link" | "id" | null>(null);
  const url = typeof window !== "undefined" ? `${window.location.origin}/join/${tableId}` : `/join/${tableId}`;

  async function copy(what: "link" | "id", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable — the text is still selectable */
    }
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      <p className="bf-mono text-[11px] uppercase tracking-wider text-cream/40">Invite others to this table</p>
      <div className="flex items-center gap-2 max-w-full">
        <code className="bf-mono text-[11px] text-cream/70 bg-ink/40 px-2.5 py-1.5 rounded truncate max-w-[240px]">
          {url}
        </code>
        <button
          type="button"
          onClick={() => copy("link", url)}
          className="bf-mono text-[11px] uppercase tracking-wider text-brass hover:text-brass-bright transition-colors whitespace-nowrap"
        >
          {copied === "link" ? "Copied ✓" : "Copy link"}
        </button>
      </div>
      <div className="flex items-center gap-2 max-w-full">
        <span className="bf-mono text-[11px] text-cream/40">Table ID</span>
        <code className="bf-mono text-[11px] text-cream/70 bg-ink/40 px-2.5 py-1.5 rounded truncate max-w-[200px]">
          {tableId}
        </code>
        <button
          type="button"
          onClick={() => copy("id", tableId)}
          className="bf-mono text-[11px] uppercase tracking-wider text-brass hover:text-brass-bright transition-colors whitespace-nowrap"
        >
          {copied === "id" ? "Copied ✓" : "Copy ID"}
        </button>
      </div>
    </div>
  );
}
