

// Domain Layer

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type MessageStatus = 'read' | 'unread';

export type MenuItemType = 'page' | 'category' | 'custom' | 'product';
export type MenuLocation = 'header' | 'footer-col-1' | 'footer-col-2';
export type ItemStatus = 'active' | 'hidden';

export interface MenuItem {
  id: string;
  title: string;
  type: MenuItemType;
  value: string; // page slug, category slug, or custom URL
  order: number;
  location: MenuLocation;
  parentId?: string | null;
  status: ItemStatus; // 'active' or 'hidden'
  is_indexed: boolean; // SEO indexing
  meta_title?: string;
  meta_description?: string;
  children?: MenuItem[]; // Added in frontend logic
  createdAt?: any;
  level?: number;
}


export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice?: number;
  images: { src: string; alt: string; 'data-ai-hint'?: string }[];
  badge?: string;
  description: string;
  shortDescription?: string;
  specifications?: { name: string; value: string }[];
  videoUrl?: string;
  availableSizes?: string[];
  availableColors?: { name: string; code: string }[];
  categoryId: string; // Foreign key
  tags?: string[];
  totalStock: number;
  variants: { id: string; size: string; color: string; colorCode: string; stock: number }[];
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  // subCategories?: Category[]; // Future use
}

export interface Page {
    id: string;
    title: string;
    slug: string;
    type: 'static' | 'dynamic' | 'landing_page';
    content: string;
    order: number;
    createdAt?: any;
}

export interface Order {
  id: string;
  userId: string; // Foreign key
  items: OrderItem[];
  total: number;
  shippingCost: number;
  status: OrderStatus;
  shippingAddress: {
    name: string;
    address: string;
    phone: string;
    city: string;
  };
  paymentMethod: 'cod'; // Cash on Delivery
  createdAt?: any; // Firestore timestamp
  source?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number; // Price at time of order
  image: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  roles: string[]; // Changed from 'role' to 'roles'
  createdAt?: any; // Firestore timestamp
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  status: MessageStatus;
  senderInfo?: {
    name: string;
    email: string;
  };
  createdAt: any; // Firestore timestamp
}

export interface SiteTheme {
    font: { name: string; family: string; };
    bodyFont: { name: string; family: string; };
    colors: {
        primary: string;
        background: string;
        secondary: string;
        accent: string;
    }
}


export interface SiteSettings {
  storeName: string;
  logoUrl?: string;
  faviconUrl?: string;
  copyrightText: string;
  footerWelcomeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  contact: {
    phone: string;
    email: string;
  };
  address: string;
  socialLinks: {
    platform: string;
    icon: string;
    url: string;
  }[];
}

export interface LandingPage {
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: any;
    updatedAt: any;
    content: {
        headerTitle?: string;
        headerDescription?: string;
        heroImage: string;
        heroTitle: string;
        heroDescription: string;
        heroButtonText: string;
        originalPrice?: number;
        salePrice: number;
        productIdentifier: string;
        products?: {
            imageUrl: string;
            title: string;
            description: string;
        }[];
        reviews?: {
            text: string;
            author: string;
            rating: number;
        }[];
        countdownDate?: string;
        formTitle: string;
        formDescription?: string;
        footerText?: string;
    };
}


export interface Integrations {
  facebookPixelId?: string;
  googleTagId?: string;
  tiktokPixelId?: string;
}

export interface ShippingRate {
    name: string;
    price: number;
    conditionType?: 'none' | 'min_order_value';
    conditionValue?: number;
}

export interface ShippingZone {
    id: string;
    name: string;
    cities: string[];
    rates: ShippingRate[];
}
