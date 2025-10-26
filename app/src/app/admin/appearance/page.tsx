'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from "@/firebase";
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import type { SiteTheme } from '@/lib/types';
import { Loader2 } from "lucide-react";

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


const googleFonts = [
    { name: 'Changa', family: "'Changa', sans-serif" },
    { name: 'Cairo', family: "'Cairo', sans-serif" },
    { name: 'Tajawal', family: "'Tajawal', sans-serif" },
    { name: 'Amiri', family: "'Amiri', serif" },
    { name: 'Lalezar', family: "'Lalezar', cursive" },
    { name: 'Noto Sans Arabic', family: "'Noto Sans Arabic', sans-serif" },
    { name: 'Almarai', family: "'Almarai', sans-serif" },
    { name: 'IBM Plex Sans Arabic', family: "'IBM Plex Sans Arabic', sans-serif" },
    { name: 'El Messiri', family: "'El Messiri', cursive" },
    { name: 'Harmattan', family: "'Harmattan', sans-serif" },
    { name: 'Katibeh', family: "'Katibeh', cursive" },
    { name: 'Mada', family: "'Mada', sans-serif" },
    { name: 'Markazi Text', family: "'Markazi Text', serif" },
    { name: 'Readex Pro', family: "'Readex Pro', sans-serif" },
    { name: 'Reem Kufi', family: "'Reem Kufi', sans-serif" },
    { name: 'Scheherazade New', family: "'Scheherazade New', serif" },
    { name: 'Vazirmatn', family: "'Vazirmatn', sans-serif" },
];

const colorPalettes = [
    {
        name: 'ذهبي صحراوي (افتراضي)',
        id: 'desert-gold',
        colors: { primary: "#DAA520", background: "#FDFCF9", secondary: "#F8F5F2", accent: "#4682B4" }
    },
    {
        name: 'أزرق محيطي',
        id: 'ocean-blue',
        colors: { primary: "#20B2AA", background: "#F0F8FF", secondary: "#E6F2FF", accent: "#FF8C00" }
    },
    {
        name: 'أخضر نعناعي',
        id: 'minty-green',
        colors: { primary: "#3CB371", background: "#F5FFFA", secondary: "#EBF5F0", accent: "#D2691E" }
    },
    {
        name: 'وردي مغربي',
        id: 'moroccan-pink',
        colors: { primary: "#FF69B4", background: "#FFF0F5", secondary: "#FFE6EE", accent: "#483D8B" }
    },
    {
        name: 'طين مراكش',
        id: 'marrakech-clay',
        colors: { primary: "#D2691E", background: "#FFF5EE", secondary: "#FAEBD7", accent: "#2E8B57" }
    },
    {
        name: 'ياقوت أزرق',
        id: 'sapphire-jewel',
        colors: { primary: "#0F52BA", background: "#F0F8FF", secondary: "#E0EFFF", accent: "#FFD700" }
    },
    {
        name: 'زيتون أخضر',
        id: 'olive-grove',
        colors: { primary: "#556B2F", background: "#F5F5DC", secondary: "#FAFAD2", accent: "#8B4513" }
    },
    {
        name: 'لافندر هادئ',
        id: 'calm-lavender',
        colors: { primary: "#9370DB", background: "#F8F0FF", secondary: "#E6E6FA", accent: "#3CB371" }
    },
    {
        name: 'مرجان حيوي',
        id: 'vibrant-coral',
        colors: { primary: "#FF7F50", background: "#FFF0F5", secondary: "#FFE4E1", accent: "#4682B4" }
    },
    {
        name: 'فحم حديث',
        id: 'modern-charcoal',
        colors: { primary: "#36454F", background: "#F5F5F5", secondary: "#E8E8E8", accent: "#DAA520" }
    },
    {
        name: 'سماوي منعش',
        id: 'fresh-sky',
        colors: { primary: "#87CEEB", background: "#F0FFFF", secondary: "#E0FFFF", accent: "#FF6347" }
    },
    {
        name: 'توابل القرفة',
        id: 'cinnamon-spice',
        colors: { primary: "#8B4513", background: "#FFF8DC", secondary: "#FFF0E0", accent: "#20B2AA" }
    },
    {
        name: 'زمرد ملكي',
        id: 'royal-emerald',
        colors: { primary: "#008080", background: "#F0FFF0", secondary: "#E0EEE0", accent: "#B22222" }
    },
    {
        name: 'خوخ ناعم',
        id: 'soft-peach',
        colors: { primary: "#FFDAB9", background: "#FFF9F5", secondary: "#FFF5EE", accent: "#708090" }
    },
    {
        name: 'توت داكن',
        id: 'deep-berry',
        colors: { primary: "#800080", background: "#FAF0FA", secondary: "#F5E6F5", accent: "#556B2F" }
    },
    {
        name: 'ليمون حامض',
        id: 'zesty-lemon',
        colors: { primary: "#FFD700", background: "#FFFFF0", secondary: "#FFFFE0", accent: "#4169E1" }
    },
    {
        name: 'أردواز أنيق',
        id: 'sleek-slate',
        colors: { primary: "#708090", background: "#F8F9FA", secondary: "#E9ECEF", accent: "#DC143C" }
    },
    {
        name: 'أحمر ناري',
        id: 'fiery-red',
        colors: { primary: "#B22222", background: "#FFF5F5", secondary: "#FFEBEB", accent: "#00CED1" }
    },
    {
        name: 'أزرق ليلي',
        id: 'midnight-blue',
        colors: { primary: "#191970", background: "#F0F0FF", secondary: "#E0E0F8", accent: "#F0E68C" }
    },
    {
        name: 'أخضر غابي',
        id: 'forest-green',
        colors: { primary: "#228B22", background: "#F5FFF5", secondary: "#EDF7ED", accent: "#FF8C00" }
    },
    {
        name: 'طبيعة ترابية',
        id: 'earthy-nature',
        colors: { primary: "#A0522D", background: "#FAF0E6", secondary: "#F5DEB3", accent: "#5F9EA0" }
    },
    {
        name: 'بحر هادئ',
        id: 'serene-sea',
        colors: { primary: "#2E8B57", background: "#F0FFFF", secondary: "#E0F2F1", accent: "#D2691E" }
    },
    {
        name: 'عقيق بنفسجي',
        id: 'amethyst-gem',
        colors: { primary: "#9966CC", background: "#F9F7FB", secondary: "#F2E8F9", accent: "#F4A460" }
    },
    {
        name: 'غروب الشمس',
        id: 'sunset-glow',
        colors: { primary: "#FF4500", background: "#FFF8F5", secondary: "#FFEADB", accent: "#48D1CC" }
    }
];


