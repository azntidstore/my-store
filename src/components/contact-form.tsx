
'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


const formSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب."),
  email: z.string().email("بريد إلكتروني غير صالح."),
  content: z.string().min(10, "الرسالة يجب أن تحتوي على 10 أحرف على الأقل."),
});

async function addMessage(db: any, messageData: z.infer<typeof formSchema>) {
    const messagesCol = collection(db, 'messages');
    await addDoc(messagesCol, {
        senderInfo: {
            name: messageData.name,
            email: messageData.email,
        },
        content: messageData.content,
        status: 'unread',
        createdAt: serverTimestamp(),
    });
}


export default function ContactForm() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            content: "",
        },
    });

    const { isSubmitting } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!firestore) {
            toast({ title: "خطأ", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive"});
            return;
        }

        try {
            await addMessage(firestore, values);
            toast({
                title: "تم إرسال الرسالة بنجاح!",
                description: "شكرًا لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
            });
            form.reset();
        } catch (error) {
            console.error("Error sending message: ", error);
            toast({
                title: "حدث خطأ",
                description: "لم نتمكن من إرسال رسالتك. الرجاء المحاولة مرة أخرى.",
                variant: "destructive",
            });
        }
    };


    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>أرسل لنا رسالة</CardTitle>
                <CardDescription>املأ النموذج أدناه وسنعاود الاتصال بك في أقرب وقت ممكن.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رسالتك</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="كيف يمكننا مساعدتك؟" {...field} rows={6} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin ml-2" /> : null}
                            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

    