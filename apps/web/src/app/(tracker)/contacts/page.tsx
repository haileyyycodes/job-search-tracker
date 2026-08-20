"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { ContactsListView } from "@/components/tracker/ContactsListView";
import { ContactDetailView } from "@/components/tracker/ContactDetailView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function ContactsPage() {
  return (
    <Suspense fallback={null}>
      <ContactsPageContent />
    </Suspense>
  );
}

function ContactsPageContent() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const contact = idParam != null ? (data.contacts.find((c) => c.id === Number(idParam)) ?? null) : null;

  if (contact) {
    return (
      <ContactDetailView
        contact={contact}
        apps={data.apps}
        contacts={data.contacts}
        companies={data.companies}
        networkingEvents={data.networkingEvents}
        onBack={() => router.push("/contacts")}
        onEditContact={data.editContact}
        onCreateCompany={data.createCompany}
        onRequestDelete={ui.requestDeleteContact}
        onSelectApp={(a) => router.push(`/applications?id=${a.id}`)}
        onSelectContact={(c) => router.push(`/contacts?id=${c.id}`)}
        onSelectCompany={(c) => router.push(`/companies?id=${c.id}`)}
        onDeleteNetworkingEvent={data.deleteNetworkingEvent}
        onOpenLogNetworkingEvent={ui.openLogNetworkingEvent}
      />
    );
  }

  return (
    <>
      <TopBar title="Contacts">
        <Button size="sm" onClick={ui.openAddContact}>
          + Add contact
        </Button>
      </TopBar>
      <ContactsListView
        contacts={data.contacts}
        companies={data.companies}
        onSelect={(c) => router.push(`/contacts?id=${c.id}`)}
        onSelectCompany={(c) => router.push(`/companies?id=${c.id}`)}
        onRequestDelete={ui.requestDeleteContact}
      />
    </>
  );
}
