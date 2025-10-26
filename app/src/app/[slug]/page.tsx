
'use client';
import { useMemo, useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { Page, SiteSettings, MenuItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, doc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { useParams } from 'next/navigation';

export function generateStaticParams() {
  // We return an empty array because we want all slugs to be generated on-demand on the client.
  // This satisfies the `output: 'export'` build requirement without pre-building any pages.
  return [];
}

function StaticPageContent({ page }: { page: Page }) {
    if (page.type === 'landing_page') {
      // This is potentially unsafe if content is not controlled
      return <div dangerouslySetInnerHTML={{ __html: page.content }} />;
    }

    return (
        <div className="container py-12">
            <div className="prose lg:prose-xl mx-auto">
                <h1 className="font-headline">{page.title}</h1>
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>
        </div>
    )
}

export default function SlugPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();
    
    const [page, setPage] = useState<Page | null>(null);
    const [loadingPage, setLoadingPage] = useState(true);

    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingMenus, setLoadingMenus] = useState(true);

    const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

    useEffect(() => {
      if (!firestore) return;
      const settingsRef = doc(firestore, 'settings', 'siteIdentity');
      const menuQuery = query(collection(firestore, 'menus'), orderBy('order'));
      const unsubSettings = onSnapshot(settingsRef, (doc) => {
          setSiteSettings(doc.data() as SiteSettings);
          setLoadingSettings(false);
      });
      const unsubMenus = onSnapshot(menuQuery, (snapshot) => {
          setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
          setLoadingMenus(false);
      });
      return () => { unsubSettings(); unsubMenus(); };
    }, [firestore]);


    useEffect(() => {
        const fetchPageData = async () => {
            if (!firestore || !slug) return;
            setLoadingPage(true);
            
            try {
              const pageQuery = query(collection(firestore, 'pages'), where('slug', '==', slug));
              const pageSnapshot = await getDocs(pageQuery);

              if (!pageSnapshot.empty) {
                  const pageDoc = pageSnapshot.docs[0];
                  const pageData = { id: pageDoc.id, ...pageDoc.data() } as Page;
                  setPage(pageData);
              } else {
                   setPage(null);
              }
            } catch(e) {
                console.error("Error fetching page data: ", e);
                setPage(null);
            } finally {
                setLoadingPage(false);
            }
        };

        fetchPageData();
    }, [slug, firestore]);
    
    const isLoading = loadingSettings || loadingMenus || loadingPage;
    const showLayout = page?.type !== 'landing_page';

    return (
        <div className="flex flex-col min-h-screen">
            {showLayout && <Header menuItems={headerMenuItems} isLoading={loadingMenus} />}
            <main className="flex-grow">
               {isLoading ? (
                 <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
               ) : page ? (
                 <StaticPageContent page={page} />
               ) : (
                 <div className="container py-12 text-center">
                   <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
                   <p className="text-muted-foreground mt-4">Sorry, we couldn't find the page you're looking for.</p>
                 </div>
               )}
            </main>
            {showLayout && <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />}
        </div>
    );
}
