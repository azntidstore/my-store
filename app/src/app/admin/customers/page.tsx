'use client';
import { useMemo, useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
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
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CustomerData {
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const ordersQuery = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoading(false);
    }, (error) => {
        toast({ title: "خطأ", description: "فشل في تحميل بيانات العملاء.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const uniqueCustomers = useMemo(() => {
    if (!orders) return [];

    const customersMap = new Map<string, CustomerData>();

    orders.forEach(order => {
      const phone = order.shippingAddress.phone;
      if (!phone) return; // Skip if no phone number

      if (customersMap.has(phone)) {
        // Update existing customer data
        const existingCustomer = customersMap.get(phone)!;
        existingCustomer.orderCount += 1;
        existingCustomer.totalSpent += order.total;
        // Optionally update name if a newer order has a different one, though unlikely
        existingCustomer.name = order.shippingAddress.name; 
      } else {
        // Add new customer
        customersMap.set(phone, {
          phone: phone,
          name: order.shippingAddress.name,
          orderCount: 1,
          totalSpent: order.total,
        });
      }
    });

    return Array.from(customersMap.values());
  }, [orders]);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">العملاء</h2>
          <p className="text-muted-foreground">
            عرض وإدارة قائمة عملائك.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
          <CardDescription>
            إجمالي {uniqueCustomers.length} عميل فريد.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : uniqueCustomers.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
               <Users className="mx-auto h-12 w-12 mb-4" />
              لا يوجد عملاء لعرضهم.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>عدد الطلبات</TableHead>
                  <TableHead className="text-left">إجمالي الإنفاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueCustomers.map((customer, index) => (
                  <TableRow key={customer.phone} className={cn(index % 2 === 0 ? 'bg-muted/50' : '')}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{customer.orderCount}</Badge>
                    </TableCell>
                    <TableCell className="text-left font-semibold">{customer.totalSpent.toFixed(2)} DH</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
