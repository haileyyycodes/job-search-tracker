"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

const listenersByKey = new Map<string, Set<Listener>>();

function getListeners(key: string): Set<Listener> {
  let set = listenersByKey.get(key);
  if (!set) {
    set = new Set();
    listenersByKey.set(key, set);
  }
  return set;
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    console.error(`Failed to read localStorage key "${key}"`, err);
    return null;
  }
}

function writeRaw(key: string, raw: string) {
  try {
    window.localStorage.setItem(key, raw);
  } catch (err) {
    console.error(`Failed to write localStorage key "${key}"`, err);
  }
  getListeners(key).forEach((listener) => listener());
}

/**
 * State backed by localStorage, shared across every call site for the same key.
 * Uses useSyncExternalStore (not an effect) so server/first-paint snapshots never
 * mismatch the client's persisted value, and same-tab updates notify subscribers
 * immediately (native `storage` events only fire in *other* tabs).
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      const listeners = getListeners(key);
      listeners.add(onStoreChange);
      const handleStorage = (e: StorageEvent) => {
        if (e.key === key) onStoreChange();
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        listeners.delete(onStoreChange);
        window.removeEventListener("storage", handleStorage);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => readRaw(key), [key]);
  const getServerSnapshot = useCallback(() => null, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let value: T = initialValue;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Failed to parse localStorage key "${key}"`, err);
    }
  }

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prevRaw = readRaw(key);
      let prev: T = initialValue;
      if (prevRaw !== null) {
        try {
          prev = JSON.parse(prevRaw) as T;
        } catch (err) {
          console.error(`Failed to parse localStorage key "${key}"`, err);
        }
      }
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      writeRaw(key, JSON.stringify(next));
    },
    [key, initialValue]
  );

  return [value, setValue] as const;
}
