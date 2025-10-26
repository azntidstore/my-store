'use client';
import { useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {DollarSign, Package, Users, ShoppingCart, Activity, Loader2} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Order, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';


const chartConfig = {
  sales: {
    label: 'المبيعات (DH)',
    color: 'hsl(var(--primary))',
  },
};


export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    
    const ordersQuery = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    const productsQuery = query(collection(firestore, 'products'));

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoadingOrders(false);
    }, (error) => {
        console.error("Error fetching orders: ", error);
        toast({ title: "خطأ", description: "فشل تحميل الطلبات.", variant: "destructive"});
        setLoadingOrders(false);
    });

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoadingProducts(false);
    }, (error) => {
        console.error("Error fetching products: ", error);
        toast({ title: "خطأ", description: "فشل تحميل المنتجات.", variant: "destructive"});
        setLoadingProducts(false);
    });

    return () => {
        unsubOrders();
        unsubProducts();
    };
  }, [firestore, toast]);
  
  const stats = useMemo(() => {
    if (!orders || !products) {
      return {
        totalRevenue: 0,
        revenueLastMonth: 0,
        totalOrders: 0,
        newOrdersLast30Days: 0,
        totalCustomers: 0,
        newCustomersLast30Days: 0,
        totalStock: 0,
        salesData: [],
        bestSellingProducts: [],
      };
    }

    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);

    // Filter delivered orders
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((acc, order) => acc + order.total, 0);

    // Calculate revenue percentage change
    const revenueLastMonth = deliveredOrders
        .filter(o => o.createdAt.toDate() < oneMonthAgo)
        .reduce((acc, o) => acc + o.total, 0);
    
    // New Orders
    const newOrdersLast30Days = orders.filter(o => o.createdAt.toDate() > oneMonthAgo).length;
    const oldOrdersCount = orders.length - newOrdersLast30Days;
    
    // New Customers
    const thirtyDaysAgo = subMonths(now, 30);
    const uniqueCustomers = new Set(orders.map(o => o.shippingAddress.phone));
    const newCustomersSet = new Set(orders.filter(o => o.createdAt.toDate() > thirtyDaysAgo).map(o => o.shippingAddress.phone));

    // Total Stock
    const totalStock = products.reduce((acc, product) => acc + (product.totalStock || 0), 0);
    
    // Sales chart data for the last 6 months
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const monthInterval = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
    
    const salesData = monthInterval.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthSales = deliveredOrders
            .filter(o => {
                const orderDate = o.createdAt.toDate();
                return orderDate >= monthStart && orderDate <= monthEnd;
            })
            .reduce((acc, o) => acc + o.total, 0);
        return {
            month: format(monthStart, 'MMM', { locale: ar }),
            sales: monthSales,
        };
    });

    // Best selling products
    const productSales: Record<string, { product: Product; sales: number }> = {};
    deliveredOrders.forEach(order => {
        order.items.forEach(item => {
            if (productSales[item.productId]) {
                productSales[item.productId].sales += item.quantity;
            } else {
                 const product = products.find(p => p.id === item.productId);
                 if(product) {
                    productSales[item.productId] = { product: product, sales: item.quantity };
                 }
            }
        });
    });

    const bestSellingProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map(item => ({
            name: item.product.title,
            sales: item.sales,
            image: item.product.images[0]?.src || placeholderImages.products.placeholder,
            hint: item.product.title.split(' ').slice(0, 2).join(' '),
        }));


    return {
        totalRevenue,
        revenueLastMonth,
        totalOrders: orders.length,
        newOrdersLast30Days,
        oldOrdersCount,
        totalCustomers: uniqueCustomers.size,
        newCustomersLast30Days: newCustomersSet.size,
        totalStock,
        salesData,
        bestSellingProducts,
    }

  }, [orders, products]);
  
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return change;
  }
  
  const revenueChange = getPercentageChange(stats.totalRevenue - stats.revenueLastMonth, stats.revenueLastMonth);
  const ordersChange = getPercentageChange(stats.newOrdersLast30Days, stats.oldOrdersCount);
  const customersChange = getPercentageChange(stats.newCustomersLast30Days, stats.totalCustomers - stats.newCustomersLast30Days);

  const isLoading = loadingOrders || loadingProducts;
  
  if (isLoading) {
    return <div className="flex-1 space-y-6 p-8 pt-6 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">لوحة التحكم</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} DH</div>
             {revenueChange !== 0 && (
                <p className="text-xs text-muted-foreground">
                    {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}% من الشهر الماضي
                </p>
             )}
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات الجديدة</CardTitle>
            <ShoppingCart className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newOrdersLast30Days}</div>
             {ordersChange !== 0 && (
                <p className="text-xs text-muted-foreground">
                    {ordersChange > 0 ? '+' : ''}{ordersChange.toFixed(1)}% من الشهر الماضي
                </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء الجدد</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newCustomersLast30Days}</div>
             {customersChange !== 0 && (
                 <p className="text-xs text-muted-foreground">
                    {customersChange > 0 ? '+' : ''}{customersChange.toFixed(1)}% من الشهر الماضي
                </p>
             )}
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات في المخزون</CardTitle>
            <Package className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock}</div>
            <p className="text-xs text-muted-foreground">إجمالي المنتجات المتاحة</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات</CardTitle>
            <CardDescription>
              إجمالي المبيعات (للطلبات المكتملة) خلال الستة أشهر الماضية.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart
                  data={stats.salesData}
                  margin={{
                    top: 5,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tickFormatter={(value) => `${value / 1000}K`}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="var(--color-sales)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>المنتجات الأكثر مبيعًا</CardTitle>
                <CardDescription>
                أفضل 5 منتجات مبيعًا هذا الشهر.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {stats.bestSellingProducts.map((product, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                                <Image 
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={product.hint}
                                    sizes="48px"
                                />
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-sm truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.sales} مبيعة</p>
                            </div>
                            <div className="font-bold text-sm text-primary">#{index + 1}</div>
                        </div>
                    ))}
                     {stats.bestSellingProducts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات مبيعات كافية.</p>
                    )}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
