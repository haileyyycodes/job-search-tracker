"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { CompaniesListView } from "@/components/tracker/CompaniesListView";
import { CompanyDetailView } from "@/components/tracker/CompanyDetailView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function CompaniesPage() {
  return (
    <Suspense fallback={null}>
      <CompaniesPageContent />
    </Suspense>
  );
}

function CompaniesPageContent() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const company = idParam != null ? (data.companies.find((c) => c.id === Number(idParam)) ?? null) : null;

  if (company) {
    return (
      <CompanyDetailView
        company={company}
        apps={data.apps}
        contacts={data.contacts}
        onBack={() => router.push("/companies")}
        onEditCompany={data.editCompany}
        onRequestDelete={ui.requestDeleteCompany}
        onToggleTarget={data.toggleTarget}
        onSelectApp={(a) => router.push(`/applications?id=${a.id}`)}
        onSelectContact={(c) => router.push(`/contacts?id=${c.id}`)}
      />
    );
  }

  return (
    <>
      <TopBar title="Companies">
        <Button size="sm" onClick={ui.openAddCompany}>
          + Add company
        </Button>
      </TopBar>
      <CompaniesListView
        companies={data.companies}
        apps={data.apps}
        onSelect={(c) => router.push(`/companies?id=${c.id}`)}
        onToggleTarget={data.toggleTarget}
        onRequestDelete={ui.requestDeleteCompany}
      />
    </>
  );
}
