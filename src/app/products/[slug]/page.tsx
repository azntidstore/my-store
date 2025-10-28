'use client';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Product, SiteSettings, MenuItem } from '@/lib/types';
import { ShoppingCart, Video, FileText, Sparkles, Loader2, Plus, Minus, ChevronLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useEffect, useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import Link from 'next/link';
import { collection, doc, query, orderBy, where, getDocs, limit, onSnapshot } from 'firebase/firestore';

export function generateStaticParams() {
  return [];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [quantity, setQuantity] = useState(1);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const { addToCart } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();

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
      const fetchProduct = async () => {
          if (!firestore || !slug) return;
          setLoadingProduct(true);
          
          try {
            const productQuery = query(collection(firestore, "products"), where("slug", "==", slug), limit(1));
            const querySnapshot = await getDocs(productQuery);

            if (!querySnapshot.empty) {
                const productDoc = querySnapshot.docs[0];
                setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
            } else {
                setProduct(null);
            }
          } catch(e) {
            console.error("Error fetching product:", e);
            setProduct(null);
          } finally {
            setLoadingProduct(false);
          }
      }
      fetchProduct();
  }, [firestore, slug]);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0 && !selectedColor) {
         const defaultColor = product.variants[0].color;
         setSelectedColor(defaultColor);
         const sizesForDefaultColor = product.variants.filter(v => v.color === defaultColor).map(v => v.size);
         if(sizesForDefaultColor.length > 0) {
           setSelectedSize(sizesForDefaultColor[0]);
         }
      }
    }
  }, [product, selectedColor]);
  
  useEffect(() => {
    if (!api) {
      return
    }
    setCurrent(api.selectedScrollSnap() + 1)
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])
  
  useEffect(() => {
    const savedThreshold = localStorage.getItem('lowStockThreshold');
    if (savedThreshold) {
      setLowStockThreshold(parseInt(savedThreshold, 10));
    }
  }, []);

  const uniqueColors = useMemo(() => {
    if (!product || !product.variants) return [];
    const colors = product.variants.map(variant => ({ name: variant.color, code: variant.colorCode }));
    return Array.from(new Map(colors.map(item => [item.name, item])).values());
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product || !product.variants || !selectedColor) return [];
    return product.variants.filter(variant => variant.color === selectedColor).map(variant => variant.size);
  }, [product, selectedColor]);

  const selectedVariantStock = useMemo(() => {
    if (!product) return 0;
    if (product.variants && product.variants.length > 0) {
        if (!selectedColor || !selectedSize) return 0;
        const variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
        return variant ? variant.stock : 0;
    }
    return product.totalStock;
  }, [product, selectedColor, selectedSize]);

  useEffect(() => {
    if(availableSizes.length > 0 && !availableSizes.includes(selectedSize || '')) {
      setSelectedSize(availableSizes[0]);
    }
    setQuantity(1);
  }, [availableSizes, selectedSize]);

  const handleAddToCart = () => {
    if (!product || selectedVariantStock === 0) return;

     if(product.variants && product.variants.length > 0 && (!selectedColor || !selectedSize)) {
        toast({
            title: "يرجى تحديد الخيارات",
            description: "الرجاء اختيار اللون والمقاس قبل الإضافة إلى السلة.",
            variant: "destructive",
        });
        return;
    }
    
    addToCart(product, quantity);
    toast({
      title: "أضيفت إلى السلة!",
      description: `${quantity} x ${product.title} تمت إضافته إلى سلة التسوق الخاصة بك.`,
    });
  };

  const renderStockStatus = () => {
        if (selectedVariantStock > lowStockThreshold) {
            return (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>متوفر في المخزون</span>
                </div>
            );
        }
        if (selectedVariantStock > 0) {
            return (
                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                    <AlertTriangle className="w-5 h-5" />
                    <span>متوفر {selectedVariantStock} قطع فقط</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-red-600 font-semibold">
                <XCircle className="w-5 h-5" />
                <span>نفد المخزون</span>
            </div>
        );
    };

  const isPageLoading = loadingProduct || loadingSettings || loadingMenus;

  if (isPageLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header menuItems={headerMenuItems} isLoading={true} />
        <main className="flex-grow container py-12 text-center flex justify-center items-center">
           <Loader2 className="h-8 w-8 animate-spin" /> <span className="mr-2">جاري تحميل المنتج...</span>
        </main>
        <Footer isLoading={true} />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
        <main className="flex-grow container py-12 text-center">
          <h1 className="text-4xl font-headline mb-4">المنتج غير موجود</h1>
          <p className="text-destructive">عذراً، لم نتمكن من العثور على هذا المنتج. ربما تم حذفه.</p>
           <Button asChild className="mt-8">
              <Link href="/products">العودة إلى المنتجات</Link>
            </Button>
        </main>
        <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ src: `https://picsum.photos/seed/${product.id}/600/750`, alt: product.title }];

  return (
    <div className="flex flex-col min-h-screen">
      <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4 mx-1" />
          <Link href="/products" className="hover:text-primary">المنتجات</Link>
          <ChevronLeft className="h-4 w-4 mx-1" />
          <span className="font-medium text-foreground">{product.title}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <div className="space-y-4">
              <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                  {images.map((image, index) => (
                    <CarouselItem key={index}>
                      <Card>
                        <CardContent className="relative aspect-square flex items-center justify-center p-0">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={index === 0}
                            data-ai-hint={image['data-ai-hint']}
                          />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
              </Carousel>
              
               <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button key={index} onClick={() => api?.scrollTo(index)} className={cn("overflow-hidden rounded-lg", (current-1) === index ? "ring-2 ring-primary" : "")}>
                     <div className="relative aspect-square">
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="object-cover"
                            sizes="10vw"
                            data-ai-hint={image['data-ai-hint']}
                        />
                     </div>
                  </button>
                ))}
              </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-headline font-bold mb-2">
              {product.title}
            </h1>
            <p className="text-muted-foreground text-lg mb-4">{product.shortDescription}</p>

            <p className="text-3xl font-bold text-primary mb-2">
              {product.price} DH
            </p>
            <div className="mb-6 h-6">{renderStockStatus()}</div>


            {uniqueColors.length > 0 && (
                <div className="mb-6">
                    <Label className="text-lg font-semibold mb-3 block">اللون: <span className="font-normal text-muted-foreground">{selectedColor}</span></Label>
                     <div className="flex items-center gap-3">
                        {uniqueColors.map((color) => (
                            <button
                                key={color.name}
                                type="button"
                                onClick={() => setSelectedColor(color.name)}
                                className={cn(
                                    "h-8 w-8 rounded-full border-2 transition-all",
                                    selectedColor === color.name ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'border-border'
                                )}
                                style={{ backgroundColor: color.code }}
                                title={color.name}
                            >
                              <span className="sr-only">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {availableSizes.length > 0 && (
                 <div className="mb-6">
                    <Label className="text-lg font-semibold mb-3 block">المقاس:</Label>
                    <div className="flex items-center gap-2">
                        {availableSizes.map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(size)}
                                className={cn(
                                    "cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-semibold transition-colors",
                                    selectedSize === size 
                                        ? "bg-primary text-primary-foreground border-primary" 
                                        : "bg-background hover:bg-accent/50 border-input"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}


            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Minus className="h-5 w-5" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                 <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setQuantity(q => q + 1)} disabled={quantity >= selectedVariantStock}>
                    <Plus className="h-5 w-5" />
                </Button>
              </div>
              <Button size="lg" className="flex-1 h-11" onClick={handleAddToCart} disabled={selectedVariantStock === 0}>
                <ShoppingCart className="ml-2 h-5 w-5" />
                 {selectedVariantStock > 0 ? 'أضف إلى السلة' : 'نفد المخزون'}
              </Button>
            </div>
            
            <Tabs defaultValue="description" className="mt-10">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description"><FileText className="ml-2"/>الوصف</TabsTrigger>
                <TabsTrigger value="specs"><Sparkles className="ml-2"/>المواصفات</TabsTrigger>
                <TabsTrigger value="video" disabled={!product.videoUrl}><Video className="ml-2"/>فيديو</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="py-6">
                 <div
                  className="prose text-foreground/80 max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </TabsContent>
              <TabsContent value="specs" className="py-6">
                <ul className="space-y-3">
                  {product.specifications?.map((spec, index) => (
                    <li key={index} className="grid grid-cols-3 gap-2 text-sm">
                      <strong className="col-span-1 font-semibold">{spec.name}:</strong>
                      <span className="col-span-2 text-muted-foreground">{spec.value}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="video" className="py-6">
                {product.videoUrl && (
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      className="w-full h-full rounded-lg"
                      src={product.videoUrl.replace("watch?v=", "embed/")}
                      title="Product Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </main>
      <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
    </div>
  );
}
