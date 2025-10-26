'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import type { Page } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, GripVertical, FileCode } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Reorder } from "framer-motion"
import { Badge } from '@/components/ui/badge';

const pageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'العنوان مطلوب.'),
  slug: z.string().min(2, 'الرابط مطلوب.'),
  type: z.enum(['static', 'dynamic', 'landing_page']),
  content: z.string().min(10, 'المحتوى مطلوب.'),
  order: z.number().default(0),
});

type PageFormData = z.infer<typeof pageSchema>;

function PageForm({ page, onSave, onDone }: { page?: PageFormData, onSave: (data: PageFormData) => Promise<void>, onDone: () => void }) {
  const form = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: page || { title: '', slug: '', type: 'static', content: '', order: 0 },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (data: PageFormData) => {
    await onSave(data);
    onDone();
  };
  
  const titleValue = form.watch('title');
  useEffect(() => {
    if (titleValue && !form.getValues('id')) { // Only auto-slug for new pages
        const slug = titleValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        form.setValue('slug', slug);
    }
  }, [titleValue, form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>عنوان الصفحة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem><FormLabel>الرابط (Slug)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
                <FormLabel>نوع الصفحة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="static">صفحة ثابتة</SelectItem>
                        <SelectItem value="dynamic">صفحة ديناميكية</SelectItem>
                        <SelectItem value="landing_page">صفحة هبوط (HTML)</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={form.control} name="content" render={({ field }) => (
          <FormItem>
            <FormLabel>المحتوى (يدعم HTML)</FormLabel>
            <FormControl><Textarea dir="ltr" className="text-left font-mono" rows={15} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <DialogFooter>
           <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminPagesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | undefined>(undefined);

  // Fetch ALL pages without ordering by 'order' initially
  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pages'));
  }, [firestore]);

  const { data: pages, isLoading, error } = useCollection<Page>(pagesQuery);
  const [orderedPages, setOrderedPages] = useState<Page[]>([]);

  useEffect(() => {
      if(pages) {
          // Sort client-side to handle documents that might not have an 'order' field
          const sorted = [...pages].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          setOrderedPages(sorted);
      }
  }, [pages]);

  useEffect(() => {
    if (error) {
      toast({ title: "خطأ", description: "فشل في تحميل الصفحات.", variant: "destructive" });
    }
  }, [error, toast]);

  const handleSavePage = async (data: PageFormData) => {
    if (!firestore) return;
    try {
      if (editingPage) {
        const pageRef = doc(firestore, 'pages', editingPage.id);
        const updateData: Partial<PageFormData> = { ...data };
        delete updateData.id;
        await updateDoc(pageRef, { ...updateData, updatedAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تم تحديث الصفحة.' });
      } else {
        const newOrder = pages ? pages.length : 0;
        await addDoc(collection(firestore, 'pages'), { ...data, order: newOrder, createdAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تم إنشاء الصفحة.' });
      }
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل حفظ الصفحة.', variant: 'destructive' });
    }
    finally {
        setIsFormOpen(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'pages', id));
      toast({ title: 'نجاح', description: 'تم حذف الصفحة.' });
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل حذف الصفحة.', variant: 'destructive' });
    }
  };

  const handleReorder = async (newOrder: Page[]) => {
      setOrderedPages(newOrder);
      if(!firestore) return;
      
      const batch = writeBatch(firestore);
      newOrder.forEach((page, index) => {
          const pageRef = doc(firestore, 'pages', page.id);
          batch.update(pageRef, { order: index });
      });

      try {
          await batch.commit();
          toast({ title: 'نجاح', description: 'تم تحديث ترتيب الصفحات.' });
      } catch (err) {
          toast({ title: 'خطأ', description: 'فشل تحديث ترتيب الصفحات.', variant: 'destructive' });
          if(pages) setOrderedPages(pages);
      }
  }

  const getTypeBadge = (type: Page['type']) => {
    switch(type) {
      case 'static': return <Badge variant="secondary">ثابتة</Badge>;
      case 'dynamic': return <Badge variant="outline">ديناميكية</Badge>;
      case 'landing_page': return <Badge className="bg-purple-600 text-white"><FileCode className="w-3 h-3 ml-1" /> هبوط</Badge>;
      default: return null;
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة الصفحات</h2>
          <p className="text-muted-foreground">إنشاء وتعديل الصفحات الثابتة والديناميكية وصفحات الهبوط.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPage(undefined)}>
              <PlusCircle className="mr-2 h-4 w-4" /> إضافة صفحة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader><DialogTitle>{editingPage ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}</DialogTitle></DialogHeader>
            <PageForm page={editingPage} onSave={handleSavePage} onDone={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>قائمة الصفحات</CardTitle><CardDescription>إجمالي {orderedPages?.length || 0} صفحة.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : orderedPages.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
                لا توجد صفحات لعرضها.
            </div>
           ) : (
            <Reorder.Group axis="y" values={orderedPages} onReorder={handleReorder}>
                <div className="divide-y">
                {orderedPages.map((page, index) => (
                    <Reorder.Item key={page.id} value={page}>
                        <div className={cn("flex items-center p-4 hover:bg-muted/50", index % 2 === 0 ? 'bg-muted/50' : '')}>
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mr-2"/>
                            <div className="flex-1">
                                <Link href={`/${page.slug}`} target="_blank" className="font-medium hover:underline">{page.title}</Link>
                                <p className="text-sm text-muted-foreground">/{page.slug}</p>
                            </div>
                             <div className="mx-4">
                                {getTypeBadge(page.type)}
                             </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingPage(page); setIsFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeletePage(page.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        </div>
                    </Reorder.Item>
                ))}
                </div>
            </Reorder.Group>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
