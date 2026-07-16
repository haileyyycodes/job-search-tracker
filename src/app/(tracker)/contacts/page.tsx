"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { ContactsListView } from "@/components/tracker/ContactsListView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function ContactsPage() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();

  return (
    <>
      <TopBar title="Contacts">
        <Button size="sm" onClick={ui.openAddContact}>
          + Add contact
        </Button>
      </TopBar>
      <ContactsListView
        contacts={data.contacts}
        onSelect={(c) => router.push(`/contacts/${c.id}`)}
        onRequestDelete={ui.requestDeleteContact}
      />
    </>
  );
}
