'use client';
import { useMemo, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/types";
import { Loader2, Edit, AlertTriangle, ArchiveX, Boxes, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from "firebase/firestore";
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import placeholderImages from '@/lib/placeholder-images.json';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


function StockTable({ title, products, icon, lowStockThreshold, cardClassName }: { title: string, products: Product[], icon: React.ReactNode, lowStockThreshold: number, cardClassName?: string }) {
    if (products.length === 0) {
        return (
             <Card className={cn(cardClassName)}>
                <CardHeader className="flex flex-row items-center space-x-4 space-y-0">
                    {icon}
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">لا توجد منتجات لعرضها في هذه الفئة.</p>
                </CardContent>
             </Card>
        )
    }

    return (
        <Card className={cn(cardClassName)}>
            <CardHeader className="flex flex-row items-center space-x-4 space-y-0">
                {icon}
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[80px] sm:table-cell">صورة</TableHead>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>المخزون</TableHead>
                            <TableHead className="w-[100px]">الإجراء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(product => (
                            <TableRow key={product.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={product.title}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={product.images[0]?.src || placeholderImages.products.placeholder}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{product.title}</TableCell>
                                <TableCell>
                                     <Badge variant={product.totalStock > lowStockThreshold ? 'outline' : (product.totalStock > 0 ? 'default' : 'destructive')}
                                      className={cn(
                                          product.totalStock > 0 && product.totalStock <= lowStockThreshold && 'bg-yellow-500 text-white'
                                      )}
                                     >
                                        {product.totalStock > 0 ? "في المخزون" : "نفدت الكمية"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {product.variants && product.variants.length > 0 ? (
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant={product.totalStock > 0 ? 'default' : 'destructive'} className="cursor-help">
                                                        {product.totalStock}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                <div className="p-2 text-sm max-w-xs">
                                                        <h4 className="font-bold mb-2">تفاصيل مخزون المتغيرات</h4>
                                                        <div className="space-y-2">
                                                            {product.variants.map(variant => (
                                                                <div key={variant.id} className="flex justify-between items-center gap-4">
                                                                    <span className="text-muted-foreground">{variant.color} - {variant.size}</span>
                                                                    <span className={cn("font-bold", variant.stock === 0 ? "text-destructive" : "")}>{variant.stock}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <Badge variant={product.totalStock > 0 ? 'default' : 'destructive'}>
                                            {product.totalStock}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/admin/products/${product.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            تعديل
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function AdminStockPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // State for the low stock threshold
    const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

    // Effect to load threshold from localStorage on client-side
    useEffect(() => {
        const savedThreshold = localStorage.getItem('lowStockThreshold');
        if (savedThreshold) {
            setLowStockThreshold(parseInt(savedThreshold, 10));
        }
    }, []);

    // Effect to save threshold to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('lowStockThreshold', lowStockThreshold.toString());
    }, [lowStockThreshold]);

    useEffect(() => {
        if (!firestore) return;
        const productsQuery = collection(firestore, 'products');
        const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            setLoading(false);
        }, (error) => {
            toast({ title: "خطأ", description: "فشل في تحميل المنتجات.", variant: "destructive" });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore, toast]);
    
     const { outOfStockProducts, lowStockProducts } = useMemo(() => {
        if (!products) {
            return { outOfStockProducts: [], lowStockProducts: [] };
        }

        const outOfStock: Product[] = [];
        const lowStock: Product[] = [];
        const outOfStockIds = new Set<string>();

        // First pass: Identify products that are completely out of stock OR have at least one variant out of stock.
        for (const p of products) {
            const isOutOfStock = 
                p.totalStock === 0 || 
                (p.variants && p.variants.length > 0 && p.variants.some(v => v.stock === 0));
            
            if (isOutOfStock) {
                outOfStock.push(p);
                outOfStockIds.add(p.id);
            }
        }

        // Second pass: Identify low-stock products, excluding those already in the out-of-stock list.
        for (const p of products) {
            // Skip if this product is already categorized as out-of-stock to avoid duplication.
            if (outOfStockIds.has(p.id)) {
                continue;
            }
            
            const isLowOnStock =
                (p.totalStock > 0 && p.totalStock <= lowStockThreshold) ||
                (p.variants && p.variants.length > 0 && p.variants.some(v => v.stock > 0 && v.stock <= lowStockThreshold));
            
            if (isLowOnStock) {
                lowStock.push(p);
            }
        }

        return { outOfStockProducts: outOfStock, lowStockProducts: lowStock };
    }, [products, lowStockThreshold]);

    if (loading) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة المخزون</h2>
                    <p className="text-muted-foreground">
                        نظرة شاملة على حالة مخزون منتجاتك.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">على وشك النفاد</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockProducts.length}</div>
                         <div className="flex items-center gap-2 mt-1">
                             <Label htmlFor="low-stock-threshold" className="text-xs text-muted-foreground whitespace-nowrap">الحد الأدنى:</Label>
                             <Input 
                                id="low-stock-threshold"
                                type="number"
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
                                className="h-7 w-20 text-xs"
                             />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">نفدت الكمية</CardTitle>
                        <ArchiveX className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{outOfStockProducts.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <StockTable 
                    title="منتجات نفدت كميتها" 
                    products={outOfStockProducts}
                    icon={<ArchiveX className="h-6 w-6 text-red-500" />}
                    lowStockThreshold={lowStockThreshold}
                    cardClassName="bg-red-500/10 border-red-500/20"
                />
                 <StockTable 
                    title="منتجات على وشك النفاد" 
                    products={lowStockProducts}
                    icon={<AlertTriangle className="h-6 w-6 text-orange-500" />}
                    lowStockThreshold={lowStockThreshold}
                    cardClassName="bg-orange-500/10 border-orange-500/20"
                />
                 <StockTable 
                    title="جميع المنتجات" 
                    products={products || []}
                    icon={<ClipboardList className="h-6 w-6 text-green-500" />}
                    lowStockThreshold={lowStockThreshold}
                    cardClassName="bg-green-500/10 border-green-500/20"
                />
            </div>
        </div>
    );
}
