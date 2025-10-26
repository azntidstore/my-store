'use client';
import Link from 'next/link';
import {Phone, Mail, Loader2} from 'lucide-react';
import {Logo} from '@/components/icons';
import type { SiteSettings, MenuItem } from '@/lib/types';
import { useMemo } from 'react';

function getLink(item: MenuItem): string {
    if (item.value === '/') {
        return '/';
    }
    // Handle predefined pages like products, blog, contact etc.
    if (['products', 'blog', 'contact'].includes(item.value)) {
        return `/${item.value}`;
    }

    switch (item.type) {
        case 'page':
            return `/${item.value}`; // For other static pages like 'about'
        case 'category':
            return `/categories/${item.value}`;
        case 'product':
             return `/products/${item.value}`;
        case 'custom':
            return item.value;
        default:
            return '/';
    }
}


export default function Footer({ siteSettings, menuItems, isLoading }: { siteSettings?: SiteSettings | null, menuItems?: MenuItem[] | null, isLoading?: boolean }) {

  const footerLinks = useMemo(() => {
      if(!menuItems) return {};
      const footerCols: Record<string, MenuItem[]> = {
          'footer-col-1': [],
          'footer-col-2': [],
      };
      
      menuItems.forEach(item => {
          if (item.location === 'footer-col-1') {
              footerCols['footer-col-1'].push(item);
          } else if (item.location === 'footer-col-2') {
              footerCols['footer-col-2'].push(item);
          }
      });
      
      // A placeholder naming convention, can be improved
      return {
          'روابط سريعة': footerCols['footer-col-1'],
          'خدمة العملاء': footerCols['footer-col-2']
      }

  }, [menuItems]);
  
  if (isLoading) {
    return (
      <footer className="bg-secondary text-secondary-foreground">
        <div className="container py-12 flex justify-center">
           <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </footer>
    )
  }

  if (!siteSettings) {
    return (
        <footer className="bg-secondary text-secondary-foreground">
            <div className="container py-12 text-center text-destructive">
                فشل تحميل إعدادات الموقع.
            </div>
        </footer>
    );
  }


  const { socialLinks, contact, address, footerWelcomeText, copyrightText } = siteSettings;
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 md:col-span-1">
            <Logo />
            <p className="text-sm max-w-xs">
              {footerWelcomeText}
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary">
                <Phone size={16} />
                <span>{contact.phone}</span>
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail size={16} />
                <span>{contact.email}</span>
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            links.length > 0 && <div key={title}>
              <h4 className="font-headline text-lg mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.id}>
                    <Link href={getLink(link as MenuItem)} className="hover:text-primary transition-colors">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-headline text-lg mb-4">تابعنا</h4>
            <div className="flex gap-4">
              {socialLinks.map((social: any) => (
                <a
                  key={social.platform}
                  href={social.url}
                  aria-label={social.platform}
                  className="w-10 h-10 flex items-center justify-center border border-border rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>{copyrightText.replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </div>
    </footer>
  );
}
