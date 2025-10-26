'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingCart, Heart, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/products', label: 'الفئات', icon: LayoutGrid },
  { href: '/cart', label: 'السلة', icon: ShoppingCart, isCenter: true },
  { href: '/favorites', label: 'المفضلة', icon: Heart },
  { href: '/search', label: 'البحث', icon: Search },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount, favoritesCount } = useCart();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Don't render on the server
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-40">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <div key={item.href} className="relative">
                <Link href={item.href}>
                  <div 
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-[70px] bg-primary flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <Icon className="w-7 h-7 text-primary-foreground" />
                    {cartCount > 0 && (
                       <Badge variant="destructive" className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full p-0 text-xs">
                         {cartCount}
                       </Badge>
                    )}
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <Link href={item.href} key={item.href}>
              <div className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-full relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
                {item.href === '/favorites' && favoritesCount > 0 && (
                  <Badge variant="destructive" className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full p-0 text-xs">
                    {favoritesCount}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
