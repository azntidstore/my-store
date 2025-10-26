// This file acts as a centralized configuration for site-wide settings.
// In a real-world scenario, this data would likely be fetched from a CMS or a database.
// For this prototype, we are hardcoding it to allow for easy management and demonstration
// of a site identity management page in the admin dashboard.

export const siteSettings = {
  storeName: 'Marhaba Market',
  logoUrl: '', // URL to the logo, can be updated from the admin panel
  faviconUrl: '/favicon.ico', // URL to the favicon
  copyrightText: '© {year} سوق مرحبا. جميع الحقوق محفوظة.',
  footerWelcomeText: 'مرحباً بكم في سوق مرحبا، وجهتكم الأولى للمنتجات المغربية الأصيلة المصنوعة يدوياً.',
  contact: {
    phone: '+212 6 00 00 00 00',
    email: 'contact@marhabamarket.com'
  },
  address: '123 زنقة الصناعة التقليدية، مراكش، المغرب',
  socialLinks: [
    { platform: 'Facebook', icon: 'FB', url: '#' },
    { platform: 'Instagram', icon: 'IG', url: '#' },
    { platform: 'WhatsApp', icon: 'WA', url: '#' },
  ],
};

export type SiteSettings = typeof siteSettings;
