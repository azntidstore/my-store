// src/firebase/firestore/use-memo-firebase.tsx
'use client'
import { useMemo } from 'react';
import { CollectionReference, DocumentReference, Query, DocumentData } from 'firebase/firestore';

/**
 * Custom hook to memoize Firebase queries or references.
 * This is crucial to prevent re-creating references on every render,
 * which can lead to infinite loops in hooks like useCollection or useDoc.
 *
 * @template T - The type of the Firebase reference or query.
 * @param {() => T | null | undefined} factory - A function that returns the Firebase reference or query.
 * @param {any[]} deps - The dependency array for the memoization, similar to useMemo.
 * @returns {T | null | undefined} The memoized Firebase reference or query.
 */
export function useMemoFirebase<T extends DocumentReference<DocumentData> | CollectionReference<DocumentData> | Query<DocumentData> | null | undefined>(
  factory: () => T,
  deps: any[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRef = useMemo(factory, deps);
  if(memoizedRef) {
    (memoizedRef as any).__memo = true;
  }
  return memoizedRef;
}
