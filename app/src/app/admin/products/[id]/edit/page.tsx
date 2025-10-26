
'use client';
import ProductForm from '@/components/admin/product-form';
import type { Product, Category, Page } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => firestore && id ? doc(firestore, 'products', id) : null, [firestore, id]);
  const { data: product, isLoading: loadingProduct } = useDoc<Product>(productRef);

  const catQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories'), orderBy('name')) : null, [firestore]);
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(catQuery);
    
  const pageQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'pages'), where('type', '==', 'dynamic')) : null, [firestore]);
  const { data: dynamicPages, isLoading: loadingPages } = useCollection<Page>(pageQuery);

  const handleSave = async (data: Omit<Product, 'id'>) => {
    if (!product || !firestore) return;
    try {
      const productRef = doc(firestore, 'products', product.id);
      await updateDoc(productRef, { ...data, updatedAt: serverTimestamp() });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث تفاصيل المنتج.",
      });
      router.push('/admin/products');
    } catch (error) {
       console.error("Error updating product: ", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء تحديث المنتج.",
        variant: "destructive",
      });
    }
  };

  const isLoading = loadingProduct || loadingCategories || loadingPages;

  if (isLoading && !product) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /> <span className="mr-2">جاري تحميل المنتج...</span></div>;
  }
  
  if (!isLoading && !product) {
     return <div className="flex justify-center items-center h-full p-8"><p className="text-destructive">غير موجود: لم يتم العثور على هذا المنتج.</p></div>;
  }

  return (
    <ProductForm
      product={product as Product}
      onSave={handleSave}
      isEditing={true}
      categories={categories || []}
      dynamicPages={dynamicPages || []}
      isLoading={isLoading}
    />
  );
}
