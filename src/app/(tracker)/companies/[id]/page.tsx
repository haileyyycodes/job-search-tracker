"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CompanyDetailView } from "@/components/tracker/CompanyDetailView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const company = data.companies.find((c) => c.id === id) ?? null;

  if (!company) {
    return (
      <div style={{ padding: 32, font: "var(--text-body-m)", color: "var(--text-secondary)" }}>
        Company not found.{" "}
        <Link href="/companies" style={{ color: "var(--text-link)" }}>
          Back to companies
        </Link>
      </div>
    );
  }

  return (
    <CompanyDetailView
      company={company}
      apps={data.apps}
      contacts={data.contacts}
      onBack={() => router.push("/companies")}
      onEditCompany={data.editCompany}
      onRequestDelete={ui.requestDeleteCompany}
      onPromoteToTarget={data.promoteToTarget}
      onSelectApp={(a) => router.push(`/applications/${a.id}`)}
      onSelectContact={(c) => router.push(`/contacts/${c.id}`)}
    />
  );
}
