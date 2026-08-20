import type { WorkArrangement } from "./types";

interface LocationFields {
  workArrangement?: WorkArrangement;
  city?: string;
  state?: string;
}

/** "Detroit, MI", "Remote", "Detroit, MI (Hybrid)", "Hybrid" (no city/state given), or "" if unset. */
export function formatLocation({ workArrangement, city, state }: LocationFields): string {
  if (!workArrangement) return "";
  const cityState = [city, state].filter(Boolean).join(", ");
  if (workArrangement === "remote") return "Remote";
  if (workArrangement === "hybrid") return cityState ? `${cityState} (Hybrid)` : "Hybrid";
  return cityState;
}
