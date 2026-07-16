"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Application, Contact } from "@/lib/types";

interface TrackerUIContextValue {
  addOpen: boolean;
  openAddApplication: () => void;
  closeAddApplication: () => void;

  addContactOpen: boolean;
  openAddContact: () => void;
  closeAddContact: () => void;

  deleteTarget: Application | null;
  requestDeleteApplication: (app: Application) => void;
  closeDeleteApplication: () => void;

  deleteContactTarget: Contact | null;
  requestDeleteContact: (contact: Contact) => void;
  closeDeleteContact: () => void;

  resetConfirmOpen: boolean;
  requestReset: () => void;
  closeResetConfirm: () => void;

  networkingDialogOpen: boolean;
  networkingDialogContactId: string | null;
  openLogNetworkingEvent: (initialContactId?: string) => void;
  closeLogNetworkingEvent: () => void;
}

const TrackerUIContext = createContext<TrackerUIContextValue | null>(null);

/**
 * Owns visibility/target state for every dialog that can be triggered from more than one
 * page (e.g. delete-application from both the list and the detail view). Deliberately does
 * NOT own the "what happens after confirm" navigation logic — that differs depending on
 * where the trigger came from, so it stays with whoever renders the dialog.
 */
export function TrackerUIProvider({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [networkingDialogContactId, setNetworkingDialogContactId] = useState<string | null>(null);
  const [networkingDialogOpen, setNetworkingDialogOpen] = useState(false);

  const value: TrackerUIContextValue = {
    addOpen,
    openAddApplication: () => setAddOpen(true),
    closeAddApplication: () => setAddOpen(false),

    addContactOpen,
    openAddContact: () => setAddContactOpen(true),
    closeAddContact: () => setAddContactOpen(false),

    deleteTarget,
    requestDeleteApplication: setDeleteTarget,
    closeDeleteApplication: () => setDeleteTarget(null),

    deleteContactTarget,
    requestDeleteContact: setDeleteContactTarget,
    closeDeleteContact: () => setDeleteContactTarget(null),

    resetConfirmOpen,
    requestReset: () => setResetConfirmOpen(true),
    closeResetConfirm: () => setResetConfirmOpen(false),

    networkingDialogOpen,
    networkingDialogContactId,
    openLogNetworkingEvent: (initialContactId) => {
      setNetworkingDialogContactId(initialContactId ?? null);
      setNetworkingDialogOpen(true);
    },
    closeLogNetworkingEvent: () => setNetworkingDialogOpen(false),
  };

  return <TrackerUIContext.Provider value={value}>{children}</TrackerUIContext.Provider>;
}

export function useTrackerUI(): TrackerUIContextValue {
  const ctx = useContext(TrackerUIContext);
  if (!ctx) throw new Error("useTrackerUI must be used within a TrackerUIProvider");
  return ctx;
}
