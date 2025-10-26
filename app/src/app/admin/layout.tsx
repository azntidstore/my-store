
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/layout/admin-sidebar';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { getIdTokenResult } from 'firebase/auth';

// Define the super admin email
const SUPER_ADMIN_EMAIL = "ouaddou.abdellah.topo@gmail.com";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdminClaim, setIsAdminClaim] = useState(false);
  const [isClaimsLoading, setIsClaimsLoading] = useState(true);

  // This effect ensures the super admin user document is correctly provisioned.
  // This is a failsafe and the primary authorization comes from custom claims.
  useEffect(() => {
    const ensureSuperAdminDoc = async () => {
      if (firestore && user && user.email === SUPER_ADMIN_EMAIL) {
          const userRef = doc(firestore, 'users', user.uid);
          try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Super Admin',
                    roles: ['admin'], // Ensure roles array with admin
                    createdAt: serverTimestamp(),
                }, { merge: true });
                console.log("Super Admin document created in Firestore.");
            }
          } catch (e) {
            // This might fail due to rules initially, but the claim check is the primary method.
            console.error("Could not ensure super admin document, likely due to rules. Relying on claims.", e);
          }
      }
    };
    ensureSuperAdminDoc();
  }, [firestore, user]);

  // Effect to check for custom admin claim
  useEffect(() => {
      if(user) {
          setIsClaimsLoading(true);
          getIdTokenResult(user, true) // Force refresh of the token
              .then(idTokenResult => {
                  const isAdmin = !!idTokenResult.claims.admin;
                  setIsAdminClaim(isAdmin);
                  setIsClaimsLoading(false);
              })
              .catch(() => {
                  setIsAdminClaim(false);
                  setIsClaimsLoading(false);
              });
      } else if (!isUserLoading) { // if there's no user and we are not loading, claims check is done.
          setIsAdminClaim(false);
          setIsClaimsLoading(false);
      }
  }, [user, isUserLoading]);


  useEffect(() => {
    const isLoading = isUserLoading || isClaimsLoading;
    if (isLoading) {
      setIsAuthorized(null); // Still loading, so we don't know yet.
      return;
    }

    if (!user) {
      // If user is not logged in, redirect to login page, unless they are already there.
      if (pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
      setIsAuthorized(pathname === '/admin/login');
      return;
    }

    // User is logged in, now check roles from custom claim
    const canAccessAdmin = isAdminClaim;

    if (!canAccessAdmin) {
      console.warn("Unauthorized access attempt by:", user.email);
      router.replace('/'); // Redirect non-admins to homepage
      setIsAuthorized(false);
      return;
    }
    
    // If we are on the login page but already an authorized admin, redirect to dashboard.
    if (pathname === '/admin/login') {
        router.replace('/admin');
    }
    
    // If we've reached here, the user is authorized.
    setIsAuthorized(true);
    
  }, [user, isAdminClaim, isUserLoading, isClaimsLoading, pathname, router]);


  const noLayoutPages = ['/admin/login'];
  const needsNoLayout = noLayoutPages.some(p => pathname.startsWith(p));
  
  if (needsNoLayout) {
    // If we're on a no-layout page but auth is still being checked, show loader.
    // Otherwise, if authorized, show children. If not, will be redirected.
    return isAuthorized === null ? (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    ) : <>{children}</>;
  }


  // For all other admin pages, show a global loader while checking auth and roles
  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If authorized and not a no-layout page, show the admin layout
  if (isAuthorized) {
    return (
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    );
  }

  // Fallback for any other case (e.g., during redirection)
  return null;
}
