
'use client';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import {Button} from '@/components/ui/button';
import type {Product, SiteSettings, MenuItem, Category} from '@/lib/types';
import ProductRecommendations from '@/components/product/product-recommendations';
import {Loader2} from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import { useFirestore } from '@/firebase';
import { collection, query, limit, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function HeroSection() {
    const firestore = useFirestore();
    const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!firestore) return;
        const settingsRef = doc(firestore, 'settings', 'siteIdentity');
        const unsub = onSnapshot(settingsRef, (doc) => {
            setSiteSettings(doc.data() as SiteSettings);
            setIsLoading(false);
        });
        return () => unsub();
    }, [firestore]);
    
    const heroTitle = siteSettings?.heroTitle || 'مرحباً في سوق مرحبا';
    const heroSubtitle = siteSettings?.heroSubtitle || 'وجهتكم الأولى للمنتجات المغربية الأصيلة المصنوعة يدوياً.';
    const heroButtonText = siteSettings?.heroButtonText || 'ابدأ التسوق';

    if (isLoading) {
      return (
         <section className="bg-primary/10 py-12 text-center h-[268px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </section>
      )
    }

    return (
        <section className="bg-primary/10 py-12 text-center">
            <div className="container">
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{heroTitle}</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{heroSubtitle}</p>
                 <Button asChild size="lg" className="mt-6">
                   <Link href="/products">
                    {heroButtonText}
                  </Link>
                </Button>
            </div>
        </section>
    );
}

function CategoryHighlights() {
  const firestore = useFirestore();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!firestore) return;
    const categoriesQuery = query(collection(firestore, 'categories'), orderBy('order'));
    const unsub = onSnapshot(categoriesQuery, 
        (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
            setIsLoading(false);
        },
        (error) => {
            toast({
                title: "خطأ في تحميل الفئات",
                description: "لا يمكن عرض الفئات المميزة حاليًا.",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    );
    return () => unsub();
  }, [firestore, toast]);

  if (isLoading) {
      return (
        <section className="bg-secondary">
          <div className="container py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        </section>
      );
  }

  return (
    <section className="bg-secondary">
      <div className="container py-8">
        <h2 className="text-3xl font-headline text-center mb-10">تصفح حسب الفئات</h2>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {categories?.map(category => (
            <Link href={`/categories/${category.slug}`} key={category.id} className="group flex flex-col items-center gap-3 text-center w-24">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300">
                <Image
                  src={category.imageUrl || `https://picsum.photos/seed/cat-${category.slug}/300/300`}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="6rem"
                  data-ai-hint={category.name}
                />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection({ title, query: firestoreQuery, bgColorClass, showMoreButton = false }: { title: string; query: any; bgColorClass: string; showMoreButton?: boolean; }) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!firestoreQuery) return;
    const unsub = onSnapshot(firestoreQuery, 
        (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            setLoading(false);
        },
        (err) => {
            setError(err);
            setLoading(false);
            toast({
                title: 'خطأ',
                description: 'فشل في تحميل المنتجات. الرجاء المحاولة مرة أخرى.',
                variant: 'destructive',
            });
        }
    );
    return () => unsub();
  }, [firestoreQuery, toast]);
  
  return (
     <section className={`py-12 ${bgColorClass}`}>
      <div className="container">
        <h2 className="text-3xl font-headline text-center mb-8">{title}</h2>
        {loading && <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {error && <p className="text-center text-destructive">فشل في تحميل المنتجات.</p>}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products && products.map(product => (
                  <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {showMoreButton && products && products.length > 0 && (
              <div className="text-center mt-12">
                <Button asChild size="lg" variant="outline">
                   <Link href="/products">
                    عرض جميع المنتجات
                  </Link>
                </Button>
              </div>
            )}
            {!loading && products?.length === 0 && <p className="text-center text-muted-foreground">لا توجد منتجات لعرضها.</p>}
          </>
        )}
      </div>
    </section>
  )
}

export default function HomePage() {
  const firestore = useFirestore();

  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [loadingSettings, setLoadingSettings] = React.useState(true);
  const [loadingMenus, setLoadingMenus] = React.useState(true);

  const headerMenuItems = React.useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

  React.useEffect(() => {
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

    return () => {
        unsubSettings();
        unsubMenus();
    };
  }, [firestore]);

  const featuredQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('price', 'desc'), limit(10));
  }, [firestore]);

  const newestQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
      <main className="flex-grow">
        <HeroSection />
        <ProductSection 
          title="منتجات مختارة"
          query={featuredQuery}
          bgColorClass="bg-background"
          showMoreButton={true}
        />
        <ProductSection 
          title="أحدث المنتجات"
          query={newestQuery}
          bgColorClass="bg-secondary"
        />
        <CategoryHighlights />
        <ProductRecommendations />
      </main>
      <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
    </div>
  );
}
