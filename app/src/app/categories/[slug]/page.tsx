
'use client';
import { useMemo, useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import type { Product, Category, SiteSettings, MenuItem } from '@/lib/types';
import { Loader2, Tag } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, doc, query, where, getDocs, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useParams } from 'next/navigation';

function ProductGrid({ products, loadingProducts }: { products: Product[], loadingProducts: boolean }) {
     if (loadingProducts) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
     }
     
     if (!products || products.length === 0) {
        return (
             <div className="text-center py-20">
                <Tag className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">لا توجد منتجات لعرضها حاليًا في هذه الفئة.</p>
            </div>
        )
     }

     return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
     )
}


export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();
    
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingPage, setLoadingPage] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);

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
        const fetchCategoryData = async () => {
            if (!firestore || !slug) return;
            setLoadingPage(true);
            
            try {
              const categoryQuery = query(collection(firestore, 'categories'), where('slug', '==', slug), limit(1));
              const categorySnapshot = await getDocs(categoryQuery);

              if (!categorySnapshot.empty) {
                  const categoryDoc = categorySnapshot.docs[0];
                  const categoryData = { id: categoryDoc.id, ...categoryDoc.data() } as Category;
                  setCategory(categoryData);
                  
                  setLoadingProducts(true);
                  const productsQuery = query(collection(firestore, 'products'), where('categoryId', '==', categoryData.id));
                  const productsSnapshot = await getDocs(productsQuery);
                  setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
                  setLoadingProducts(false);
              } else {
                setCategory(null);
              }
            } catch(e) {
                console.error("Error fetching category data: ", e);
                setCategory(null);
            } finally {
                setLoadingPage(false);
            }
        };

        fetchCategoryData();
    }, [slug, firestore]);
    
    const isLoading = loadingSettings || loadingMenus || loadingPage;

    if(isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header menuItems={[]} isLoading={true} />
                <main className="flex-grow container py-12 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </main>
                <Footer isLoading={true} />
            </div>
        )
    }

    if(!category) {
        return (
             <div className="flex flex-col min-h-screen">
                <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
                <main className="flex-grow container py-12 text-center">
                    <h1 className="text-4xl font-headline">الفئة غير موجودة</h1>
                </main>
                <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow container py-12">
                 <h1 className="text-4xl font-headline text-center mb-10">
                    {category.name}
                </h1>
                <ProductGrid products={products} loadingProducts={loadingProducts} />
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
        </div>
    );
}
