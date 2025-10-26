'use client';
import { useMemo } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { SiteSettings, MenuItem } from '@/lib/types';
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import ContactForm from '@/components/contact-form';

export default function ContactPage() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'siteIdentity') : null, [firestore]);
    const menuQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'menus'), orderBy('order')) : null, [firestore]);

    const { data: siteSettings, isLoading: loadingSettings } = useDoc<SiteSettings>(settingsRef);
    const { data: menuItems, isLoading: loadingMenus } = useCollection<MenuItem>(menuQuery);

    const headerMenuItems = useMemo(() => menuItems?.filter(item => item.location === 'header') || [], [menuItems]);

    const isLoading = loadingSettings || loadingMenus;

    return (
        <div className="flex flex-col min-h-screen">
            <Header menuItems={headerMenuItems} isLoading={loadingMenus} />
            <main className="flex-grow">
               {isLoading ? (
                 <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
               ) : (
                <div className="container py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-headline font-bold">اتصل بنا</h1>
                        <p className="text-lg text-muted-foreground mt-2">نحن هنا للمساعدة. تواصل معنا عبر أي من القنوات أدناه.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div className="space-y-8">
                            <h2 className="text-3xl font-bold font-headline">معلومات التواصل</h2>
                            <p className="text-muted-foreground">
                                نحن هنا لمساعدتك. تواصل معنا عبر القنوات التالية أو املأ النموذج وسنعاود الاتصال بك.
                            </p>
                            {siteSettings?.contact.email && (
                                <a href={`mailto:${siteSettings.contact.email}`} className="flex items-center gap-4 text-lg group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold group-hover:text-primary transition-colors">البريد الإلكتروني</p>
                                        <p className="text-muted-foreground">{siteSettings.contact.email}</p>
                                    </div>
                                </a>
                            )}
                            {siteSettings?.contact.phone && (
                                <a href={`tel:${siteSettings.contact.phone}`} className="flex items-center gap-4 text-lg group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Phone className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold group-hover:text-primary transition-colors">الهاتف</p>
                                        <p className="text-muted-foreground">{siteSettings.contact.phone}</p>
                                    </div>
                                </a>
                            )}
                            {siteSettings?.address && (
                                <div className="flex items-center gap-4 text-lg">
                                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <MapPin className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">العنوان</p>
                                        <p className="text-muted-foreground">{siteSettings.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <ContactForm />
                        </div>
                    </div>
                </div>
               )}
            </main>
            <Footer siteSettings={siteSettings} menuItems={menuItems} isLoading={isLoading} />
        </div>
    );
}
