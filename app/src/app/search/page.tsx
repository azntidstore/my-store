
'use client';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import type { Product, SiteSettings, MenuItem } from '@/lib/types';
import { Loader2, SearchX } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function SearchResults() {
    const searchParams = useSearchParams();
    const queryTerm = searchParams.get('q');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    
    const firestore = useFirestore();
    const { toast } = useToast();

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingMenus, setLoadingMenus] = useState(true);

    const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);
    const isLoading = loadingProducts || loadingSettings || loadingMenus;

    useEffect(() => {
        if (!firestore) return;
        const productsQuery = collection(firestore, 'products');
        const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
            setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            setLoadingProducts(false);
        }, (error) => {
             toast({ title: "خطأ", description: "فشل في تحميل نتائج البحث.", variant: "destructive" });
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


    useEffect(() => {
        if (allProducts && queryTerm) {
            const lowercasedQuery = queryTerm.toLowerCase();
            const results = allProducts.filter(product => 
                product.title.toLowerCase().includes(lowercasedQuery) || 
                product.shortDescription?.toLowerCase().includes(lowercasedQuery) ||
                product.description.toLowerCase().includes(lowercasedQuery) ||
                product.tags?.some(tag => tag.toLowerCase().includes(lowercasedQuery))
            );
            setFilteredProducts(results);
        } else {
            setFilteredProducts([]);
        }
    }, [allProducts, queryTerm]);
    
    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow container py-12">
                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <>
                        <h1 className="text-4xl font-headline text-center mb-10">
                            نتائج البحث عن: <span className="text-primary">&quot;{queryTerm}&quot;</span>
                        </h1>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <SearchX className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
                                <p className="text-lg text-muted-foreground">لم يتم العثور على نتائج لبحثك.</p>

                                <p className="text-sm text-muted-foreground mt-2">حاول استخدام كلمات بحث مختلفة.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={isLoading} />
        </div>
    )
}


export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen">
                <Header menuItems={[]} isLoading={true} />
                <main className="flex-grow container flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></main>
                <Footer isLoading={true} />
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
