"use client";

import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/tracker/Sidebar";
import { AddApplicationDialog } from "@/components/tracker/AddApplicationDialog";
import { ConfirmDeleteApplicationDialog } from "@/components/tracker/ConfirmDeleteApplicationDialog";
import { ConfirmResetDemoDataDialog } from "@/components/tracker/ConfirmResetDemoDataDialog";
import { AddContactDialog } from "@/components/tracker/AddContactDialog";
import { ConfirmDeleteContactDialog } from "@/components/tracker/ConfirmDeleteContactDialog";
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

  const resetDemoData = () => {
    data.resetDemoData();
    router.push("/");
    ui.closeResetConfirm();
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar onRequestReset={ui.requestReset} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>{children}</div>
      <AddApplicationDialog
        open={ui.addOpen}
        onClose={ui.closeAddApplication}
        onAdd={data.addApplication}
        contacts={data.contacts}
        onCreateContact={data.createContact}
      />
      {ui.deleteTarget && (
        <ConfirmDeleteApplicationDialog
          app={ui.deleteTarget}
          tasks={data.tasks}
          onClose={ui.closeDeleteApplication}
          onConfirm={confirmDeleteApplication}
        />
      )}
      {ui.resetConfirmOpen && (
        <ConfirmResetDemoDataDialog onClose={ui.closeResetConfirm} onConfirm={resetDemoData} />
      )}
      <AddContactDialog open={ui.addContactOpen} onClose={ui.closeAddContact} onAdd={data.createContact} />
      {ui.deleteContactTarget && (
        <ConfirmDeleteContactDialog
          contact={ui.deleteContactTarget}
          apps={data.apps}
          networkingEvents={data.networkingEvents}
          onClose={ui.closeDeleteContact}
          onConfirm={confirmDeleteContact}
        />
      )}
      {ui.networkingDialogOpen && (
        <LogNetworkingEventDialog
          contacts={data.contacts}
          apps={data.apps}
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
