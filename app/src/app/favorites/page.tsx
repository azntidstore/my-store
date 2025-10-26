
'use client';
import { useCart } from '@/context/cart-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeartCrack } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { SiteSettings, MenuItem } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';

export default function FavoritesPage() {
  const { favorites, favoritesCount } = useCart();
  const firestore = useFirestore();
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  
  const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

  useEffect(() => {
    if (!firestore) return;

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
        unsubSettings();
        unsubMenus();
    };
  }, [firestore]);


  return (
    <div className="flex flex-col min-h-screen">
      <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
      <main className="flex-grow container py-12">
        <h1 className="text-4xl font-headline text-center mb-10">قائمة المفضلة</h1>
        {favoritesCount === 0 ? (
          <div className="text-center">
             <HeartCrack className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-6">قائمة المفضلة فارغة.</p>
            <Button asChild>
              <Link href="/products">تصفح المنتجات</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} isFavoritePage={true} />
            ))}
          </div>
        )}
      </main>
      <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
    </div>
  );
}
