"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { CompaniesListView } from "@/components/tracker/CompaniesListView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function CompaniesPage() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();

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
        onSelect={(c) => router.push(`/companies/${c.id}`)}
        onToggleTarget={data.toggleTarget}
        onRequestDelete={ui.requestDeleteCompany}
      />
    </>
  );
}
