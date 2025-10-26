
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import type { Product, ShippingZone } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  favorites: Product[];
  isCartOpen: boolean;
  cartCount: number;
  favoritesCount: number;
  cartSubtotal: number;
  shippingCost: number;
  selectedCity: string | null;
  grandTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorited: (productId: string) => boolean;
  calculateShipping: (city: string, shippingZones: ShippingZone[]) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const cartSubtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    openCart();
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setShippingCost(0);
    setSelectedCity(null);
  }

  const addToFavorites = (product: Product) => {
    setFavorites((prevFavorites) => {
      const isFavorited = prevFavorites.some((item) => item.id === product.id);
      if (isFavorited) {
        return prevFavorites;
      }
      return [...prevFavorites, product];
    });
  };

  const removeFromFavorites = (productId: string) => {
    setFavorites((prevFavorites) => prevFavorites.filter((item) => item.id !== productId));
  };

  const isFavorited = (productId: string): boolean => {
    return favorites.some((item) => item.id === productId);
  };
  
  const calculateShipping = (city: string, shippingZones: ShippingZone[]) => {
    if (!city) {
        setSelectedCity(null);
        setShippingCost(0);
        return;
    }
    
    setSelectedCity(city);

    const zone = shippingZones.find(zone => 
        zone.cities.map(c => c.toLowerCase()).includes(city.toLowerCase())
    );

    if (zone) {
        // Find rates with a condition that is met
        const conditionalRates = zone.rates.filter(rate => {
            if (rate.conditionType === 'min_order_value' && rate.conditionValue) {
                return cartSubtotal >= rate.conditionValue;
            }
            return false;
        });

        // Find standard rates (no condition)
        const standardRates = zone.rates.filter(rate => rate.conditionType === 'none' || !rate.conditionType);
        
        let bestRate;

        if (conditionalRates.length > 0) {
            // If conditional rates are met, find the cheapest among them
            bestRate = conditionalRates.reduce((min, rate) => rate.price < min.price ? rate : min);
        } else if (standardRates.length > 0) {
            // Otherwise, use the cheapest standard rate
            bestRate = standardRates.reduce((min, rate) => rate.price < min.price ? rate : min);
        }

        if (bestRate) {
            setShippingCost(bestRate.price);
        } else {
            // No applicable rates found
            setShippingCost(0);
            toast({
                title: "خطأ في الشحن",
                description: "لم يتم العثور على سعر شحن مناسب لهذه المنطقة.",
                variant: "destructive"
            });
        }
    } else {
        // City not found in any zone
        setShippingCost(0);
        toast({
            title: "منطقة الشحن",
            description: "لا تتوفر خدمة الشحن لهذه المدينة حاليًا.",
            variant: "destructive"
        });
    }
  }


  const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);
  const favoritesCount = useMemo(() => favorites.length, [favorites]);
  const grandTotal = useMemo(() => cartSubtotal + shippingCost, [cartSubtotal, shippingCost]);


  return (
    <CartContext.Provider
      value={{
        cart,
        favorites,
        isCartOpen,
        cartCount,
        favoritesCount,
        cartSubtotal,
        shippingCost,
        selectedCity,
        grandTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addToFavorites,
        removeFromFavorites,
        isFavorited,
        calculateShipping,
        openCart,
        closeCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
