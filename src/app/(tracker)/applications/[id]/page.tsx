"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ApplicationDetailView } from "@/components/tracker/ApplicationDetailView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const app = data.apps.find((a) => a.id === id) ?? null;

  if (!app) {
    return (
      <div style={{ padding: 32, font: "var(--text-body-m)", color: "var(--text-secondary)" }}>
        Application not found.{" "}
        <Link href="/applications" style={{ color: "var(--text-link)" }}>
          Back to applications
        </Link>
      </div>
    );
  }

  return (
    <ApplicationDetailView
      app={app}
      tasks={data.tasks}
      contacts={data.contacts}
      companies={data.companies}
      goals={data.goals}
      interviewCategories={data.interviewCategories}
      onCreateInterviewCategory={data.addInterviewCategory}
      onCreateContact={data.createContact}
      onCreateCompany={data.createCompany}
      onSelectContact={(c) => router.push(`/contacts/${c.id}`)}
      onSelectCompany={(c) => router.push(`/companies/${c.id}`)}
      onBack={() => router.push("/applications")}
      onDismissTask={data.dismissTask}
      onChangeStatus={data.changeApplicationStatus}
      onLogInterview={data.logInterview}
      onEditInterview={data.editInterview}
      onLogFollowUp={data.logFollowUp}
      onAddTask={data.addTask}
      onEditApplication={data.editApplication}
      onRequestDelete={ui.requestDeleteApplication}
      onDeleteInterview={data.deleteInterview}
      onDeleteFollowUp={data.deleteFollowUp}
      onSaveFeedback={data.saveFeedback}
    />
  );
}
