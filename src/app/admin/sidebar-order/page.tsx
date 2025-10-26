'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GripVertical, ListOrdered, LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, Boxes, Fingerprint, Paintbrush, RectangleEllipsis, Columns, Book, Link2, Presentation, Truck, Wand2 } from 'lucide-react';
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Icon as LucideIcon } from 'lucide-react';

const SUPER_ADMIN_EMAIL = "ouaddou.abdellah.topo@gmail.com";

const allMenuItems: { id: string; label: string; icon: LucideIcon; adminOnly?: boolean; href: string; }[] = [
  {id: 'dashboard', href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard},
  {id: 'products', href: '/admin/products', label: 'المنتجات', icon: Package},
  {id: 'categories', href: '/admin/categories', label: 'الفئات', icon: Book},
  {id: 'stock', href: '/admin/stock', label: 'المخزون', icon: Boxes},
  {id: 'orders', href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart},
  {id: 'customers', href: '/admin/customers', label: 'العملاء', icon: Users},
  {id: 'messages', href: '/admin/messages', label: 'الرسائل', icon: MessageSquare},
  {id: 'shipping', href: '/admin/shipping', label: 'الشحن', icon: Truck },
  {id: 'pages', href: '/admin/pages', label: 'الصفحات', icon: Columns},
  {id: 'landing-pages', href: '/admin/landing-pages', label: 'صفحات الهبوط', icon: Presentation},
  {id: 'menus', href: '/admin/menus', label: 'إدارة القوائم', icon: RectangleEllipsis}, 
  {id: 'identity', href: '/admin/identity', label: 'هوية المتجر', icon: Fingerprint},
  {id: 'appearance', href: '/admin/appearance', label: 'المظهر', icon: Paintbrush},
  {id: 'integrations', href: '/admin/integrations', label: 'التكاملات', icon: Link2},
  {id: 'sidebar-order', href: '/admin/sidebar-order', label: 'ترتيب القائمة', icon: ListOrdered},
  {id: 'users', href: '/admin/users', label: 'المستخدمون', icon: Users, adminOnly: true},
];

export default function AdminSidebarOrderPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [orderedItems, setOrderedItems] = useState<typeof allMenuItems>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sidebarOrderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'sidebarOrder');
  }, [firestore]);

  const { data: sidebarOrderData, isLoading, error } = useDoc<{order: string[]}>(sidebarOrderRef);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const availableItems = useMemo(() => {
      return allMenuItems.filter(item => !item.adminOnly || isSuperAdmin);
  }, [isSuperAdmin]);


  useEffect(() => {
    if (!isLoading) {
        if (sidebarOrderData?.order) {
            const savedOrder = sidebarOrderData.order;
            const currentItemsMap = new Map(availableItems.map(item => [item.id, item]));

            const newOrderedItems = savedOrder
                .map(id => currentItemsMap.get(id))
                .filter((item): item is typeof allMenuItems[0] => !!item);
            
            // Add any new items that weren't in the saved order to the end
            const newItems = availableItems.filter(item => !savedOrder.includes(item.id));
            setOrderedItems([...newOrderedItems, ...newItems]);
        } else {
            // Set default order if no order is saved in the DB
            setOrderedItems(availableItems);
        }
    }
  }, [sidebarOrderData, isLoading, availableItems]);


  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل ترتيب القائمة.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSaveChanges = async () => {
    if (!sidebarOrderRef) return;
    setIsSaving(true);
    try {
        const orderIds = orderedItems.map(item => item.id);
        await setDoc(sidebarOrderRef, { order: orderIds });
        toast({
            title: "تم الحفظ بنجاح",
            description: "تم تحديث ترتيب القائمة الجانبية.",
        });
    } catch (err) {
        console.error("Error saving sidebar order: ", err);
        toast({
            title: "خطأ",
            description: "فشل حفظ الترتيب. الرجاء المحاولة مرة أخرى.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">ترتيب القائمة الجانبية</h2>
          <p className="text-muted-foreground">قم بسحب وإفلات الأقسام لإعادة ترتيبها في لوحة التحكم.</p>
        </div>
         <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            حفظ الترتيب
         </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>أقسام لوحة التحكم</CardTitle>
          <CardDescription>اسحب المقبض <GripVertical className="inline-block h-4 w-4" /> لإعادة الترتيب.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Reorder.Group axis="y" values={orderedItems} onReorder={setOrderedItems}>
                <div className="divide-y">
                    {orderedItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                             <Reorder.Item key={item.id} value={item}>
                                 <div className={cn("flex items-center p-4 hover:bg-muted/50", index % 2 === 0 ? 'bg-muted/50' : '')}>
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mr-4"/>
                                    <Icon className="h-5 w-5 text-muted-foreground mr-4"/>
                                    <div className="flex-1 font-medium">{item.label}</div>
                                </div>
                            </Reorder.Item>
                        )
                    })}
                </div>
            </Reorder.Group>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
