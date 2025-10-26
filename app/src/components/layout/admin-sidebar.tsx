
'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';
import {Logo} from '@/components/icons';
import {LayoutDashboard, Package, ShoppingCart, Users, LogOut, MessageSquare, Boxes, Fingerprint, Paintbrush, RectangleEllipsis, Columns, Book, ListOrdered, Link2, Presentation, Truck, Wand2} from 'lucide-react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import type { User as AppUser, Order, Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SUPER_ADMIN_EMAIL = "ouaddou.abdellah.topo@gmail.com";

const allMenuItems = [
  {id: 'dashboard', href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard},
  {id: 'products', href: '/admin/products', label: 'المنتجات', icon: Package},
  {id: 'categories', href: '/admin/categories', label: 'الفئات', icon: Book},
  {id: 'stock', href: '/admin/stock', label: 'المخزون', icon: Boxes},
  {id: 'orders', href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart, notificationKey: 'pendingOrders'},
  {id: 'customers', href: '/admin/customers', label: 'العملاء', icon: Users},
  {id: 'messages', href: '/admin/messages', label: 'الرسائل', icon: MessageSquare, notificationKey: 'unreadMessages'},
  {id: 'shipping', href: '/admin/shipping', label: 'الشحن', icon: Truck},
  {id: 'pages', href: '/admin/pages', label: 'الصفحات', icon: Columns},
  {id: 'landing-page-generator', href: '/admin/landing-page-generator', label: 'مولد الصفحات', icon: Presentation},
  {id: 'menus', href: '/admin/menus', label: 'إدارة القوائم', icon: RectangleEllipsis}, 
  {id: 'identity', href: '/admin/identity', label: 'هوية المتجر', icon: Fingerprint},
  {id: 'appearance', href: '/admin/appearance', label: 'المظهر', icon: Paintbrush},
  {id: 'integrations', href: '/admin/integrations', label: 'التكاملات', icon: Link2},
  {id: 'sidebar-order', href: '/admin/sidebar-order', label: 'ترتيب القائمة', icon: ListOrdered},
  {id: 'users', href: '/admin/users', label: 'المستخدمون', icon: Users, adminOnly: true},
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const [sidebarOrder, setSidebarOrder] = useState<{order: string[]}|null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);

  useEffect(() => {
    if(!firestore) return;
    
    const sidebarOrderRef = doc(firestore, 'settings', 'sidebarOrder');
    const unsubOrder = onSnapshot(sidebarOrderRef, (doc) => {
        setSidebarOrder(doc.data() as {order: string[]});
    });

    const ordersQuery = query(collection(firestore, 'orders'), where('status', '==', 'pending'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
        setPendingOrders(snapshot.docs.map(d => d.data() as Order));
    });

    const messagesQuery = query(collection(firestore, 'messages'), where('status', '==', 'unread'));
    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        setUnreadMessages(snapshot.docs.map(d => d.data() as Message));
    });

    return () => {
        unsubOrder();
        unsubOrders();
        unsubMessages();
    }
  }, [firestore]);
  
  const notificationCounts = useMemo(() => ({
      pendingOrders: pendingOrders?.length || 0,
      unreadMessages: unreadMessages?.length || 0,
  }), [pendingOrders, unreadMessages]);

  const menuItems = useMemo(() => {
    let availableItems = allMenuItems.filter(item => !item.adminOnly || isSuperAdmin);
    
    if (sidebarOrder && sidebarOrder.order) {
        const orderedItems = sidebarOrder.order
            .map(id => availableItems.find(item => item.id === id))
            .filter((item): item is typeof availableItems[0] => !!item);
        
        const newItems = availableItems.filter(item => !sidebarOrder.order.includes(item.id));
        return [...orderedItems, ...newItems];
    }
    
    return availableItems;
}, [sidebarOrder, isSuperAdmin]);


  const handleSignOut = async () => {
    try {
      if (!auth) return;
      await signOut(auth);
      toast({
        title: "تم تسجيل الخروج",
        description: "لقد خرجت من حسابك بنجاح.",
      });
      router.replace('/admin/login');
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link href="/admin">
            <Logo />
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(item => {
            const count = item.notificationKey ? notificationCounts[item.notificationKey as keyof typeof notificationCounts] : 0;
            const isActive = pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin')
            return (
              <SidebarMenuItem key={item.href}>
                 <Card className={cn(
                    "bg-background/50 shadow-sm transition-all duration-300",
                    "hover:scale-105 hover:shadow-md",
                    isActive && "scale-105 shadow-lg bg-background"
                  )}>
                   <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={{children: item.label, side: 'left'}}
                      className="justify-start"
                    >
                      <item.icon />
                      <span className="flex-grow text-right">{item.label}</span>
                      {count > 0 && (
                          <Badge className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 transition-all duration-300",
                            "group-data-[state=collapsed]:h-5 group-data-[state=collapsed]:w-5"
                          )}>
                            {count}
                          </Badge>
                      )}
                    </SidebarMenuButton>
                  </Link>
                 </Card>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip={{children: 'تسجيل الخروج', side: 'left'}}>
                    <LogOut/>
                    <span>تسجيل الخروج</span>
                </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/">
                <SidebarMenuButton tooltip={{children: 'العودة للمتجر', side: 'left'}}>
                    <span>العودة للمتجر</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
