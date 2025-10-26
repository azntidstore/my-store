'use client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import type { SiteSettings, MenuItem } from '@/lib/types';
import { useMemo } from 'react';
import placeholderImages from '@/lib/placeholder-images.json';

const blogPosts = [
  {
    slug: 'secrets-of-kaftan',
    title: 'أسرار القفطان المغربي: تاريخ وأناقة',
    description: 'اكتشف تاريخ القفطان المغربي العريق وكيف تطور ليصبح رمزًا عالميًا للأناقة. تعرف على أنواع الأقمشة والتطريزات المختلفة.',
    imageUrl: placeholderImages.blog.kaftan,
    category: 'ملابس تقليدية',
    date: '15 يونيو 2024',
    hint: 'kaftan history'
  },
  {
    slug: 'art-of-tagine',
    title: 'فن الطبخ في الطاجين: نصائح ووصفات',
    description: 'تعلم كيفية استخدام الطاجين الخزفي بشكل صحيح للحصول على نكهات غنية. نقدم لك وصفة طاجين الدجاج بالزيتون والليمون.',
    imageUrl: placeholderImages.blog.tagine,
    category: 'مطبخ',
    date: '10 يونيو 2024',
    hint: 'tagine cooking'
  },
  {
    slug: 'berber-rugs-stories',
    title: 'سجاد البربر: قصص منسوجة بالصوف',
    description: 'كل سجادة بربرية تحكي قصة. استكشف الرموز والمعاني الخفية في هذه القطع الفنية الفريدة التي تزين المنازل بدفئها وجمالها.',
    imageUrl: placeholderImages.blog.rug,
    category: 'ديكور منزلي',
    date: '05 يونيو 2024',
    hint: 'berber rug'
  },
  {
    slug: 'argan-oil-gold',
    title: 'زيت الأركان: ذهب المغرب السائل',
    description: 'من شجرة الأركان النادرة في جنوب المغرب، يأتي هذا الزيت الثمين بفوائده المذهلة للبشرة والشعر. تعرف على أسراره.',
    imageUrl: placeholderImages.blog.argan,
    category: 'تجميل',
    date: '01 يونيو 2024',
    hint: 'argan oil'
  }
];


export default function BlogPage() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'siteIdentity') : null, [firestore]);
    const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menus'), orderBy('order')) : null, [firestore]);
    
    const { data: siteSettings, isLoading: loadingSettings } = useDoc<SiteSettings>(settingsRef);
    const { data: menuItems, isLoading: loadingMenus } = useCollection<MenuItem>(menuQuery);
    const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
      <main className="flex-grow container py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-headline font-bold">مدونة مرحبا</h1>
            <p className="text-lg text-muted-foreground mt-2">مقالات عن الثقافة، الفن، والحرف اليدوية المغربية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map(post => (
                <Card key={post.slug} className="flex flex-col overflow-hidden group">
                     <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
                        <CardHeader className="p-0">
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <Image 
                                    src={post.imageUrl}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    data-ai-hint={post.hint}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-6">
                             <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                            <CardTitle className="text-xl font-bold font-headline group-hover:text-primary transition-colors">{post.title}</CardTitle>
                            <p className="text-muted-foreground mt-2 text-sm">{post.description}</p>
                        </CardContent>
                        <CardFooter className="p-6 pt-0 flex justify-between items-center text-sm text-muted-foreground">
                            <span>{post.date}</span>
                            <div className="flex items-center group-hover:text-primary transition-colors">
                                <span>إقرأ المزيد</span>
                                <ArrowLeft className="mr-1 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
                            </div>
                        </CardFooter>
                    </Link>
                </Card>
            ))}
        </div>

      </main>
      <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
    </div>
  );
}
