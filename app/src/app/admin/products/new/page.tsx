'use client';
import ProductForm from '@/components/admin/product-form';
import type { Product, Category, Page } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const catQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories'), orderBy('name')) : null, [firestore]);
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(catQuery);
    
  const pageQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'pages'), where('type', '==', 'dynamic')) : null, [firestore]);
  const { data: dynamicPages, isLoading: loadingPages } = useCollection<Page>(pageQuery);
  
  const handleSave = async (data: Omit<Product, 'id'>) => {
    if (!firestore) {
      toast({
        title: "خطأ في الاتصال",
        description: "لا يمكن الاتصال بقاعدة البيانات.",
        variant: "destructive",
      });
      return;
    }
    try {
      const productsCol = collection(firestore, 'products');
      await addDoc(productsCol, { ...data, createdAt: serverTimestamp() });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تمت إضافة المنتج الجديد إلى قائمتك.",
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Error adding product: ", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ المنتج.",
        variant: "destructive",
      });
    }
  };

  return (
    <ProductForm 
      onSave={handleSave} 
      categories={categories || []}
      dynamicPages={dynamicPages || []}
      isLoading={loadingCategories || loadingPages}
    />
  );
}
