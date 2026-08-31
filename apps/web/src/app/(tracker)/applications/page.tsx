"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { ApplicationsListView } from "@/components/tracker/ApplicationsListView";
import { ApplicationDetailView } from "@/components/tracker/ApplicationDetailView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsPageContent />
    </Suspense>
  );
}

function ApplicationsPageContent() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const app = idParam != null ? (data.apps.find((a) => a.id === Number(idParam)) ?? null) : null;

  if (app) {
    return (
      <ApplicationDetailView
        app={app}
        contacts={data.contacts}
        companies={data.companies}
        networkingEvents={data.networkingEvents}
        goals={data.goals}
        interviewCategories={data.interviewCategories}
        onCreateInterviewCategory={data.addInterviewCategory}
        onCreateContact={data.createContact}
        onCreateCompany={data.createCompany}
        onSelectContact={(c) => router.push(`/contacts?id=${c.id}`)}
        onSelectCompany={(c) => router.push(`/companies?id=${c.id}`)}
        onBack={() => router.push("/applications")}
        onChangeStatus={data.changeApplicationStatus}
        onLogInterview={data.logInterview}
        onEditInterview={data.editInterview}
        onLogFollowUp={data.logFollowUp}
        onEditApplication={data.editApplication}
        onRequestDelete={ui.requestDeleteApplication}
        onDeleteInterview={data.deleteInterview}
        onDeleteFollowUp={data.deleteFollowUp}
        onSaveFeedback={data.saveFeedback}
        onLogNetworkingEvent={() => ui.openLogNetworkingEvent(undefined, app.id)}
        onEditNetworkingEvent={ui.openEditNetworkingEvent}
        onDeleteNetworkingEvent={data.deleteNetworkingEvent}
      />
    );
  }

  return (
    <>
      <TopBar title="Applications">
        <Button size="sm" onClick={ui.openAddApplication}>
          + Log application
        </Button>
      </TopBar>
      <ApplicationsListView
        apps={data.apps}
        companies={data.companies}
        goals={data.goals}
        onSelect={(a) => router.push(`/applications?id=${a.id}`)}
        onSelectCompany={(c) => router.push(`/companies?id=${c.id}`)}
        onRequestDelete={ui.requestDeleteApplication}
      />
    </>
  );
}
