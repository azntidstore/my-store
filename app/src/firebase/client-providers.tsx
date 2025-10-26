
'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { CartProvider } from '@/context/cart-context';
import BottomNav from '@/components/layout/bottom-nav';
import SideCart from '@/components/layout/side-cart';
import { Toaster } from '@/components/ui/toaster';
import ThemeLoader from '@/app/theme-loader';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Loader2 } from 'lucide-react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    // useMemo will run initializeFirebase only once on the client after hydration.
    const firebaseServices = useMemo(() => {
        if (typeof window !== "undefined") {
            try {
                return initializeFirebase();
            } catch (e) {
                console.error("Firebase initialization failed:", e);
                return null;
            }
        }
        return null;
    }, []);

    // Render a loading state or nothing while waiting for client-side Firebase init
    if (!firebaseServices) {
        // Render a full-page loader to prevent layout shifts
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <FirebaseProvider
            firebaseApp={firebaseServices.firebaseApp}
            auth={firebaseServices.auth}
            firestore={firebaseServices.firestore}
        >
            <ThemeLoader />
            <FirebaseErrorListener />
            <CartProvider>
                <SideCart />
                {children}
                <BottomNav />
                <Toaster />
            </CartProvider>
        </FirebaseProvider>
    );
}
