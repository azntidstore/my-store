
import type {Metadata} from 'next';
import '@/app/globals.css';
import {cn} from '@/lib/utils';
import { ClientProviders } from '@/firebase/client-providers';

export const metadata: Metadata = {
  title: 'Marhaba Market',
  description: 'متجر لبيع المنتجات المغربية المصنوعة يدوياً',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@200..1000&family=Changa:wght@200..800&family=El+Messiri:wght@400..700&family=Harmattan:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@100;200;300;400;500;600;700&family=Katibeh&family=Lalezar&family=Mada:wght@200..900&family=Markazi+Text:wght@400..700&family=Noto+Sans+Arabic:wght@100..900&family=Readex+Pro:wght@160..700&family=Reem+Kufi:wght@400..700&family=Scheherazade+New:wght@400;500;600;700&family=Tajawal:wght@200;300;400;500;700;800;900&family=Vazirmatn:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('antialiased min-h-screen bg-background font-body')}>
        <ClientProviders>
          <div className="pb-20 md:pb-0">
              {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
