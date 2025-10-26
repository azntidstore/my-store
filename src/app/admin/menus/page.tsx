
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { MenuItem, MenuLocation, Page, Category, Product } from '@/lib/types';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, GripVertical, CornerDownRight, Eye, EyeOff } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ----------- FORM SCHEMA AND COMPONENT START -----------

const menuItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'العنوان مطلوب.'),
  type: z.enum(['page', 'category', 'custom', 'product']),
  value: z.string().min(1, 'الرابط أو القيمة مطلوبة.'),
  order: z.coerce.number().default(0),
  location: z.enum(['header', 'footer-col-1', 'footer-col-2']),
  parentId: z.string().optional().nullable(),
  status: z.enum(['active', 'hidden']).default('active'),
  is_indexed: z.boolean().default(true),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
    menuItem?: MenuItem;
    allItems: MenuItem[];
    onSave: (data: MenuItemFormData) => Promise<void>;
    onDone: () => void;
    pages: Page[];
    categories: Category[];
    products: Product[];
}

function MenuForm({ menuItem, allItems, onSave, onDone, pages, categories, products }: MenuFormProps) {
    
    const form = useForm<MenuItemFormData>({
        resolver: zodResolver(menuItemSchema),
        defaultValues: menuItem ? {
            ...menuItem,
            parentId: menuItem.parentId || undefined,
        } : { 
            title: '', 
            type: 'page', 
            value: '',
            order: 0,
            location: 'header', 
            parentId: undefined, 
            status: 'active', 
            is_indexed: true,
            meta_title: '',
            meta_description: '' 
        },
    });

    const { isSubmitting, watch, setValue } = form;
    const itemType = watch('type');
    const menuLocation = watch('location');

    useEffect(() => {
        if(menuItem) {
           form.reset(menuItem);
        }
    }, [menuItem, form])

    const handleDestinationChange = (destinationValue: string) => {
        if (!destinationValue) return;
        
        const [type, slug] = destinationValue.split(/_(.*)/s);

        if (slug) {
            setValue('value', slug);
            if (menuItem) return; // Don't auto-fill title when editing

            let selectedItemTitle = '';
            if (slug === '/') {
                selectedItemTitle = 'الرئيسية';
            } else if (type === 'page') {
                selectedItemTitle = pages.find(p => p.slug === slug)?.title || '';
            } else if (type === 'category') {
                selectedItemTitle = categories.find(c => c.slug === slug)?.name || '';
            } else if (type === 'product') {
                selectedItemTitle = products.find(p => p.slug === slug)?.title || '';
            }
            if (selectedItemTitle) {
                setValue('title', selectedItemTitle);
            }
        }
    };


    const handleFormSubmit = async (data: MenuItemFormData) => {
        await onSave(data);
        onDone();
    };
  
    const possibleParents = allItems.filter(item => !item.parentId && item.location === menuLocation && item.id !== menuItem?.id);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>اسم القائمة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>نوع الرابط</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                if(!menuItem) setValue('value', ''); 
                            }} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="page">صفحة</SelectItem>
                                    <SelectItem value="category">فئة</SelectItem>
                                    <SelectItem value="product">منتج</SelectItem>
                                    <SelectItem value="custom">رابط مخصص</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                {itemType !== 'custom' && (
                   <FormItem>
                        <FormLabel>اختر وجهة</FormLabel>
                        <Select onValueChange={handleDestinationChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر وجهة لتعبئة الرابط تلقائياً..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {itemType === 'page' && <SelectItem value="page_/">الرئيسية</SelectItem>}
                                {itemType === 'page' && pages.map(p => <SelectItem key={p.id} value={`page_${p.slug}`}>{p.title}</SelectItem>)}
                                {itemType === 'category' && categories.map(c => <SelectItem key={c.id} value={`category_${c.slug}`}>{c.name}</SelectItem>)}
                                {itemType === 'product' && products.map(p => <SelectItem key={p.id} value={`product_${p.slug}`}>{p.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}

                <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem>
                        <FormLabel>الرابط (Slug) / القيمة</FormLabel>
                        <FormControl><Input dir="ltr" className="text-left" {...field} placeholder={itemType === 'custom' ? 'https://example.com' : 'about-us'} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>مكان الظهور</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="footer-col-1">Footer (Column 1)</SelectItem>
                        <SelectItem value="footer-col-2">Footer (Column 2)</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="parentId" render={({ field }) => (
                    <FormItem><FormLabel>القائمة الأب (اختياري)</FormLabel><Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value ?? 'none'}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                        <SelectItem value="none">-- قائمة رئيسية --</SelectItem>
                        {possibleParents.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                    )} />
                </div>
                
                <div className="border p-4 rounded-md space-y-4">
                     <h3 className="text-md font-semibold">إعدادات SEO (اختياري)</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="hidden">مخفي</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="is_indexed" render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                                <FormLabel className="mb-3">السماح بالأرشفة</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="meta_title" render={({ field }) => (
                        <FormItem><FormLabel>عنوان Meta</FormLabel><FormControl><Input placeholder="عنوان SEO للقائمة" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="meta_description" render={({ field }) => (
                        <FormItem><FormLabel>وصف Meta</FormLabel><FormControl><Textarea placeholder="وصف SEO للقائمة" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

// ----------- FORM SCHEMA AND COMPONENT END -----------


function MenuItemRow({ item, level = 0, onEdit, onDelete, className }: { item: MenuItem, level?: number, onEdit: (item: MenuItem) => void, onDelete: (id: string) => void, className?: string }) {
    return (
        <Reorder.Item 
            key={item.id} 
            value={item}
            className={cn("bg-background rounded-md", className)}
        >
            <div className="flex items-center p-2 hover:bg-muted/50 rounded-md">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab"/>
                <div style={{ paddingRight: `${level * 2}rem` }} className="flex-1 font-medium flex items-center">
                    {level > 0 && <CornerDownRight className="h-4 w-4 ml-2 text-muted-foreground" />}
                    {item.title}
                </div>
                <div className="text-sm text-muted-foreground truncate max-w-[150px]">{item.value}</div>
                <div className="flex items-center gap-2 mx-4">
                  <Badge variant={item.status === 'active' ? 'default' : 'destructive'}>
                     {item.status === 'active' ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                     {item.status === 'active' ? 'نشط' : 'مخفي'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            </div>
        </Reorder.Item>
    );
}


function MenuList({ items, onReorder, onEdit, onDelete, level = 0 }: { items: MenuItem[], onReorder: (newOrder: MenuItem[]) => void, onEdit: (item: MenuItem) => void, onDelete: (id: string) => void, level?: number }) {
    return (
        <Reorder.Group axis="y" values={items} onReorder={onReorder} className="space-y-1" style={{ paddingLeft: level > 0 ? '20px' : '0px' }}>
            {items.map((item, index) => (
                <div key={item.id}>
                    <MenuItemRow 
                        item={item} 
                        level={level} 
                        onEdit={onEdit} 
                        onDelete={onDelete}
                        className={cn(index % 2 === 0 ? 'bg-muted/50' : '')}
                    />
                    {item.children && item.children.length > 0 && (
                        <MenuList 
                            items={item.children}
                            onReorder={(newChildOrder) => {
                                const newParentOrder = items.map(parentItem => 
                                    parentItem.id === item.id ? { ...parentItem, children: newChildOrder } : parentItem
                                );
                                onReorder(newParentOrder);
                            }}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </Reorder.Group>
    );
}


export default function AdminMenusPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<MenuLocation>('header');
  const [formKey, setFormKey] = useState(0); 

  // --- Data Fetching ---
  const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menus'), orderBy('order')) : null, [firestore]);
  const { data: menuItems, isLoading: loadingMenus } = useCollection<MenuItem>(menuQuery);

  const pagesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'pages'), orderBy('title')) : null, [firestore]);
  const { data: pages, isLoading: loadingPages } = useCollection<Page>(pagesQuery);
  
  const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories'), orderBy('name')) : null, [firestore]);
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), orderBy('title')) : null, [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);
  
  const isDataLoading = loadingMenus || loadingPages || loadingCategories || loadingProducts;
  
  const menuTree = useMemo(() => {
    if (!menuItems) return [];
    const itemsForTab = menuItems.filter(item => item.location === activeTab);
    const itemMap = new Map(itemsForTab.map(item => [item.id, { ...item, children: [] as MenuItem[] }]));
    const tree: MenuItem[] = [];

    itemMap.forEach(item => {
        if (item.parentId && itemMap.has(item.parentId)) {
            itemMap.get(item.parentId)?.children.push(item);
        } else {
            tree.push(item);
        }
    });

    // Sort children recursively
    const sortChildren = (items: MenuItem[]) => {
        items.sort((a, b) => a.order - b.order);
        items.forEach(item => {
            if (item.children) {
                sortChildren(item.children);
            }
        });
    }
    sortChildren(tree);
    
    return tree;
  }, [menuItems, activeTab]);

  const handleOpenEdit = (item: MenuItem) => {
    setEditingMenuItem(item);
    setFormKey(prev => prev + 1); // Change key to force re-mount
    setIsFormOpen(true);
  };
  
  const handleOpenAdd = () => {
    setEditingMenuItem(undefined);
    setFormKey(prev => prev + 1); // Change key to force re-mount
    setIsFormOpen(true);
  };

  const handleSaveMenuItem = async (data: MenuItemFormData) => {
    if (!firestore) return;

    try {
         const payload = {
            ...data,
            parentId: data.parentId === 'none' || data.parentId === undefined ? null : data.parentId,
        };

        if (editingMenuItem?.id) {
            const itemRef = doc(firestore, 'menus', editingMenuItem.id);
            await updateDoc(itemRef, { ...payload, updatedAt: serverTimestamp() });
            toast({ title: 'نجاح', description: 'تم تحديث القائمة.' });
        } else {
            const currentItems = menuItems?.filter(i => i.location === data.location && !i.parentId) || [];
            payload.order = data.order === 0 ? currentItems.length : data.order;
            await addDoc(collection(firestore, 'menus'), { ...payload, createdAt: serverTimestamp() });
            toast({ title: 'نجاح', description: 'تم إنشاء القائمة.' });
        }
        setIsFormOpen(false);
    } catch (err) {
        console.error("Error saving menu item:", err);
        toast({ title: 'خطأ', description: 'فشل حفظ القائمة.', variant: 'destructive' });
    }
  };


  const handleDeleteMenuItem = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'menus', id));
      toast({ title: 'نجاح', description: 'تم حذف القائمة.' });
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل حذف القائمة.', variant: 'destructive' });
    }
  };
  
  const handleReorder = async (newOrder: MenuItem[]) => {
    if (!firestore || !menuItems) return;
    
    const batch = writeBatch(firestore);
    
    newOrder.forEach((item, index) => {
        const itemRef = doc(firestore, 'menus', item.id);
        batch.update(itemRef, { order: index });
    });

    try {
        await batch.commit();
        toast({ title: 'نجاح', description: 'تم تحديث ترتيب القوائم.' });
    } catch (err) {
        console.error("Reorder failed: ", err);
        toast({ title: 'خطأ', description: 'فشل تحديث الترتيب.', variant: 'destructive' });
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة القوائم</h2>
          <p className="text-muted-foreground">إنشاء وتعديل قوائم التنقل في متجرك.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> إضافة قائمة
            </Button>
          </DialogTrigger>
          {isFormOpen && (
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>{editingMenuItem ? 'تعديل القائمة' : 'إنشاء قائمة جديدة'}</DialogTitle></DialogHeader>
              {isDataLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <MenuForm 
                    key={formKey} // Force re-mount with new key
                    menuItem={editingMenuItem} 
                    allItems={menuItems || []}
                    onSave={handleSaveMenuItem}
                    onDone={() => setIsFormOpen(false)}
                    pages={pages || []}
                    categories={categories || []}
                    products={products || []}
                />
              )}
            </DialogContent>
          )}
        </Dialog>
      </div>
      
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MenuLocation)} className="w-full">
            <TabsList>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="footer-col-1">Footer (Column 1)</TabsTrigger>
                <TabsTrigger value="footer-col-2">Footer (Column 2)</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} asChild>
                  <Card>
                    <CardHeader>
                      <CardTitle>قائمة: {activeTab}</CardTitle>
                      <CardDescription>اسحب وأفلت لترتيب القوائم.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingMenus ? (
                        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                      ) : (
                        <MenuList
                            items={menuTree}
                            onReorder={handleReorder}
                            onEdit={handleOpenEdit}
                            onDelete={handleDeleteMenuItem}
                        />
                      )}
                       {!loadingMenus && menuTree.length === 0 && <p className="text-center text-muted-foreground p-8">لا توجد قوائم في هذا الموقع.</p>}
                    </CardContent>
                  </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
