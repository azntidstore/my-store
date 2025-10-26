'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import type { SiteSettings, MenuItem, ShippingZone } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import placeholderImages from '@/lib/placeholder-images.json';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { cart, cartCount, updateQuantity, removeFromCart, cartSubtotal, shippingCost, grandTotal, calculateShipping, selectedCity } = useCart();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [cityError, setCityError] = useState(false);

  // --- Data Fetching ---
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'siteIdentity') : null, [firestore]);
  const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menus'), orderBy('order')) : null, [firestore]);
  const shippingQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'shipping-zones')) : null, [firestore]);
  
  const { data: siteSettings, isLoading: loadingSettings } = useDoc<SiteSettings>(settingsRef);
  const { data: menuItems, isLoading: loadingMenus } = useCollection<MenuItem>(menuQuery);
  const { data: shippingZones, isLoading: loadingShipping } = useCollection<ShippingZone>(shippingQuery);

  const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);
  
  const allCities = useMemo(() => {
    if (!shippingZones) return [];
    const cities = shippingZones.flatMap(zone => zone.cities);
    return [...new Set(cities)].sort(); // Remove duplicates and sort
  }, [shippingZones]);

  const handleCityChange = (city: string) => {
    setCityError(false);
    calculateShipping(city, shippingZones || []);
  };

  const handleCheckout = () => {
    if (!selectedCity) {
      setCityError(true);
      toast({
        title: "منطقة الشحن مطلوبة",
        description: "الرجاء اختيار مدينة للشحن أولاً.",
        variant: "destructive",
      });
    } else {
      router.push('/checkout');
    }
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
      <main className="flex-grow container py-12">
        <h1 className="text-4xl font-headline text-center mb-10">سلة التسوق الخاصة بك</h1>
        {cartCount === 0 ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-6">سلتك فارغة حالياً.</p>
            <Button asChild>
              <Link href="/products">العودة لتصفح المنتجات</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.id} className="flex items-center p-4">
                  <div className="relative w-24 h-24 rounded-md overflow-hidden ml-4">
                    <Image
                      src={item.images[0]?.src || placeholderImages.products.placeholder}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="font-bold hover:text-primary">{item.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.price} DH</p>
                    <div className="flex items-center mt-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="mx-4 font-bold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <p className="font-bold text-lg mb-4">{item.price * item.quantity} DH</p>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex justify-between">
                        <span>المجموع الفرعي</span>
                        <span>{cartSubtotal.toFixed(2)} DH</span>
                    </div>
                    <div>
                         <label className="text-sm font-medium mb-2 block">الشحن إلى</label>
                         {loadingShipping ? <Loader2 className="animate-spin" /> : (
                           <>
                           <Select
                             value={selectedCity || ''}
                             onValueChange={handleCityChange}
                           >
                                <SelectTrigger className={cityError ? 'border-destructive ring-destructive' : ''}>
                                    <SelectValue placeholder="اختر مدينتك..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCities.map(city => (
                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                </SelectContent>
                           </Select>
                           {cityError && <p className="text-sm font-medium text-destructive mt-2">الرجاء اختيار مدينة</p>}
                           </>
                         )}
                    </div>
                    <div className="flex justify-between">
                        <span>تكلفة الشحن</span>
                        <span>{shippingCost.toFixed(2)} DH</span>
                    </div>
                    <hr/>
                    <div className="flex justify-between font-bold text-lg">
                        <span>المجموع الإجمالي</span>
                        <span>{grandTotal.toFixed(2)} DH</span>
                    </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCheckout} className="w-full" size="lg">
                    المتابعة لإتمام الشراء
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
    </div>
  );
}
