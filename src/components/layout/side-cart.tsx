'use client';

import { useCart } from '@/context/cart-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';

export default function SideCart() {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartCount,
    cartSubtotal,
    removeFromCart,
    updateQuantity,
  } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>سلة التسوق ({cartCount})</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {cart.length > 0 ? (
            <div className="flex flex-col gap-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={item.images[0]?.src || placeholderImages.products.placeholder}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-foreground">
                        <h3>
                          <Link href={`/products/${item.slug}`} onClick={closeCart}>
                            {item.title}
                          </Link>
                        </h3>
                        <p className="ml-4">{item.price * item.quantity} DH</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.price} DH
                      </p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-4 w-4 text-center font-bold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="font-medium text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <ShoppingCart className="h-24 w-24 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                سلتك فارغة
              </p>
              <Button onClick={closeCart} asChild className="mt-6">
                <Link href="/products">ابدأ التسوق</Link>
              </Button>
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <SheetFooter className="border-t px-6 py-4">
            <div className="w-full space-y-4">
                <div className="flex justify-between text-base font-medium text-foreground">
                    <p>المجموع الفرعي</p>
                    <p>{cartSubtotal.toFixed(2)} DH</p>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    الشحن والضرائب تحسب عند الدفع.
                </p>
                <div className="mt-6">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/cart" onClick={closeCart}>
                            عرض السلة والدفع
                        </Link>
                    </Button>
                </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
