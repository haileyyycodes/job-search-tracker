"use client";

import { useState } from "react";

/**
 * Wraps a dialog's close handler so that closing while `isDirty` is true first asks the
 * user to confirm discarding unsaved changes, instead of silently dropping them. Pass the
 * returned `requestClose` everywhere the raw `onClose` used to go — the Dialog's `onClose`
 * (covers the backdrop and the X button) and the footer's Cancel button — since all three
 * previously called the same handler, wrapping it once covers all three.
 */
export function useConfirmClose(isDirty: boolean, onClose: () => void) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestClose = () => {
    if (isDirty) setConfirmOpen(true);
    else onClose();
  };
  const confirmDiscard = () => {
    setConfirmOpen(false);
    onClose();
  };
  const cancelDiscard = () => setConfirmOpen(false);

  return { requestClose, confirmOpen, confirmDiscard, cancelDiscard };
}
