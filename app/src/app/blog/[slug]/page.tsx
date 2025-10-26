
'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import type { SiteSettings, MenuItem } from '@/lib/types';
import placeholderImages from '@/lib/placeholder-images.json';
import Link from 'next/link';

const allBlogPostsData = [
  {
    slug: 'secrets-of-kaftan',
    title: 'أسرار القفطان المغربي: تاريخ وأناقة',
    description: 'اكتشف تاريخ القفطان المغربي العريق وكيف تطور ليصبح رمزًا عالميًا للأناقة. تعرف على أنواع الأقمشة والتطريزات المختلفة.',
    imageUrl: placeholderImages.blog.kaftan,
    category: 'ملابس تقليدية',
    date: '15 يونيو 2024',
    hint: 'kaftan history',
    content: '<h2>تاريخ القفطان</h2><p>القفطان المغربي هو أكثر من مجرد ثوب، إنه حكاية تروى عبر الأجيال. تعود جذوره إلى العصور القديمة، وقد ارتداه السلاطين والأمراء كرمز للفخامة والمكانة. مع مرور الوقت، تطور القفطان ليصبح قطعة فنية ترتديها المرأة المغربية في أبهى المناسبات، محافظًا على طابعه الأصيل مع لمسات عصرية.</p><h3>أنواع الأقمشة والتطريز</h3><p>يتميز القفطان بتنوع أقمشته الفاخرة مثل الحرير، المخمل، والبروكار. أما التطريز، فهو فن بحد ذاته، حيث يستخدم الحرفيون خيوط الذهب والفضة (الصقلي) لتزيين القفطان بأشكال وزخارف مستوحاة من الطبيعة والهندسة الإسلامية.</p>'
  },
  {
    slug: 'art-of-tagine',
    title: 'فن الطبخ في الطاجين: نصائح ووصفات',
    description: 'تعلم كيفية استخدام الطاجين الخزفي بشكل صحيح للحصول على نكهات غنية. نقدم لك وصفة طاجين الدجاج بالزيتون والليمون.',
    imageUrl: placeholderImages.blog.tagine,
    category: 'مطبخ',
    date: '10 يونيو 2024',
    hint: 'tagine cooking',
    content: '<h2>أسرار الطاجين</h2><p>الطاجين ليس مجرد وعاء للطبخ، بل هو فلسفة في الطهي البطيء الذي يحافظ على نكهات المكونات ويجعل اللحم طريًا. شكله المخروطي الفريد يسمح للبخار بالتكثف والعودة إلى المكونات، مما يحافظ على رطوبتها.</p><h3>وصفة طاجين الدجاج</h3><p>المكونات: دجاجة مقطعة، بصل، ثوم، زيتون، ليمون مصير، زنجبيل، كركم، زعفران، زيت زيتون. الطريقة: يُقلى الدجاج مع البصل والتوابل، ثم يضاف الماء ويُغطى الطاجين ويُترك على نار هادئة لمدة ساعة. في النهاية، يضاف الزيتون والليمون المصير.</p>'
  },
  {
    slug: 'berber-rugs-stories',
    title: 'سجاد البربر: قصص منسوجة بالصوف',
    description: 'كل سجادة بربرية تحكي قصة. استكشف الرموز والمعاني الخفية في هذه القطع الفنية الفريدة التي تزين المنازل بدفئها وجمالها.',
    imageUrl: placeholderImages.blog.rug,
    category: 'ديكور منزلي',
    date: '05 يونيو 2024',
    hint: 'berber rug',
    content: '<h2>لغة الرموز</h2><p>الزربية الأمازيغية (السجاد البربري) هي لوحة فنية تحكي قصص القبائل وتاريخها ومعتقداتها. كل رمز له معنى: المعين يمثل الأنوثة والخصوبة، بينما الخطوط المتعرجة قد ترمز إلى الأنهار أو الثعابين. الألوان أيضًا لها دلالاتها، فالأحمر يرمز للقوة والحياة، والأزرق للسماء والحكمة.</p>'
  },
  {
    slug: 'argan-oil-gold',
    title: 'زيت الأركان: ذهب المغرب السائل',
    description: 'من شجرة الأركان النادرة في جنوب المغرب، يأتي هذا الزيت الثمين بفوائده المذهلة للبشرة والشعر. تعرف على أسراره.',
    imageUrl: placeholderImages.blog.argan,
    category: 'تجميل',
    date: '01 يونيو 2024',
    hint: 'argan oil',
    content: '<h2>شجرة الحياة</h2><p>شجرة الأركان، التي تنمو حصريًا في منطقة سوس بالمغرب، هي مصدر هذا الزيت المعجزة. يُستخرج زيت الأركان من لوز ثمار الشجرة بعملية تقليدية شاقة تقوم بها النساء في التعاونيات المحلية. هذا الزيت غني بفيتامين E ومضادات الأكسدة، مما يجعله مرطبًا ومغذيًا ممتازًا للبشرة والشعر.</p>'
  }
];


export function generateStaticParams() {
  return [];
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<(typeof allBlogPostsData)[0] | null>(null);
  const [loading, setLoading] = useState(true);
  
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'siteIdentity') : null, [firestore]);
  const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menus'), orderBy('order')) : null, [firestore]);

  const { data: siteSettings, isLoading: loadingSettings } = useDoc<SiteSettings>(settingsRef);
  const { data: menuItems, isLoading: loadingMenus } = useCollection<MenuItem>(menuQuery);
  
  const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      const foundPost = allBlogPostsData.find(p => p.slug === slug);
      // Simulate network delay for a better loading experience
      setTimeout(() => {
        setPost(foundPost || null);
        setLoading(false);
      }, 300);
    }
  }, [slug]);

  if (loading || loadingSettings || loadingMenus) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header menuItems={[]} isLoading={true} />
        <main className="flex-grow container py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer isLoading={true} />
      </div>
    )
  }

  if (!post) {
     return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow container py-12 text-center">
            <h1 className="text-4xl font-headline mb-4">المقالة غير موجودة</h1>
            <p className="text-destructive">عذراً، لم نتمكن من العثور على هذه المقالة.</p>
            <Link href="/blog" className="mt-8 inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md">
                العودة إلى المدونة
                </Link>
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
      <main className="flex-grow">
        <article className="container max-w-4xl py-12">
            <header className="text-center mb-12">
                <Badge variant="secondary" className="mb-4">{post.category}</Badge>
                <h1 className="text-5xl font-headline font-bold">{post.title}</h1>
                <p className="text-muted-foreground mt-4 text-lg">{post.date}</p>
            </header>
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-12">
                <Image 
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    data-ai-hint={post.hint}
                    sizes="(max-width: 768px) 100vw, 66vw"
                />
            </div>

            <div className="prose lg:prose-xl mx-auto" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={loadingSettings || loadingMenus} />
    </div>
  );
}
