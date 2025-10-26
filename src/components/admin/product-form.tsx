
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product, Category, Page } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useEffect } from 'react';

const formSchema = z.object({
  title: z.string().min(1, "اسم المنتج مطلوب."),
  slug: z.string().min(1, "الاسم اللطيف مطلوب."),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "السعر يجب أن يكون إيجابيا."),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "الفئة مطلوبة."),
  images: z.array(z.object({
    src: z.string().url("يجب أن يكون رابطًا صالحًا."),
    alt: z.string().min(1, "النص البديل مطلوب."),
  })).min(1, "يجب إضافة صورة واحدة على الأقل."),
  specifications: z.array(z.object({
    name: z.string().min(1, "اسم الميزة مطلوب."),
    value: z.string().min(1, "وصف الميزة مطلوب."),
  })).optional(),
  videoUrl: z.string().url("يجب أن يكون رابط فيديو صالحًا.").optional().or(z.literal('')),
  hasVariants: z.boolean(),
  totalStock: z.coerce.number().optional(), // Keep it optional here at the base
  variants: z.array(z.object({
    id: z.string().optional(),
    color: z.string().min(1, "اللون مطلوب."),
    colorCode: z.string().min(1, "رمز اللون مطلوب."),
    size: z.string().min(1, "المقاس مطلوب."),
    stock: z.coerce.number().min(0, "الكمية يجب أن تكون إيجابية."),
  })).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
}).refine(data => {
    // If hasVariants is false, totalStock must be a number >= 0
    if (!data.hasVariants) {
        return data.totalStock !== undefined && data.totalStock >= 0;
    }
    return true;
}, {
    message: "إجمالي المخزون مطلوب.",
    path: ["totalStock"], // Apply error to totalStock field
});


type ProductFormProps = {
    product?: Partial<Product>;
    onSave: (data: Omit<Product, 'id'>) => Promise<void>;
    isEditing?: boolean;
    categories: Category[];
    dynamicPages: Page[];
    isLoading: boolean;
}


