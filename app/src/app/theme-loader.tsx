
'use client';

import { useFirestore } from '@/firebase';
import type { SiteTheme } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';

// Helper function to convert hex to HSL string
function hexToHSL(hex: string): string {
    if (!hex || typeof hex !== 'string') return "0 0% 0%";
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return "0 0% 0%";
    }
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


export default function ThemeLoader() {
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        const themeRef = doc(firestore, 'settings', 'theme');
        const unsubscribe = onSnapshot(themeRef, (snapshot) => {
            if (snapshot.exists()) {
                const theme = snapshot.data() as SiteTheme;
                const themeVariables = {
                    '--background': hexToHSL(theme.colors.background),
                    '--foreground': '20 14.3% 4.1%',
                    '--card': hexToHSL(theme.colors.background),
                    '--card-foreground': '20 14.3% 4.1%',
                    '--popover': hexToHSL(theme.colors.background),
                    '--popover-foreground': '20 14.3% 4.1%',
                    '--primary': hexToHSL(theme.colors.primary),
                    '--primary-foreground': '#ffffff',
                    '--secondary': hexToHSL(theme.colors.secondary),
                    '--secondary-foreground': '20 14.3% 4.1%',
                    '--muted': '240 4.8% 95.9%',
                    '--muted-foreground': '25 5.3% 44.7%',
                    '--accent': hexToHSL(theme.colors.accent),
                    '--accent-foreground': '#ffffff',
                    '--destructive': '0 84.2% 60.2%',
                    '--destructive-foreground': '0 0% 98%',
                    '--border': '20 5.9% 90%',
                    '--input': '20 5.9% 90%',
                    '--ring': hexToHSL(theme.colors.primary),
                    '--font-headline': theme.font.family,
                    '--font-body': theme.bodyFont.family,
                };

                const root = document.documentElement;
                Object.entries(themeVariables).forEach(([key, value]) => {
                    root.style.setProperty(key, value);
                });
            }
        });

        return () => unsubscribe();
    }, [firestore]);


    return null; // This component doesn't render anything
}
