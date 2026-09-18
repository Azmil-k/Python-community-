"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LeaderboardTabs({ filter = "overall", timeframe = "all-time", hasPod = false }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateParams(newFilter, newTimeframe) {
    const f = newFilter !== undefined ? newFilter : filter;
    const t = newTimeframe !== undefined ? newTimeframe : timeframe;
    if (f === filter && t === timeframe) return;

    startTransition(() => {
      router.push(`/leaderboard?filter=${f}&timeframe=${t}`);
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Scope Filter (Overall / My Pod) */}
      {hasPod && (
        <div className="flex items-center gap-1" style={{ background: "rgba(0,0,0,0.2)", padding: "0.2rem", borderRadius: "var(--radius-sm)" }}>
          <button
            type="button"
            onClick={() => updateParams("overall", undefined)}
            disabled={isPending}
            className={filter === "overall" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", opacity: isPending ? 0.7 : 1 }}
          >
            Overall
          </button>
          <button
            type="button"
            onClick={() => updateParams("pod", undefined)}
            disabled={isPending}
            className={filter === "pod" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", opacity: isPending ? 0.7 : 1 }}
          >
            My Pod
          </button>
        </div>
      )}

      {/* Timeframe Filter (All Time / This Week) */}
      <div className="flex items-center gap-1" style={{ background: "rgba(0,0,0,0.2)", padding: "0.2rem", borderRadius: "var(--radius-sm)" }}>
        <button
          type="button"
          onClick={() => updateParams(undefined, "all-time")}
          disabled={isPending}
          className={timeframe === "all-time" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", opacity: isPending ? 0.7 : 1 }}
        >
          All Time
        </button>
        <button
          type="button"
          onClick={() => updateParams(undefined, "this-week")}
          disabled={isPending}
          className={timeframe === "this-week" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", opacity: isPending ? 0.7 : 1 }}
        >
          This Week
        </button>
      </div>
    </div>
  );
}