const defaultTheme = {
    font: googleFonts[0],
    bodyFont: googleFonts[0],
    colors: colorPalettes[0].colors
}


export default function AppearancePage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [loadingTheme, setLoadingTheme] = useState(true);

    const [currentPaletteId, setCurrentPaletteId] = useState(colorPalettes[0].id);
    const [headlineFont, setHeadlineFont] = useState(googleFonts[0]);
    const [bodyFont, setBodyFont] = useState(googleFonts[0]);
    const [customColors, setCustomColors] = useState(colorPalettes[0].colors);
    
    useEffect(() => {
      if (!firestore) return;
      const themeRef = doc(firestore, 'settings', 'theme');
      
      const unsubscribe = onSnapshot(themeRef, (docSnap) => {
        if (docSnap.exists()) {
          const themeData = docSnap.data() as SiteTheme;
          setHeadlineFont(themeData.font || googleFonts[0]);
          setBodyFont(themeData.bodyFont || googleFonts[0]);
          setCustomColors(themeData.colors);
        } else {
          // No theme in DB, let's create one
          setDoc(themeRef, defaultTheme).catch(console.error);
        }
        setLoadingTheme(false);
      }, (error) => {
        console.error("Failed to load theme: ", error);
        toast({ title: 'خطأ', description: 'فشل تحميل المظهر.', variant: 'destructive'});
        setLoadingTheme(false);
      });

      return () => unsubscribe();
    }, [firestore, toast]);


    const handleColorChange = (name: keyof typeof customColors, value: string) => {
        setCustomColors(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePaletteChange = (paletteId: string) => {
        const selectedPalette = colorPalettes.find(p => p.id === paletteId) || colorPalettes[0];
        setCurrentPaletteId(selectedPalette.id);
        setCustomColors(selectedPalette.colors);
    }

    const handleSaveChanges = async () => {
       if (!firestore) {
           toast({ title: 'خطأ', description: 'فشل الاتصال بقاعدة البيانات.', variant: 'destructive'});
           return;
       }
       const themeRef = doc(firestore, 'settings', 'theme');
       const newTheme: SiteTheme = {
           font: headlineFont,
           bodyFont: bodyFont,
           colors: customColors,
       };
       try {
           await setDoc(themeRef, newTheme);
           toast({
               title: "تم الحفظ بنجاح",
               description: "تم تحديث إعدادات المظهر. قد تحتاج إلى تحديث الصفحة لرؤية التغييرات.",
           });
       } catch (err) {
           console.error("Error saving theme:", err);
           toast({ title: 'خطأ', description: 'فشل حفظ المظهر.', variant: 'destructive'});
       }
    }
    
    const siteSettings = {
        colors: {
            primaryForeground: '#FFFFFF',
            accentForeground: '#FFFFFF',
        }
    };
    
    if (loadingTheme) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }


    return (
        <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
            <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة المظهر</h2>
            <div className="grid md:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>تخصيص المظهر</CardTitle>
                            <CardDescription>قم بتغيير الألوان والخطوط لتناسب علامتك التجارية.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <fieldset>
                                <legend className="text-lg font-semibold mb-4">حزمة الألوان</legend>
                                 <Select value={currentPaletteId} onValueChange={handlePaletteChange}>
                                     <SelectTrigger>
                                        <SelectValue placeholder="اختر حزمة ألوان" />
                                     </SelectTrigger>
                                     <SelectContent>
                                        {colorPalettes.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                <span>{p.name}</span>
                                            </SelectItem>
                                        ))}
                                     </SelectContent>
                                 </Select>
                            </fieldset>
                            
                             <fieldset>
                                <legend className="text-lg font-semibold my-4">تعديل الألوان</legend>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(customColors).map(([name, value]) => (
                                        <div key={name} className="space-y-2">
                                            <Label htmlFor={name}>{name}</Label>
                                            <div className="flex items-center gap-2">
                                                <Input id={name} type="color" value={value} onChange={e => handleColorChange(name as keyof typeof customColors, e.target.value)} className="p-1 h-10 w-14" />
                                                <Input type="text" value={value} onChange={e => handleColorChange(name as keyof typeof customColors, e.target.value)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="grid grid-cols-2 gap-4">
                                <div>
                                    <legend className="text-lg font-semibold mb-4">خط العناوين</legend>
                                    <Select value={headlineFont.name} onValueChange={(val) => setHeadlineFont(googleFonts.find(f => f.name === val) || googleFonts[0])}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر خطًا" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {googleFonts.map(f => (
                                                <SelectItem key={f.name} value={f.name}>
                                                    <span style={{ fontFamily: f.family }}>{f.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div>
                                    <legend className="text-lg font-semibold mb-4">خط المحتوى</legend>
                                    <Select value={bodyFont.name} onValueChange={(val) => setBodyFont(googleFonts.find(f => f.name === val) || googleFonts[0])}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر خطًا" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {googleFonts.map(f => (
                                                <SelectItem key={f.name} value={f.name}>
                                                    <span style={{ fontFamily: f.family }}>{f.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </fieldset>
                             <Button onClick={handleSaveChanges} className="w-full">حفظ التغييرات وتطبيقها</Button>
                        </CardContent>
                    </Card>
                   
                </div>

                {/* Preview Panel */}
                <div style={{
                    '--preview-primary': hexToHSL(customColors.primary),
                    '--preview-secondary': hexToHSL(customColors.secondary),
                    '--preview-background': hexToHSL(customColors.background),
                    '--preview-accent': hexToHSL(customColors.accent),
                    '--preview-primary-foreground': hexToHSL(siteSettings.colors.primaryForeground),
                    '--preview-accent-foreground': hexToHSL(siteSettings.colors.accentForeground),
                    '--font-headline': headlineFont.family,
                    '--font-body': bodyFont.family,
                } as React.CSSProperties}>
                    <Card className="p-6" style={{ backgroundColor: `hsl(var(--preview-background))`}}>
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-headline" style={{ fontFamily: 'var(--font-headline)', color: `hsl(var(--preview-primary))` }}>معاينة حية</h3>
                            <Button style={{ fontFamily: 'var(--font-body)', backgroundColor: `hsl(var(--preview-primary))`, color: `hsl(var(--preview-primary-foreground))` }}>زر أساسي</Button>
                            <Button variant="secondary" style={{ fontFamily: 'var(--font-body)', backgroundColor: `hsl(var(--preview-secondary))` }}>زر ثانوي</Button>
                            <Card style={{ backgroundColor: `hsl(var(--preview-secondary))`}}>
                                <CardHeader>
                                    <CardTitle style={{fontFamily: 'var(--font-headline)'}}>بطاقة معاينة</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p style={{fontFamily: 'var(--font-body)'}}>هذا مثال على شكل البطاقة في متجرك.</p>
                                </CardContent>
                            </Card>
                             <div className="p-4 rounded-md" style={{ backgroundColor: `hsl(var(--preview-accent))`, color: `hsl(var(--preview-accent-foreground))` }}>
                                <p style={{fontFamily: 'var(--font-body)'}}>هذا هو اللون المميز (Accent).</p>
                             </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
