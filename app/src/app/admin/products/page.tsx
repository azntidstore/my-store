'use client';
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
import { PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc } from "firebase/firestore";
import placeholderImages from '@/lib/placeholder-images.json';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
    const { data: products, isLoading: loading, error } = useCollection<Product>(productsQuery);

    const handleDeleteProduct = async (productId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'products', productId));
            toast({
                title: "تم الحذف بنجاح",
                description: "تم حذف المنتج من قائمتك.",
            });
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast({
                title: "خطأ",
                description: "حدث خطأ أثناء حذف المنتج.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">المنتجات</h2>
                    <p className="text-muted-foreground">
                        إدارة المنتجات والمخزون في متجرك.
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <Button asChild>
                        <Link href="/admin/products/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> إضافة منتج جديد
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>قائمة المنتجات</CardTitle>
                    <CardDescription>
                        إجمالي {products?.length || 0} منتج.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden w-[100px] sm:table-cell">
                                        <span className="sr-only">صورة المنتج</span>
                                    </TableHead>
                                    <TableHead className="text-right">الاسم</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">السعر</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">
                                        المخزون
                                    </TableHead>
                                    <TableHead className="text-right">
                                        الإجراءات
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products && products.map((product, index) => (
                                    <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-muted/50' : '')}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image
                                                alt={product.title}
                                                className="aspect-square rounded-md object-cover"
                                                height="64"
                                                src={product.images[0]?.src || placeholderImages.products.placeholder}
                                                width="64"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {product.title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.totalStock > 0 ? "outline" : "destructive"}>
                                                {product.totalStock > 0 ? "في المخزون" : "نفدت الكمية"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {product.price} DH
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {product.variants && product.variants.length > 0 ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="cursor-help underline decoration-dotted">{product.totalStock}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <div className="p-2 text-sm max-w-xs">
                                                                <h4 className="font-bold mb-2">تفاصيل مخزون المتغيرات</h4>
                                                                <div className="space-y-2">
                                                                    {product.variants.map(variant => (
                                                                        <div key={variant.id} className="flex justify-between items-center gap-4">
                                                                            <span className="text-muted-foreground">{variant.color} - {variant.size}</span>
                                                                            <span className="font-bold">{variant.stock}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                product.totalStock
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button asChild variant="ghost" size="icon">
                                                    <Link href={`/admin/products/${product.id}/edit`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف المنتج نهائيًا.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>متابعة</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
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
