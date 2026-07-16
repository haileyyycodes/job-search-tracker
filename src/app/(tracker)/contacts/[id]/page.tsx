"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ContactDetailView } from "@/components/tracker/ContactDetailView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();
  const contact = data.contacts.find((c) => c.id === id) ?? null;

  if (!contact) {
    return (
      <div style={{ padding: 32, font: "var(--text-body-m)", color: "var(--text-secondary)" }}>
        Contact not found.{" "}
        <Link href="/contacts" style={{ color: "var(--text-link)" }}>
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <ContactDetailView
      contact={contact}
      apps={data.apps}
      contacts={data.contacts}
      networkingEvents={data.networkingEvents}
      onBack={() => router.push("/contacts")}
      onEditContact={data.editContact}
      onRequestDelete={ui.requestDeleteContact}
      onSelectApp={(a) => router.push(`/applications/${a.id}`)}
      onSelectContact={(c) => router.push(`/contacts/${c.id}`)}
      onDeleteNetworkingEvent={data.deleteNetworkingEvent}
      onOpenLogNetworkingEvent={ui.openLogNetworkingEvent}
    />
  );
}
