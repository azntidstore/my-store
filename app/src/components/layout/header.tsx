
'use client';
import Link from 'next/link';
import {Heart, Menu, ShoppingCart, User, Search, ChevronDown, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {Logo} from '@/components/icons';
import { useCart } from '@/context/cart-context';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import React from 'react';


function getLink(item: MenuItem): string {
    if (item.value === '/') {
        return '/';
    }
    switch (item.type) {
        case 'page':
        case 'category':
            return `/${item.value}`;
        case 'product':
             return `/products/${item.value}`;
        case 'custom':
            return item.value;
        default:
             // Handle static pages that might have a full path
            if (item.value.startsWith('/')) {
                return item.value;
            }
            return '/';
    }
}


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


export default function Header({ menuItems, isLoading }: { menuItems: MenuItem[], isLoading?: boolean }) {
  const { cartCount, favoritesCount, openCart } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  const headerMenuTree = useMemo(() => {
      if (!menuItems) return [];
      const itemMap = new Map(menuItems.map(item => [item.id, { ...item, children: [] as MenuItem[] }]));
      const tree: MenuItem[] = [];

      for (const item of itemMap.values()) {
          if (item.parentId && itemMap.has(item.parentId)) {
              const parent = itemMap.get(item.parentId);
              parent?.children.push(item);
          } else {
              tree.push(item);
          }
      }
      return tree;
  }, [menuItems]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 80) { // if scroll down hide the navbar
          setIsHidden(true);
        } else { // if scroll up show the navbar
          setIsHidden(false);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [isClient, lastScrollY]);


  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 md:transform-none", isHidden ? '-translate-y-full' : 'translate-y-0')}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="sr-only">Marhaba Market</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
            <NavigationMenu>
                <NavigationMenuList>
                    {headerMenuTree.map(item => (
                        <NavigationMenuItem key={item.id}>
                            {item.children && item.children.length > 0 ? (
                                <>
                                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                            {item.children.map((child) => (
                                                <ListItem key={child.id} href={getLink(child)} title={child.title}>
                                                    {/* You might want a description field for menu items */}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                </>
                            ) : (
                                 <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href={getLink(item)}>
                                        {item.title}
                                    </Link>
                                </NavigationMenuLink>
                            )}
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
            }
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
            <Input 
              type="search"
              placeholder="ابحث عن منتجات..."
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8">
              <Search className="h-5 w-5" />
            </Button>
          </form>

          <Link href="/favorites" passHref>
             <Button variant="ghost" size="icon" aria-label="المفضلة" className="relative">
                <Heart className="h-6 w-6" />
                {favoritesCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center" variant="destructive">{favoritesCount}</Badge>
                )}
              </Button>
          </Link>
          <Button variant="ghost" size="icon" aria-label="سلة التسوق" className="relative" onClick={openCart}>
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center">{cartCount}</Badge>
            )}
          </Button>
          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="حساب المستخدم">
              <User className="h-6 w-6" />
            </Button>
          </Link>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="فتح القائمة">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-6 p-6">
                  <Link href="/" className="flex items-center gap-2 mb-4">
                    <Logo />
                  </Link>
                  <form onSubmit={handleSearchSubmit} className="flex items-center relative">
                    <Input 
                      type="search"
                      placeholder="ابحث..."
                      className="pr-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                     <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8">
                       <Search className="h-5 w-5" />
                     </Button>
                  </form>
                  <nav className="flex flex-col gap-4 mt-4">
                    {headerMenuTree.map(item => (
                       <SheetClose asChild key={item.id}>
                           <Link
                            href={getLink(item)}
                            className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                          >
                            {item.title}
                          </Link>
                       </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
