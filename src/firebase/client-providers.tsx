
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

export function ClientProviders({ children }: { children: React.ReactNode }) {
    // useMemo will run initializeFirebase only once on the client after hydration.
    const firebaseServices = useMemo(() => {
        if (typeof window !== "undefined") {
            return initializeFirebase();
        }
        return null;
    }, []);

    // Render a loading state or nothing while waiting for client-side Firebase init
    if (!firebaseServices) {
        // You can return a global loader here if you want
        return null; 
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
            </CartProvider>
        </FirebaseProvider>
    );
}
