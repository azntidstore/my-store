'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): FirebaseServices {
  // This function should only be called on the client-side.
  if (typeof window === "undefined") {
    throw new Error("Firebase cannot be initialized on the server.");
  }

  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    return getSdks(app);
  }

  return getSdks(getApp());
}

function getSdks(firebaseApp: FirebaseApp): FirebaseServices {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './errors';
export * from './error-emitter';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
