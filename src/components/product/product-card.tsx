'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, HeartCrack } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';

interface ProductCardProps {
  product: Product;
  isFavoritePage?: boolean;
}

export default function ProductCard({ product, isFavoritePage = false }: ProductCardProps) {
    const { toast } = useToast();
    const { addToCart, addToFavorites, removeFromFavorites, isFavorited } = useCart();
    const image = product.images && product.images[0];

    const isProductFavorited = isFavorited(product.id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
        toast({
            title: "أضيفت إلى السلة!",
            description: `${product.title} تمت إضافته إلى سلة التسوق الخاصة بك.`,
        });
    };
    
    const handleFavoriteToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isProductFavorited) {
            removeFromFavorites(product.id);
            toast({
                title: "أزيلت من المفضلة",
                description: `${product.title} تمت إزالته من قائمة المفضلة.`,
                variant: 'destructive',
            });
        } else {
            addToFavorites(product);
            toast({
                title: "أضيفت إلى المفضلة!",
                description: `${product.title} تمت إضافته إلى قائمة المفضلة لديك.`,
            });
        }
    };

    return (
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group flex flex-col">
            <Link href={`/products/${product.slug}`} className="flex flex-col h-full">
                <div className="flex-grow flex flex-col">
                    <div className="aspect-square relative overflow-hidden">
                         <Image
                            src={image?.src || 'https://picsum.photos/seed/placeholder/800/800'}
                            alt={image?.alt || product.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            data-ai-hint={image?.['data-ai-hint']}
                        />
                        {product.badge && (
                            <Badge className="absolute top-3 right-3" variant={product.badge === 'تخفيض' ? 'destructive' : 'default'}>{product.badge}</Badge>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 left-2 bg-background/70 hover:bg-background rounded-full text-destructive"
                            onClick={handleFavoriteToggle}
                            aria-label="تبديل المفضلة"
                        >
                           {isFavoritePage || isProductFavorited ? <HeartCrack className="size-5" /> : <Heart className="size-5" />}
                        </Button>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                            <Button className="w-full" variant="secondary" onClick={handleAddToCart}>
                                <ShoppingCart className="ml-2 size-5" />
                                أضف إلى السلة
                            </Button>
                        </div>
                    </div>
                    <div className="p-4 bg-card flex flex-col flex-grow">
                        <h3 className="text-lg font-bold font-headline truncate">{product.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                        
                        <div className="mt-auto pt-4">
                            <div className="space-y-2 md:hidden">
                                <p className="text-primary font-semibold text-lg text-center">{product.price} DH</p>
                                <Button className="w-full" variant="secondary" onClick={handleAddToCart}>
                                    <ShoppingCart className="ml-2 size-5" />
                                    أضف إلى السلة
                                </Button>
                            </div>
                             <p className="text-primary font-semibold text-xl hidden md:block">{product.price} DH</p>
                        </div>
                    </div>
                </div>
            </Link>
        </Card>
    );
}
