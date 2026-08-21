"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/tracker/Sidebar";
import { AddApplicationDialog } from "@/components/tracker/AddApplicationDialog";
import { ConfirmDeleteApplicationDialog } from "@/components/tracker/ConfirmDeleteApplicationDialog";
import { AddContactDialog } from "@/components/tracker/AddContactDialog";
import { ConfirmDeleteContactDialog } from "@/components/tracker/ConfirmDeleteContactDialog";
import { AddCompanyDialog } from "@/components/tracker/AddCompanyDialog";
import { ConfirmDeleteCompanyDialog } from "@/components/tracker/ConfirmDeleteCompanyDialog";
import { LogNetworkingEventDialog } from "@/components/tracker/LogNetworkingEventDialog";
import { GoalsEditDialog } from "@/components/tracker/GoalsEditDialog";
import { useTrackerData } from "@/lib/useTrackerData";
import { TrackerUIProvider, useTrackerUI } from "@/lib/TrackerUIContext";

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackerUIProvider>
      <Suspense fallback={null}>
        <TrackerShell>{children}</TrackerShell>
      </Suspense>
    </TrackerUIProvider>
  );
}

function TrackerShell({ children }: { children: React.ReactNode }) {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const confirmDeleteApplication = () => {
    if (!ui.deleteTarget) return;
    const appId = ui.deleteTarget.id;
    data.deleteApplication(appId);
    if (pathname === "/applications" && searchParams.get("id") === String(appId)) router.push("/applications");
    ui.closeDeleteApplication();
  };

  const confirmDeleteContact = () => {
    if (!ui.deleteContactTarget) return;
    const contactId = ui.deleteContactTarget.id;
    data.deleteContact(contactId);
    if (pathname === "/contacts" && searchParams.get("id") === String(contactId)) router.push("/contacts");
    ui.closeDeleteContact();
  };

  const confirmDeleteCompany = () => {
    if (!ui.deleteCompanyTarget) return;
    const companyId = ui.deleteCompanyTarget.id;
    data.deleteCompany(companyId);
    if (pathname === "/companies" && searchParams.get("id") === String(companyId)) router.push("/companies");
    ui.closeDeleteCompany();
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar userName={data.userProfile.name} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>{children}</div>
      <AddApplicationDialog
        open={ui.addOpen}
        onClose={ui.closeAddApplication}
        onAdd={data.addApplication}
        contacts={data.contacts}
        onCreateContact={data.createContact}
        companies={data.companies}
        onCreateCompany={data.createCompany}
      />
      {ui.deleteTarget && (
        <ConfirmDeleteApplicationDialog
          app={ui.deleteTarget}
          tasks={data.tasks}
          companies={data.companies}
          onClose={ui.closeDeleteApplication}
          onConfirm={confirmDeleteApplication}
        />
      )}
      <AddContactDialog
        open={ui.addContactOpen}
        onClose={ui.closeAddContact}
        onAdd={data.createContact}
        companies={data.companies}
        onCreateCompany={data.createCompany}
      />
      {ui.deleteContactTarget && (
        <ConfirmDeleteContactDialog
          contact={ui.deleteContactTarget}
          apps={data.apps}
          networkingEvents={data.networkingEvents}
          onClose={ui.closeDeleteContact}
          onConfirm={confirmDeleteContact}
        />
      )}
      <AddCompanyDialog open={ui.addCompanyOpen} onClose={ui.closeAddCompany} onAdd={data.createCompany} />
      {ui.deleteCompanyTarget && (
        <ConfirmDeleteCompanyDialog
          company={ui.deleteCompanyTarget}
          apps={data.apps}
          contacts={data.contacts}
          onClose={ui.closeDeleteCompany}
          onConfirm={confirmDeleteCompany}
        />
      )}
      {ui.goalsDialogOpen && (
        <GoalsEditDialog
          goals={data.goals}
          onClose={ui.closeGoalsDialog}
          onSave={(goals) => {
            data.updateGoals(goals);
            ui.closeGoalsDialog();
          }}
        />
      )}
      {ui.networkingDialogOpen && (
        <LogNetworkingEventDialog
          contacts={data.contacts}
          apps={data.apps}
          companies={data.companies}
          initialContactId={ui.networkingDialogContactId != null ? String(ui.networkingDialogContactId) : undefined}
          onCreateContact={data.createContact}
          onClose={ui.closeLogNetworkingEvent}
          onSave={(event) => {
            data.addNetworkingEvent(event);
            ui.closeLogNetworkingEvent();
          }}
        />
      )}
    </div>
  );
}
