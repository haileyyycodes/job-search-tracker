"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Application, Company, Contact, NetworkingEvent } from "@/lib/types";

interface TrackerUIContextValue {
  addOpen: boolean;
  openAddApplication: () => void;
  closeAddApplication: () => void;

  addContactOpen: boolean;
  openAddContact: () => void;
  closeAddContact: () => void;

  addCompanyOpen: boolean;
  openAddCompany: () => void;
  closeAddCompany: () => void;

  deleteTarget: Application | null;
  requestDeleteApplication: (app: Application) => void;
  closeDeleteApplication: () => void;

  deleteContactTarget: Contact | null;
  requestDeleteContact: (contact: Contact) => void;
  closeDeleteContact: () => void;

  deleteCompanyTarget: Company | null;
  requestDeleteCompany: (company: Company) => void;
  closeDeleteCompany: () => void;

  goalsDialogOpen: boolean;
  openGoalsDialog: () => void;
  closeGoalsDialog: () => void;

  networkingDialogOpen: boolean;
  networkingDialogContactId: number | null;
  networkingDialogApplicationId: number | null;
  networkingDialogEvent: NetworkingEvent | null;
  openLogNetworkingEvent: (initialContactId?: number, initialApplicationId?: number) => void;
  openEditNetworkingEvent: (event: NetworkingEvent) => void;
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
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<Company | null>(null);
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [networkingDialogContactId, setNetworkingDialogContactId] = useState<number | null>(null);
  const [networkingDialogApplicationId, setNetworkingDialogApplicationId] = useState<number | null>(null);
  const [networkingDialogEvent, setNetworkingDialogEvent] = useState<NetworkingEvent | null>(null);
  const [networkingDialogOpen, setNetworkingDialogOpen] = useState(false);

  const value: TrackerUIContextValue = {
    addOpen,
    openAddApplication: () => setAddOpen(true),
    closeAddApplication: () => setAddOpen(false),

    addContactOpen,
    openAddContact: () => setAddContactOpen(true),
    closeAddContact: () => setAddContactOpen(false),

    addCompanyOpen,
    openAddCompany: () => setAddCompanyOpen(true),
    closeAddCompany: () => setAddCompanyOpen(false),

    deleteTarget,
    requestDeleteApplication: setDeleteTarget,
    closeDeleteApplication: () => setDeleteTarget(null),

    deleteContactTarget,
    requestDeleteContact: setDeleteContactTarget,
    closeDeleteContact: () => setDeleteContactTarget(null),

    deleteCompanyTarget,
    requestDeleteCompany: setDeleteCompanyTarget,
    closeDeleteCompany: () => setDeleteCompanyTarget(null),

    goalsDialogOpen,
    openGoalsDialog: () => setGoalsDialogOpen(true),
    closeGoalsDialog: () => setGoalsDialogOpen(false),

    networkingDialogOpen,
    networkingDialogContactId,
    networkingDialogApplicationId,
    networkingDialogEvent,
    openLogNetworkingEvent: (initialContactId, initialApplicationId) => {
      setNetworkingDialogEvent(null);
      setNetworkingDialogContactId(initialContactId ?? null);
      setNetworkingDialogApplicationId(initialApplicationId ?? null);
      setNetworkingDialogOpen(true);
    },
    openEditNetworkingEvent: (event) => {
      setNetworkingDialogContactId(null);
      setNetworkingDialogApplicationId(null);
      setNetworkingDialogEvent(event);
      setNetworkingDialogOpen(true);
    },
    closeLogNetworkingEvent: () => {
      setNetworkingDialogOpen(false);
      setNetworkingDialogEvent(null);
      setNetworkingDialogApplicationId(null);
    },
  };

  return <TrackerUIContext.Provider value={value}>{children}</TrackerUIContext.Provider>;
}

export function useTrackerUI(): TrackerUIContextValue {
  const ctx = useContext(TrackerUIContext);
  if (!ctx) throw new Error("useTrackerUI must be used within a TrackerUIProvider");
  return ctx;
}
