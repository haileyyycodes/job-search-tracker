import type { Company, CompanyStatus } from "./types";

/** Resolves a companyId to its name, degrading to "Unknown company" for dangling/missing references. */
export function companyName(companyId: string | undefined, companies: Company[]): string {
  if (!companyId) return "Unknown company";
  return companies.find((c) => c.id === companyId)?.name ?? "Unknown company";
}

/** "Detroit, MI · Austin, TX", or "" if no locations are set. */
export function formatCompanyLocations(company: Company): string {
  return company.locations
    .map((l) => [l.city, l.state].filter(Boolean).join(", "))
    .filter(Boolean)
    .join(" · ");
}

export const companyStatusLabels: Record<CompanyStatus, string> = {
  researching: "Researching",
  watching: "Watching",
  applied: "Applied",
  not_pursuing: "Not pursuing",
};

export function companyStatusColor(status: CompanyStatus): string {
  if (status === "applied") return "var(--green-600)";
  if (status === "watching") return "var(--blue-600)";
  if (status === "not_pursuing") return "var(--text-tertiary)";
  return "var(--yellow-600)";
}
