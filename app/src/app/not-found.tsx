
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';
import { Logo } from '@/components/icons';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
       <header className="py-4">
        <div className="container mx-auto">
            <Link href="/">
              <Logo />
            </Link>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <SearchX className="mx-auto h-24 w-24 text-destructive mb-4" />
        <h1 className="text-5xl font-headline font-bold text-destructive">خطأ 404</h1>
        <p className="text-xl text-foreground mt-4">عذرًا، الصفحة التي تبحث عنها غير موجودة.</p>
        <p className="text-md text-muted-foreground mt-2">قد تكون قد حُذفت أو تم تغيير عنوانها.</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">العودة إلى الصفحة الرئيسية</Link>
        </Button>
      </main>
      <footer className="py-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} سوق مرحبا. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
