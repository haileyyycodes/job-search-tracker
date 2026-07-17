"use client";

import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/tracker/Sidebar";
import { AddApplicationDialog } from "@/components/tracker/AddApplicationDialog";
import { ConfirmDeleteApplicationDialog } from "@/components/tracker/ConfirmDeleteApplicationDialog";
import { ConfirmResetDemoDataDialog } from "@/components/tracker/ConfirmResetDemoDataDialog";
import { ConfirmClearAllDataDialog } from "@/components/tracker/ConfirmClearAllDataDialog";
import { AddContactDialog } from "@/components/tracker/AddContactDialog";
import { ConfirmDeleteContactDialog } from "@/components/tracker/ConfirmDeleteContactDialog";
import { AddCompanyDialog } from "@/components/tracker/AddCompanyDialog";
import { ConfirmDeleteCompanyDialog } from "@/components/tracker/ConfirmDeleteCompanyDialog";
import { LogNetworkingEventDialog } from "@/components/tracker/LogNetworkingEventDialog";
import { useTrackerData } from "@/lib/useTrackerData";
import { TrackerUIProvider, useTrackerUI } from "@/lib/TrackerUIContext";

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackerUIProvider>
      <TrackerShell>{children}</TrackerShell>
    </TrackerUIProvider>
  );
}

function TrackerShell({ children }: { children: React.ReactNode }) {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const pathname = usePathname();

  const confirmDeleteApplication = () => {
    if (!ui.deleteTarget) return;
    const appId = ui.deleteTarget.id;
    data.deleteApplication(appId);
    if (pathname === `/applications/${appId}`) router.push("/applications");
    ui.closeDeleteApplication();
  };

  const confirmDeleteContact = () => {
    if (!ui.deleteContactTarget) return;
    const contactId = ui.deleteContactTarget.id;
    data.deleteContact(contactId);
    if (pathname === `/contacts/${contactId}`) router.push("/contacts");
    ui.closeDeleteContact();
  };

  const confirmDeleteCompany = () => {
    if (!ui.deleteCompanyTarget) return;
    const companyId = ui.deleteCompanyTarget.id;
    data.deleteCompany(companyId);
    if (pathname === `/companies/${companyId}`) router.push("/companies");
    ui.closeDeleteCompany();
  };

  const resetDemoData = () => {
    data.resetDemoData();
    router.push("/");
    ui.closeResetConfirm();
  };

  const clearAllData = () => {
    data.clearAllData();
    router.push("/");
    ui.closeClearAllConfirm();
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar onRequestReset={ui.requestReset} onRequestClearAll={ui.requestClearAll} />
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
      {ui.resetConfirmOpen && (
        <ConfirmResetDemoDataDialog onClose={ui.closeResetConfirm} onConfirm={resetDemoData} />
      )}
      {ui.clearAllConfirmOpen && (
        <ConfirmClearAllDataDialog onClose={ui.closeClearAllConfirm} onConfirm={clearAllData} />
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
      {ui.networkingDialogOpen && (
        <LogNetworkingEventDialog
          contacts={data.contacts}
          apps={data.apps}
          companies={data.companies}
          initialContactId={ui.networkingDialogContactId ?? undefined}
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
