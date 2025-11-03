'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc } from 'firebase/firestore';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2 } from 'lucide-react';
import type { Page, SiteSettings, MenuItem } from '@/lib/types';

function StaticPageContent({ page }: { page: Page }) {
    return (
        <div className="container py-12">
            <h1>{page.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
    );
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

    const headerMenuItems = useMemo(() => menuItems.filter(item => item.location === 'header'), [menuItems]);

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
        if (!firestore || !slug) return;
        setLoadingPage(true);
        const fetchPageData = async () => {
            const pageQuery = query(collection(firestore, 'pages'), where('slug', '==', slug));
            const snapshot = await getDocs(pageQuery);
            if (!snapshot.empty) {
                const pageDoc = snapshot.docs[0];
                setPage({ id: pageDoc.id, ...pageDoc.data() } as Page);
            } else {
                setPage(null);
            }
            setLoadingPage(false);
        };
        fetchPageData();
    }, [slug, firestore]);

    const isLoading = loadingSettings || loadingMenus || loadingPage;

    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow">
                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : page ? (
                    <StaticPageContent page={page} />
                ) : (
                    <div className="container py-12 text-center">
                        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
                    </div>
                )}
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
        </div>
    );
}