export default function ProductForm({ product, onSave, isEditing = false, categories, dynamicPages, isLoading }: ProductFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: product?.title || '',
            slug: product?.slug || '',
            sku: product?.sku || '',
            price: product?.price || 0,
            shortDescription: product?.shortDescription || '',
            description: product?.description || '',
            categoryId: product?.categoryId || '',
            images: product?.images || [{ src: '', alt: '' }],
            specifications: product?.specifications || [{ name: '', value: '' }],
            videoUrl: product?.videoUrl || '',
            hasVariants: !!product?.variants && product.variants.length > 0,
            totalStock: product?.totalStock || 0,
            variants: product?.variants ? product.variants.map(v => ({...v, stock: v.stock || 0})) : [{ id: '', color: '', colorCode: '', size: '', stock: 0 }],
            metaTitle: '', 
            metaDescription: '',
        }
    });

    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
        control: form.control,
        name: "images",
    });

    const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
        control: form.control,
        name: "specifications",
    });
    
    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control: form.control,
        name: "variants",
    });

    const hasVariants = form.watch('hasVariants');

    const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
        let totalStock = 0;
        if (values.hasVariants && values.variants) {
            totalStock = values.variants.reduce((acc, v) => acc + v.stock, 0);
        } else {
            totalStock = values.totalStock || 0;
        }

        const productData: Omit<Product, 'id'> = {
            title: values.title,
            slug: values.slug,
            sku: values.sku || `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            price: values.price,
            shortDescription: values.shortDescription,
            description: values.description || '<p></p>',
            categoryId: values.categoryId,
            images: values.images,
            specifications: values.specifications,
            videoUrl: values.videoUrl,
            totalStock: totalStock,
            variants: values.hasVariants ? (values.variants || []).map(v => ({ ...v, id: v.id || Math.random().toString() })) : [],
        };
        
        await onSave(productData);
    };
    
    const titleValue = form.watch('title');
    useEffect(() => {
        if (titleValue && !isEditing) {
            const slug = titleValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            form.setValue('slug', slug);
        }
    }, [titleValue, form, isEditing]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                    <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                            <Tabs defaultValue="general">
                                <TabsList>
                                    <TabsTrigger value="general">عام</TabsTrigger>
                                    <TabsTrigger value="media">الوسائط</TabsTrigger>
                                    <TabsTrigger value="variants">المتغيرات</TabsTrigger>
                                    <TabsTrigger value="seo">محركات البحث (SEO)</TabsTrigger>
                                </TabsList>
                                <TabsContent value="general">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>تفاصيل المنتج</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField control={form.control} name="title" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>اسم المنتج</FormLabel>
                                                    <FormControl><Input placeholder="مثال: قفطان مغربي" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="shortDescription" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الوصف القصير</FormLabel>
                                                    <FormControl><Textarea placeholder="وصف موجز يظهر تحت عنوان المنتج" {...field} rows={2}/></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الوصف الطويل</FormLabel>
                                                    <FormControl><Textarea placeholder="وصف تفصيلي جذاب للمنتج" {...field} rows={5} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            
                                            <div className="space-y-4">
                                                <Label>مواصفات المنتج</Label>
                                                {featureFields.map((field, index) => (
                                                    <div key={field.id} className="flex items-start gap-2">
                                                        <FormField control={form.control} name={`specifications.${index}.value`} render={({ field }) => (
                                                             <FormItem className="flex-1"><FormControl><Input placeholder="الوصف (مثال: يدوية أصيلة)" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`specifications.${index}.name`} render={({ field }) => (
                                                            <FormItem className="flex-1"><FormControl><Input placeholder="الميزة (مثال: صناعة)" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" size="sm" onClick={() => appendFeature({ name: '', value: '' })}>
                                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                                    إضافة ميزة
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="media">
                                    <Card>
                                         <CardHeader>
                                             <CardTitle>وسائط المنتج</CardTitle>
                                         </CardHeader>
                                         <CardContent className="space-y-4">
                                              <div className="space-y-4">
                                                  <Label>صور المنتج</Label>
                                                   <FormDescription>الأبعاد الموصى بها: 800x800 بكسل.</FormDescription>
                                                   {imageFields.map((field, index) => (
                                                      <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2 p-2 border rounded-md">
                                                        <FormField control={form.control} name={`images.${index}.src`} render={({ field }) => (
                                                            <FormItem><FormControl><Input placeholder="رابط الصورة" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`images.${index}.alt`} render={({ field }) => (
                                                            <FormItem><FormControl><Input placeholder="نص بديل (Alt Text)" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                      </div>
                                                  ))}
                                                  <Button type="button" variant="outline" size="sm" onClick={() => appendImage({ src: '', alt: '' })}>
                                                     <PlusCircle className="mr-2 h-4 w-4"/>
                                                     إضافة صورة
                                                  </Button>
                                                  <FormMessage>{form.formState.errors.images?.message}</FormMessage>
                                              </div>
                                               <FormField control={form.control} name="videoUrl" render={({ field }) => (
                                                    <FormItem className="pt-4">
                                                        <FormLabel>رابط فيديو (اختياري)</FormLabel>
                                                        <FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                         </CardContent>
                                     </Card>
                                 </TabsContent>
                                 <TabsContent value="variants">
                                     <Card>
                                         <CardHeader>
                                             <CardTitle>متغيرات المنتج</CardTitle>
                                             <FormField control={form.control} name="hasVariants" render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2 mt-2">
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    <Label>هذا المنتج له متغيرات</Label>
                                                </FormItem>
                                            )} />
                                         </CardHeader>
                                         <CardContent>
                                            {!hasVariants ? (
                                                <FormField control={form.control} name="totalStock" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>إجمالي المخزون</FormLabel>
                                                        <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            ) : (
                                                 <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>اللون</TableHead>
                                                            <TableHead>رمز اللون</TableHead>
                                                            <TableHead>المقاس</TableHead>
                                                            <TableHead>الكمية</TableHead>
                                                            <TableHead><span className="sr-only"></span></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {variantFields.map((field, index) => (
                                                            <TableRow key={field.id}>
                                                                <TableCell>
                                                                    <FormField control={form.control} name={`variants.${index}.color`} render={({ field }) => (
                                                                        <FormItem><FormControl><Input placeholder="أزرق" {...field} /></FormControl><FormMessage /></FormItem>
                                                                    )} />
                                                                </TableCell>
                                                                 <TableCell>
                                                                    <FormField control={form.control} name={`variants.${index}.colorCode`} render={({ field }) => (
                                                                        <FormItem><FormControl><Input placeholder="#0000FF" {...field} /></FormControl><FormMessage /></FormItem>
                                                                    )} />
                                                                </TableCell>
                                                                <TableCell>
                                                                     <FormField control={form.control} name={`variants.${index}.size`} render={({ field }) => (
                                                                        <FormItem><FormControl><Input placeholder="M" {...field} /></FormControl><FormMessage /></FormItem>
                                                                    )} />
                                                                </TableCell>
                                                                <TableCell>
                                                                     <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (
                                                                        <FormItem><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                                                                    )} />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                             {hasVariants && <Button type="button" variant="outline" className="mt-4" onClick={() => appendVariant({ color: '', colorCode: '', size: '', stock: 0 })}>إضافة متغير جديد</Button>}
                                         </CardContent>
                                     </Card>
                                 </TabsContent>
                                <TabsContent value="seo">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>تحسين محركات البحث (SEO)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                             <FormField control={form.control} name="slug" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الاسم اللطيف (Slug)</FormLabel>
                                                    <FormControl><Input placeholder="blue-kaftan" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="metaTitle" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>عنوان Meta</FormLabel>
                                                    <FormControl><Input placeholder="عنوان يظهر في نتائج البحث" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="metaDescription" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>وصف Meta</FormLabel>
                                                    <FormControl><Textarea placeholder="وصف قصير وجذاب لمحركات البحث." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle>تنظيم المنتج</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField control={form.control} name="categoryId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الفئة</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger disabled={isLoading}>
                                                        <SelectValue placeholder={isLoading ? 'جاري التحميل...' : 'اختر فئة أو صفحة للمنتج'} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoading ? (
                                                        <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin"/></div>
                                                    ) : (
                                                        <>
                                                            <Label className="px-2 text-xs text-muted-foreground">الفئات</Label>
                                                            {categories.map(cat => (
                                                                <SelectItem key={`cat-${cat.id}`} value={cat.id}>{cat.name}</SelectItem>
                                                            ))}
                                                            {dynamicPages.length > 0 && (
                                                                <>
                                                                    <Label className="px-2 pt-2 text-xs text-muted-foreground">الصفحات الديناميكية</Label>
                                                                    {dynamicPages.map(page => (
                                                                        <SelectItem key={`page-${page.id}`} value={page.id}>{page.title}</SelectItem>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="sku" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>رمز المنتج (SKU)</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>السعر (DH)</FormLabel>
                                            <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                   <CardTitle>الإجراءات</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2">
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج'}
                                        </Button>
                                        <Button variant="outline" type="button" onClick={() => form.reset()}>إلغاء</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </form>
        </Form>
    )
}
