
'use client'
import type { Product, SiteSettings, MenuItem } from '@/lib/types';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


export default function ProductsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: products, isLoading: loadingProducts, error } = useCollection<Product>(productsQuery);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'siteIdentity') : null, [firestore]);
    const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menus'), orderBy('order')) : null, [firestore]);
    
    const { data: siteSettings, isLoading: loadingSettings } = useDoc<SiteSettings>(settingsRef);
    const { data: menuItems, isLoading: loadingMenus } = useCollection<MenuItem>(menuQuery);
    const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

    const isLoading = loadingProducts || loadingSettings || loadingMenus;

    useEffect(() => {
        if (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحميل المنتجات.",
                variant: "destructive",
            });
        }
    }, [error, toast]);


    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow container py-12">
                <h1 className="text-4xl font-headline text-center mb-10">جميع المنتجات</h1>
                {isLoading && <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                {error && <p className="text-center text-destructive">حدث خطأ أثناء تحميل المنتجات.</p>}
                {!isLoading && !error && (
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
