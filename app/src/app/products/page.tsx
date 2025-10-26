'use client'
import type { Product, SiteSettings, MenuItem } from '@/lib/types';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, orderBy, query, doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


export default function ProductsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingMenus, setLoadingMenus] = useState(true);
    
    const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

    useEffect(() => {
        if (!firestore) return;

        const productsQuery = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
        const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            setLoadingProducts(false);
        }, (error) => {
            toast({ title: "خطأ", description: "فشل تحميل المنتجات.", variant: "destructive"});
            setLoadingProducts(false);
        });

        const settingsRef = doc(firestore, 'settings', 'siteIdentity');
        const unsubSettings = onSnapshot(settingsRef, (doc) => {
            setSiteSettings(doc.data() as SiteSettings);
            setLoadingSettings(false);
        });

        const menuQuery = query(collection(firestore, 'menus'), orderBy('order'));
        const unsubMenus = onSnapshot(menuQuery, (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
            setLoadingMenus(false);
        });

        return () => {
            unsubProducts();
            unsubSettings();
            unsubMenus();
        };

    }, [firestore, toast]);


    const isLoading = loadingProducts || loadingSettings || loadingMenus;

    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow container py-12">
                <h1 className="text-4xl font-headline text-center mb-10">جميع المنتجات</h1>
                {isLoading && <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                {!isLoading && (
                    <>
                     {products && products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                     ) : (
                        <p className="text-center text-muted-foreground">لا توجد منتجات لعرضها حاليًا.</p>
                     )}
                    </>
                )}
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={isLoading} />
        </div>
    );
}
