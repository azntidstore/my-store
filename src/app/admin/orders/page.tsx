
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useFirestore } from '@/firebase';
import { collection, orderBy, query, onSnapshot } from 'firebase/firestore';
import type { Order, OrderStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, User, Calendar, DollarSign, Truck, Package, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import OrderStatusBadge from '@/components/admin/order-status-badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';


const getStatusClassNames = (status: OrderStatus) => {
    switch (status) {
        case 'pending':
            return 'border-yellow-500';
        case 'confirmed':
            return 'border-blue-500';
        case 'shipped':
            return 'border-indigo-500';
        case 'delivered':
            return 'border-green-500';
        case 'cancelled':
            return 'border-red-500';
        default:
            return 'border-transparent';
    }
};


function OrderRow({ order }: { order: Order }) {
    const statusClass = getStatusClassNames(order.status);

    return (
        <Collapsible asChild>
            <Card className="overflow-hidden">
                 <div className={cn("flex w-full", statusClass)}>
                    <div className={cn("w-1.5", 
                        statusClass.replace('border-', 'bg-')
                    )}></div>
                    <div className="flex-grow">
                        <CollapsibleTrigger asChild>
                            <div className="flex flex-wrap items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4 mb-2 md:mb-0">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span className="font-semibold text-foreground">{order.shippingAddress.name}</span>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                        <span className="font-bold text-lg text-foreground">{order.total.toFixed(2)} DH</span>
                                    </div>
                                    <OrderStatusBadge orderId={order.id} currentStatus={order.status} />
                                    <ChevronDown className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                             <div className="p-6 bg-muted/30 border-t">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Order Items */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 font-semibold">
                                            <Package className="w-5 h-5 text-primary" />
                                            المنتجات المطلوبة
                                        </h4>
                                        <div className="space-y-3">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex items-center gap-4 text-sm">
                                                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                                        <Image 
                                                            src={item.image || placeholderImages.products.placeholder} 
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                         />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-muted-foreground">
                                                            <span>{item.quantity} x {item.price.toFixed(2)} DH</span>
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold">{(item.quantity * item.price).toFixed(2)} DH</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Shipping Details */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 font-semibold">
                                            <Truck className="w-5 h-5 text-primary" />
                                            تفاصيل الشحن
                                        </h4>
                                        <div className="text-sm space-y-2 p-4 bg-background rounded-md">
                                             <p><strong>الاسم:</strong> {order.shippingAddress.name}</p>
                                             <p><strong>الهاتف:</strong> {order.shippingAddress.phone}</p>
                                             <p><strong>المدينة:</strong> {order.shippingAddress.city}</p>
                                             <p><strong>العنوان:</strong> {order.shippingAddress.address}</p>
                                             <p><strong>تكلفة الشحن:</strong> {(order.shippingCost ?? 0).toFixed(2)} DH</p>
                                             <p><strong>طريقة الدفع:</strong> {order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </CollapsibleContent>
                    </div>
                </div>
            </Card>
        </Collapsible>
    )
}


export default function AdminOrdersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const ordersQuery = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoading(false);
    }, (error) => {
        toast({ title: "خطأ", description: "فشل تحميل الطلبات.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
       <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">الطلبات</h2>
                <p className="text-muted-foreground">
                    عرض وتتبع جميع الطلبات التي تم إجراؤها في متجرك.
                </p>
            </div>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
          <CardDescription>
            إجمالي {orders?.length || 0} طلب.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
           ) : (
             <div className="space-y-4">
                {orders && orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                ))}
             </div>
           )}
           {!loading && orders && orders.length === 0 && (
                <div className="text-center p-12 text-muted-foreground">
                    لا توجد طلبات لعرضها.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
