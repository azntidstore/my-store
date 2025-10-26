
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useCart } from "@/context/cart-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirebase, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, setDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import type { Order, SiteSettings, MenuItem } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import placeholderImages from '@/lib/placeholder-images.json';

const formSchema = z.object({
    name: z.string().min(3, "الاسم مطلوب."),
    address: z.string().min(10, "العنوان الكامل مطلوب."),
    phone: z.string().min(10, "رقم هاتف صحيح مطلوب."),
    city: z.string().min(2, "المدينة مطلوبة."),
});

async function addOrder(db: any, orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const ordersCol = collection(db, 'orders');
    const docRef = await addDoc(ordersCol, {
        ...orderData,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}


export default function CheckoutPage() {
    const { cart, cartSubtotal, shippingCost, grandTotal, cartCount, clearCart, selectedCity } = useCart();
    const { toast } = useToast();
    const router = useRouter();
    const { firestore, auth } = useFirebase();
    const { user, isUserLoading } = useUser();
    
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


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            address: "",
            phone: "",
            city: "",
        },
    });

    const { isSubmitting } = form.formState;
    
    useEffect(() => {
        if(selectedCity && !form.getValues('city')) {
            form.setValue('city', selectedCity);
        }
    }, [selectedCity, form]);

    // Sign in user anonymously if not already logged in
    useEffect(() => {
        if (!isUserLoading && !user && auth) {
            signInAnonymously(auth).catch((error) => {
                 toast({ title: "خطأ في المصادقة", description: "فشل في تسجيل الدخول المجهول.", variant: "destructive"});
                 console.error("Anonymous sign in error:", error);
            });
        }
    }, [isUserLoading, user, auth, toast]);


    useEffect(() => {
        if (!isUserLoading && user && user.displayName) {
            form.setValue('name', user.displayName);
        }
    }, [user, isUserLoading, form]);
    

    const handleConfirmOrder = async (values: z.infer<typeof formSchema>) => {
        if (!firestore || !auth) {
            toast({ title: "خطأ في الاتصال", description: "فشل الاتصال بخدمات Firebase.", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "المصادقة مطلوبة", description: "جاري المصادقة، يرجى المحاولة مرة أخرى بعد لحظات.", variant: "destructive" });
            return;
        }
         if (cartCount === 0) {
            toast({ title: "سلة فارغة", description: "لا يمكنك تأكيد طلب بسلة فارغة.", variant: "destructive" });
            router.push('/products');
            return;
        }

        // Create or update user profile in 'users' collection if they are not anonymous
        if (!user.isAnonymous) {
            const userRef = doc(firestore, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: values.name,
                roles: ['customer'],
                createdAt: serverTimestamp()
            }, { merge: true });
        }


        const orderData: Omit<Order, 'id' | 'createdAt'> = {
            userId: user.uid,
            items: cart.map(item => ({
                productId: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
                image: item.images[0]?.src || placeholderImages.products.placeholder
            })),
            total: grandTotal,
            shippingCost: shippingCost,
            status: 'pending',
            shippingAddress: {
                name: values.name,
                address: values.address,
                phone: values.phone,
                city: values.city,
            },
            paymentMethod: 'cod',
        };

        try {
            await addOrder(firestore, orderData);
            toast({
                title: "تم تأكيد الطلب بنجاح!",
                description: "شكراً لطلبك. سنتواصل معك قريباً.",
            });
            clearCart();
            router.push('/');
        } catch (error) {
            console.error("Error creating order: ", error);
            toast({
                title: "حدث خطأ",
                description: "لم نتمكن من تأكيد طلبك. الرجاء المحاولة مرة أخرى.",
                variant: "destructive",
            });
        }
    };
    
    const isLoading = isUserLoading || loadingMenus || loadingSettings;
    
    if(isLoading) {
      return (
         <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={true} />
            <main className="flex-grow container py-12 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
            <Footer isLoading={true} />
        </div>
      )
    }

    if (!isLoading && cartCount === 0) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
                <main className="flex-grow container py-12 text-center">
                    <h1 className="text-4xl font-headline mb-4">سلتك فارغة</h1>
                    <p className="text-muted-foreground mb-6">لا يمكنك المتابعة إلى الدفع بسلة فارغة.</p>
                    <Button asChild>
                        <Link href="/products">العودة إلى المنتجات</Link>
                    </Button>
                </main>
                <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow container py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-headline text-center mb-10">إتمام الشراء</h1>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleConfirmOrder)} className="grid md:grid-cols-2 gap-12">
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>معلومات الشحن</CardTitle>
                                        <CardDescription>الرجاء إدخال تفاصيل العنوان الخاص بك.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الاسم الكامل</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="اسمك الكامل" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>العنوان الكامل</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="الحي، الشارع..." {...field} />
                                                    </FormControl>
                                                     <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>رقم الهاتف</FormLabel>
                                                    <FormControl>
                                                        <Input type="tel" placeholder="0678124596" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>المدينة</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="مثال: مراكش" {...field} />
                                                    </FormControl>
                                                     <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>ملخص الطلب</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <span>{item.title} x {item.quantity}</span>
                                                <span>{(item.price * item.quantity).toFixed(2)} DH</span>
                                            </div>
                                        ))}
                                        <hr />
                                        <div className="flex justify-between font-semibold">
                                            <span>المجموع الفرعي</span>
                                            <span>{cartSubtotal.toFixed(2)} DH</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>الشحن</span>
                                            <span>{shippingCost.toFixed(2)} DH</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>المجموع الإجمالي</span>
                                            <span>{grandTotal.toFixed(2)} DH</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="animate-spin ml-2" /> : null}
                                            {isSubmitting ? 'جاري التأكيد...' : 'تأكيد الطلب'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                                <div className="mt-4 text-center p-4 bg-secondary rounded-lg">
                                    <p className="font-semibold">الدفع عند الاستلام</p>
                                    <p className="text-sm text-muted-foreground">سيتم تأكيد طلبك والدفع عند توصيل الشحنة.</p>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
        </div>
    );
}
