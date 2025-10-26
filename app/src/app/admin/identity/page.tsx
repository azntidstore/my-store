'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState } from "react";


const socialLinkSchema = z.object({
  platform: z.string().min(1, "المنصة مطلوبة."),
  url: z.string().url("الرابط غير صالح."),
  icon: z.string().min(1, "الأيقونة مطلوبة."),
});

const formSchema = z.object({
  storeName: z.string().min(1, "اسم المتجر مطلوب."),
  logoUrl: z.string().url("رابط الشعار غير صالح.").optional().or(z.literal('')),
  faviconUrl: z.string().url("رابط الأيقونة غير صالح.").optional().or(z.literal('')),
  footerWelcomeText: z.string().min(1, "النص الترحيبي مطلوب."),
  copyrightText: z.string().min(1, "نص حقوق النشر مطلوب."),
  heroTitle: z.string().min(1, "العنوان الرئيسي مطلوب."),
  heroSubtitle: z.string().min(1, "الوصف الفرعي مطلوب."),
  heroButtonText: z.string().min(1, "نص الزر مطلوب."),
  contact: z.object({
    phone: z.string().min(1, "رقم الهاتف مطلوب."),
    email: z.string().email("بريد إلكتروني غير صالح."),
  }),
  address: z.string().min(1, "العنوان مطلوب."),
  socialLinks: z.array(socialLinkSchema),
});

export default function AdminIdentityPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [loadingSettings, setLoadingSettings] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        storeName: '',
        footerWelcomeText: '',
        copyrightText: '',
        heroTitle: 'مرحباً في سوق مرحبا',
        heroSubtitle: 'وجهتكم الأولى للمنتجات المغربية الأصيلة المصنوعة يدوياً.',
        heroButtonText: 'ابدأ التسوق',
        contact: { phone: '', email: ''},
        address: '',
        socialLinks: [],
        logoUrl: '',
        faviconUrl: '',
    },
  });
  
  useEffect(() => {
    if (!firestore) return;
    const settingsRef = doc(firestore, 'settings', 'siteIdentity');
    
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            form.reset(docSnap.data() as SiteSettings);
        }
        setLoadingSettings(false);
    }, (error) => {
        console.error("Failed to fetch settings: ", error);
        toast({ title: 'خطأ', description: 'فشل تحميل الإعدادات.', variant: 'destructive'});
        setLoadingSettings(false);
    });

    return () => unsubscribe();

  }, [firestore, form, toast]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const settingsRef = doc(firestore, 'settings', 'siteIdentity');
    try {
        await setDoc(settingsRef, values, { merge: true });
        toast({
            title: "تم الحفظ بنجاح",
            description: "تم تحديث إعدادات هوية المتجر في قاعدة البيانات.",
        });
    } catch(err) {
        console.error("Error saving site identity:", err);
        toast({
            title: "خطأ",
            description: "فشل حفظ الإعدادات. الرجاء المحاولة مرة أخرى.",
            variant: "destructive",
        });
    }
  };

  if (loadingSettings) {
    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">هوية المتجر</h2>
          <p className="text-muted-foreground">
            إدارة الإعدادات الأساسية لهوية متجرك وعلامتك التجارية.
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>محتوى الواجهة (Hero Section)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
               <FormField
                control={form.control}
                name="heroTitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>العنوان الرئيسي</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="heroSubtitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>الوصف الفرعي</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroButtonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نص زر التسوق</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المتجر</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط الشعار (Logo)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                     <FormDescription>الأبعاد الموصى بها: 200x50 بكسل.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="faviconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط أيقونة الموقع (Favicon)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>الأبعاد الموصى بها: 32x32 بكسل.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="copyrightText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نص حقوق النشر</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="footerWelcomeText"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>النص الترحيبي في الفوتر</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معلومات التواصل</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
               <FormField
                control={form.control}
                name="contact.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="contact.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>روابط التواصل الاجتماعي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`socialLinks.${index}.platform`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>المنصة</FormLabel>
                        <FormControl><Input placeholder="Facebook" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialLinks.${index}.icon`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الأيقونة</FormLabel>
                        <FormControl><Input placeholder="FB" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialLinks.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>الرابط</FormLabel>
                        <FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ platform: '', icon: '', url: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                إضافة رابط
              </Button>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
             حفظ التغييرات
          </Button>
        </form>
      </Form>
    </div>
  );
}
