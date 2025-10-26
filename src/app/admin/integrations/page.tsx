'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { Integrations } from "@/lib/types";
import { useEffect } from "react";


const formSchema = z.object({
  facebookPixelId: z.string().optional().or(z.literal('')),
  googleTagId: z.string().optional().or(z.literal('')),
  tiktokPixelId: z.string().optional().or(z.literal('')),
});

export default function AdminIntegrationsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const integrationsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'integrations');
  }, [firestore]);

  const { data: integrationsData, isLoading: loadingIntegrations } = useDoc<Integrations>(integrationsRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        facebookPixelId: '',
        googleTagId: '',
        tiktokPixelId: '',
    },
  });

  useEffect(() => {
    if (integrationsData) {
      form.reset(integrationsData);
    }
  }, [integrationsData, form]);

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!integrationsRef) return;
    try {
        await setDoc(integrationsRef, values, { merge: true });
        toast({
            title: "تم الحفظ بنجاح",
            description: "تم تحديث إعدادات التكاملات.",
        });
    } catch(err) {
        console.error("Error saving integrations:", err);
        toast({
            title: "خطأ",
            description: "فشل حفظ إعدادات التكاملات.",
            variant: "destructive",
        });
    }
  };
  
    useEffect(() => {
        if (!loadingIntegrations && !integrationsData && integrationsRef) {
            onSubmit(form.getValues());
        }
    }, [loadingIntegrations, integrationsData, integrationsRef, form, onSubmit]);

  if (loadingIntegrations) {
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
          <h2 className="text-3xl font-bold tracking-tight font-headline">التكاملات</h2>
          <p className="text-muted-foreground">
            ربط وحدات البكسل (Pixels) لتتبع التحويلات وتحليل البيانات.
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>تكاملات وحدات البكسل (Pixels)</CardTitle>
               <CardDescription>أدخل المعرفات (IDs) الخاصة بوحدات البكسل لتفعيلها في متجرك.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                control={form.control}
                name="facebookPixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>معرف بيكسل فيسبوك (Facebook Pixel ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل Facebook Pixel ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="googleTagId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>معرف جوجل تاج (Google Tag ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: G-XXXXXXXXXX" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tiktokPixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>معرف بيكسل تيكتوك (TikTok Pixel ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل TikTok Pixel ID" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
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
