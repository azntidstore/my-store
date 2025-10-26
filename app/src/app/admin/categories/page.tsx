'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch, onSnapshot } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, GripVertical } from 'lucide-react';
import { Reorder } from "framer-motion"
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'الاسم مطلوب.'),
  slug: z.string().min(2, 'الرابط مطلوب.'),
  description: z.string().optional(),
  imageUrl: z.string().url('رابط صورة غير صالح.').optional().or(z.literal('')),
  order: z.number().default(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

function CategoryForm({ category, onSave, onDone }: { category?: CategoryFormData, onSave: (data: CategoryFormData) => Promise<void>, onDone: () => void }) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category || { name: '', slug: '', description: '', imageUrl: '', order: 0 },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSave(data);
    onDone();
  };
  
    const nameValue = form.watch('name');
    useEffect(() => {
        if (nameValue && !form.getValues('id')) { // Only auto-slug for new categories
            const slug = nameValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            form.setValue('slug', slug);
        }
    }, [nameValue, form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الفئة</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرابط (Slug)</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رابط الصورة</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormDescription>الأبعاد الموصى بها: 300x300 بكسل.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
           <DialogClose asChild>
              <Button type="button" variant="secondary">إلغاء</Button>
           </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const categoriesQuery = query(collection(firestore, 'categories'), orderBy('order'));
    
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(fetchedCategories);
        setOrderedCategories(fetchedCategories);
        setIsLoading(false);
    }, (error) => {
        toast({ title: "خطأ", description: "فشل في تحميل الفئات.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const handleSaveCategory = async (data: CategoryFormData) => {
    if (!firestore) return;
    try {
      if (editingCategory) {
        // Update
        const categoryRef = doc(firestore, 'categories', editingCategory.id);
        const updateData: Partial<CategoryFormData> = { ...data };
        delete updateData.id; 
        await updateDoc(categoryRef, { ...updateData, updatedAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تم تحديث الفئة.' });
      } else {
        // Create
        const newOrder = categories ? categories.length : 0;
        await addDoc(collection(firestore, 'categories'), { ...data, order: newOrder, createdAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تم إنشاء الفئة.' });
      }
    } catch (err) {
      console.error("Error saving category:", err);
      toast({ title: 'خطأ', description: 'فشل حفظ الفئة.', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'categories', id));
      toast({ title: 'نجاح', description: 'تم حذف الفئة.' });
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل حذف الفئة.', variant: 'destructive' });
    }
  };
  
  const handleReorder = async (newOrder: Category[]) => {
      // Optimistically update the UI
      setOrderedCategories(newOrder);

      if(!firestore) return;
      
      const batch = writeBatch(firestore);
      newOrder.forEach((category, index) => {
          const categoryRef = doc(firestore, 'categories', category.id);
          batch.update(categoryRef, { order: index });
      });

      try {
          await batch.commit();
          toast({ title: 'نجاح', description: 'تم تحديث ترتيب الفئات.' });
      } catch (err) {
          toast({ title: 'خطأ', description: 'فشل تحديث ترتيب الفئات.', variant: 'destructive' });
          if(categories) setOrderedCategories(categories);
      }
  }


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة الفئات</h2>
          <p className="text-muted-foreground">إنشاء وتعديل فئات المنتجات في متجرك.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(undefined)}>
              <PlusCircle className="mr-2 h-4 w-4" /> إضافة فئة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'تعديل الفئة' : 'إنشاء فئة جديدة'}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editingCategory}
              onSave={handleSaveCategory}
              onDone={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الفئات</CardTitle>
          <CardDescription>إجمالي {orderedCategories.length} فئة.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Reorder.Group axis="y" values={orderedCategories} onReorder={handleReorder}>
                <div className="divide-y">
                    {orderedCategories.map((category, index) => (
                         <Reorder.Item key={category.id} value={category}>
                             <div className={cn("flex items-center p-4 hover:bg-muted/50", index % 2 === 0 ? 'bg-muted/50' : '')}>
                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mr-2"/>
                                <div className="flex-1 font-medium">{category.name}</div>
                                <div className="text-sm text-muted-foreground">{category.slug}</div>
                                <div className="flex items-center gap-2 ml-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                    setEditingCategory(category);
                                    setIsFormOpen(true);
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteCategory(category.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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
