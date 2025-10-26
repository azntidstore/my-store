
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PlusCircle, Trash2, Code, Copy, Loader2, Image as ImageIcon, Star, Info } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const productSchema = z.object({
    imageUrl: z.string().url("رابط صورة صالح مطلوب.").or(z.literal('')),
    title: z.string().min(1, "العنوان مطلوب."),
    description: z.string().min(1, "الوصف مطلوب."),
});

const reviewSchema = z.object({
    text: z.string().min(1, "نص التقييم مطلوب."),
    author: z.string().min(1, "اسم صاحب التقييم مطلوب."),
    rating: z.coerce.number().min(1).max(5).default(5),
});


const formSchema = z.object({
    headerTitle: z.string().optional(),
    headerDescription: z.string().optional(),
    heroImage: z.string().url("رابط صورة صالح مطلوب.").or(z.literal('')),
    heroTitle: z.string().min(1, "عنوان رئيسي مطلوب."),
    heroDescription: z.string().min(1, "وصف مطلوب."),
    heroButtonText: z.string().min(1, "نص الزر مطلوب."),
    originalPrice: z.coerce.number().optional(),
    salePrice: z.coerce.number().min(0, "سعر العرض مطلوب."),
    productIdentifier: z.string().min(1, "معرف المنتج مطلوب."),
    products: z.array(productSchema).optional(),
    reviews: z.array(reviewSchema).optional(),
    countdownDate: z.string().optional(),
    formTitle: z.string().min(1, "عنوان النموذج مطلوب."),
    formDescription: z.string().optional(),
    footerText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;


export default function LandingPageGenerator() {
    const { toast } = useToast();
    const [generatedHtml, setGeneratedHtml] = useState('');

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            headerTitle: 'ورق الحائط العصري',
            headerDescription: 'جعل منزلك أكثر أناقة وجمالاً',
            heroImage: 'https://placehold.co/600x400/4CAF50/FFFFFF/png?text=Hero+Image',
            heroTitle: 'اكتشف تشكيلتنا الجديدة',
            heroDescription: 'أجود أنواع ورق الحائط مع تصميمات عصرية تناسب جميع الأذواق.',
            heroButtonText: 'اطلب الآن',
            originalPrice: 299,
            salePrice: 199,
            productIdentifier: 'ورق-حائط-فاخر',
            products: [
                { imageUrl: 'https://placehold.co/400x300/e8e8e8/333333/png?text=Product+1', title: 'تصميم كلاسيكي', description: 'ورق حائط أنيق يضيف لمسة كلاسيكية لمنزلك.' },
                { imageUrl: 'https://placehold.co/400x300/f0f0f0/444444/png?text=Product+2', title: 'تصميم عصري', description: 'أحدث صيحات ورق الحائط لتجعل منزلك عصري وأنيق.' },
                { imageUrl: 'https://placehold.co/400x300/f5f5f5/555555/png?text=Product+3', title: 'تصميم طبيعي', description: 'ألوان هادئة وتصاميم مستوحاة من الطبيعة.' },
            ],
            reviews: [
                { text: 'منتج رائع وخدمة عملاء ممتازة. أنصح به بشدة!', author: 'عميل سعيد', rating: 5 },
                { text: 'جودة عالية وتصميم فريد. شكراً لكم!', author: 'زبون راضٍ', rating: 4 },
            ],
            countdownDate: '',
            formTitle: 'اطلب ورق الحائط الآن',
            formDescription: 'املأ النموذج وسنقوم بالتواصل معك بأقرب وقت',
            footerText: `© ${new Date().getFullYear()} جميع الحقوق محفوظة.`,
        },
    });

    const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
        control: form.control,
        name: "products"
    });
    const { fields: reviewFields, append: appendReview, remove: removeReview } = useFieldArray({
        control: form.control,
        name: "reviews"
    });


    const generateCode = (data: FormData) => {
        const productsHtml = data.products?.map(p => `
            <div class="product">
                <img src="${p.imageUrl}" alt="${p.title}">
                <h3>${p.title}</h3>
                <p>${p.description}</p>
            </div>
        `).join('') || '';

        const reviewsHtml = data.reviews?.map(r => `
            <div class="review">
                <div class="rating">${Array.from({ length: r.rating }).map(() => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#f39c12" stroke="none"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>').join('')}</div>
                <p>"${r.text}"</p>
                <span>- ${r.author}</span>
            </div>
        `).join('') || '';

        const priceHtml = data.originalPrice && data.originalPrice > data.salePrice
        ? `<span class="original-price">${data.originalPrice.toFixed(2)} DH</span> <span class="sale-price">${data.salePrice.toFixed(2)} DH</span>`
        : `<span class="sale-price">${data.salePrice.toFixed(2)} DH</span>`;

        const html = `
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.headerTitle}</title>
    <style>
        body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: #333; direction: rtl; }
        .container { max-width: 900px; margin: 0 auto; padding: 0 20px; }
        header { background-color: #2c3e50; color: white; padding: 30px 20px; text-align: center; }
        header h1 { margin: 0; font-size: 2.5em; }
        header p { font-size: 1.2em; opacity: 0.9; }
        section { padding: 50px 0; }
        .hero { text-align: center; }
        .hero img { max-width: 100%; height: auto; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .hero button.cta { background-color: #e74c3c; color: white; padding: 15px 35px; border: none; border-radius: 50px; font-size: 1.2em; cursor: pointer; transition: background-color 0.3s; }
        .hero button.cta:hover { background-color: #c0392b; }
        #countdown-container { text-align: center; margin-bottom: 30px; }
        #countdown-container h2 { font-size: 1.5em; margin-bottom: 10px; color: #333; }
        #countdown { font-size: 2em; font-weight: bold; color: #2c3e50; background-color: #ecf0f1; padding: 20px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .product { background-color: white; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
        .product:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
        .product img { max-width: 100%; height: 200px; object-fit: cover; }
        .product h3 { margin: 15px 0 10px; font-size: 1.4em; }
        .product p { font-size: 1em; color: #666; padding: 0 20px 20px; }
        .reviews { background-color: #ecf0f1; }
        .reviews h2 { text-align: center; font-size: 2em; margin-bottom: 40px; }
        .review { background-color: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-right: 5px solid #3498db; }
        .review p { margin: 0 0 10px; font-style: italic; font-size: 1.1em; }
        .review span { font-weight: bold; color: #3498db; }
        .review .rating { display: flex; gap: 2px; margin-bottom: 8px; }
        .contact { text-align: center; }
        .contact h2 { font-size: 2.2em; }
        .contact p { font-size: 1.1em; color: #666; margin-bottom: 30px; }
        .contact form { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }
        .contact input, .contact textarea { padding: 15px; border: 1px solid #ccc; border-radius: 5px; font-size: 1em; font-family: 'Cairo', sans-serif; }
        .contact button { background-color: #27ae60; color: white; padding: 15px; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer; transition: background-color 0.3s; }
        .contact button:hover { background-color: #229954; }
        .form-response { margin-top: 20px; padding: 15px; border-radius: 5px; display: none; }
        .form-response.success { background-color: #d4edda; color: #155724; }
        .form-response.error { background-color: #f8d7da; color: #721c24; }
        .price-display { font-size: 2em; font-weight: bold; margin: 20px 0; }
        .price-display .original-price { text-decoration: line-through; color: #999; font-size: 0.7em; margin-left: 10px; }
        .price-display .sale-price { color: #e74c3c; }
        .quantity-selector { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 25px 0; }
        .quantity-selector button { background-color: #3498db; color: white; border: none; width: 40px; height: 40px; font-size: 1.5em; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .quantity-selector span { font-size: 1.5em; font-weight: bold; min-width: 50px; text-align: center; border: 1px solid #ccc; border-radius: 5px; padding: 5px 10px; background-color: white; }
        .total-price { font-size: 1.5em; font-weight: bold; margin-top: 20px; color: #2c3e50; }
        footer { background-color: #34495e; color: white; text-align: center; padding: 20px; margin-top: 50px; }
    </style>
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

        // --- Configuration ---
        const firebaseConfig = {
            apiKey: "AIzaSyB4t4v9eGsNqAf0BoKI4Ok44HUvZI55hZM",
            authDomain: "studio-3531262299-58293.firebaseapp.com",
            projectId: "studio-3531262299-58293",
        };
        const salePrice = ${data.salePrice};
        const countdownDateStr = "${data.countdownDate}";
        
        // --- State ---
        let quantity = 1;

        // --- Functions ---
        function updateTotalPrice() {
            const totalPriceElement = document.getElementById('total-price');
            if (totalPriceElement) {
                const total = salePrice * quantity;
                totalPriceElement.innerText = "الإجمالي: " + total.toFixed(2) + " DH";
            }
        }
        
        window.changeQuantity = function(amount) {
            const newQuantity = quantity + amount;
            if (newQuantity >= 1) {
                quantity = newQuantity;
                const quantityElement = document.getElementById('quantity');
                if (quantityElement) {
                    quantityElement.innerText = quantity;
                }
                updateTotalPrice();
            }
        }

        function startCountdown() {
            const countdownElement = document.getElementById('countdown');
            if (!countdownElement || !countdownDateStr) return;
            const countdownDate = new Date(countdownDateStr).getTime();

            const interval = setInterval(() => {
                const now = new Date().getTime();
                const distance = countdownDate - now;

                if (distance < 0) {
                    countdownElement.innerHTML = "انتهى العرض";
                    clearInterval(interval);
                    return;
                }
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                countdownElement.innerHTML = days + "ي " + hours + "س " + minutes + "د " + seconds + "ث ";
            }, 1000);
        }

        async function handleFormSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const responseDiv = document.getElementById('formResponse');
            const submitButton = form.querySelector('button[type="submit"]');

            if (!responseDiv || !submitButton) return;

            const orderData = {
                userId: 'landing-page-order',
                items: [{
                    productId: "${data.productIdentifier}",
                    title: "${data.productIdentifier}",
                    quantity: quantity,
                    price: salePrice,
                    image: ''
                }],
                total: salePrice * quantity,
                shippingCost: 0,
                status: 'pending',
                shippingAddress: {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    city: formData.get('city'),
                    address: formData.get('address'),
                },
                paymentMethod: 'cod',
                createdAt: serverTimestamp(),
                source: 'landing-page'
            };

            submitButton.disabled = true;
            submitButton.innerHTML = 'جاري الإرسال...';

            try {
                const app = initializeApp(firebaseConfig);
                const db = getFirestore(app);
                await addDoc(collection(db, 'orders'), orderData);
                
                responseDiv.style.display = 'block';
                responseDiv.className = 'form-response success';
                responseDiv.innerText = 'تم استلام طلبك بنجاح! سنتصل بك للتأكيد.';
                form.reset();
                quantity = 1;
                document.getElementById('quantity').innerText = quantity;
                updateTotalPrice();

            } catch (error) {
                console.error('Error creating order:', error);
                responseDiv.style.display = 'block';
                responseDiv.className = 'form-response error';
                responseDiv.innerText = 'حدث خطأ. الرجاء المحاولة مرة أخرى.';
            } finally {
                if(submitButton){
                    submitButton.disabled = false;
                    submitButton.innerText = 'أرسل الطلب';
                }
            }
        }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            updateTotalPrice();
            startCountdown();
            
            const orderForm = document.getElementById('orderForm');
            if (orderForm) {
                orderForm.addEventListener('submit', handleFormSubmit);
            }
        });
    </script>
</head>
<body>
    ${data.headerTitle ? `<header><h1>${data.headerTitle}</h1><p>${data.headerDescription || ''}</p></header>` : ''}
    <div class="container">
        <section class="hero">
            <img src="${data.heroImage}" alt="${data.heroTitle}" />
            <h2>${data.heroTitle}</h2>
            <p>${data.heroDescription}</p>
            <button class="cta" onclick="document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' });">${data.heroButtonText}</button>
        </section>
        ${productsHtml ? `<section class="products">${productsHtml}</section>` : ''}
        ${reviewsHtml ? `<section class="reviews"><div class="container"><h2>ماذا يقول عملاؤنا؟</h2>${reviewsHtml}</div></section>` : ''}
        <section class="contact" id="contact-form">
            ${data.countdownDate ? `<div id="countdown-container"><h2>العرض ينتهي خلال:</h2><div id="countdown"></div></div>` : ''}
            <h2>${data.formTitle}</h2>
            ${data.formDescription ? `<p>${data.formDescription}</p>` : ''}
            <div class="price-display">${priceHtml}</div>
            <div class="quantity-selector">
                <button type="button" id="decrease-quantity" onclick="changeQuantity(-1)">-</button>
                <span id="quantity">1</span>
                <button type="button" id="increase-quantity" onclick="changeQuantity(1)">+</button>
            </div>
            <div id="total-price" class="total-price"></div>
            <form id="orderForm">
                <input type="text" name="name" placeholder="الاسم الكامل" required />
                <input type="tel" name="phone" placeholder="رقم الهاتف" required />
                <input type="text" name="city" placeholder="المدينة" required />
                <input type="text" name="address" placeholder="العنوان الكامل" required />
                <button type="submit">أرسل الطلب</button>
            </form>
            <div id="formResponse" class="form-response"></div>
        </section>
    </div>
    ${data.footerText ? `<footer><p>${data.footerText}</p></footer>` : ''}
</body>
</html>
        `;
        setGeneratedHtml(html);
        toast({
            title: "تم توليد الكود",
            description: "يمكنك الآن نسخ الكود من الصندوق أدناه.",
        });
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedHtml).then(() => {
            toast({ title: "تم النسخ بنجاح!" });
        }, () => {
            toast({ title: "فشل النسخ", variant: "destructive" });
        });
    };
    
    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(generateCode)} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight font-headline">مولد صفحات الهبوط</h2>
                            <p className="text-muted-foreground">استخدم النموذج أدناه لإنشاء كود HTML لصفحة هبوط مخصصة.</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Code className="mr-2 h-4 w-4" />
                                توليد الكود
                            </Button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                             <Accordion type="multiple" defaultValue={['item-1', 'item-6']} className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>القسم العلوي (Header)</AccordionTrigger>
                                    <AccordionContent className="space-y-4 p-4 border rounded-md">
                                        <FormField control={form.control} name="headerTitle" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="headerDescription" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>قسم البطل (Hero)</AccordionTrigger>
                                    <AccordionContent className="space-y-4 p-4 border rounded-md">
                                        <FormField control={form.control} name="heroImage" render={({ field }) => (<FormItem><FormLabel>رابط الصورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="heroTitle" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="heroDescription" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="heroButtonText" render={({ field }) => (<FormItem><FormLabel>نص الزر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>قسم المنتجات/الميزات</AccordionTrigger>
                                    <AccordionContent className="space-y-4 p-4 border rounded-md">
                                        {productFields.map((field, index) => (
                                            <div key={field.id} className="space-y-2 border p-3 rounded-md relative">
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 left-1" onClick={() => removeProduct(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                <FormField control={form.control} name={`products.${index}.imageUrl`} render={({ field }) => (<FormItem><FormLabel>رابط الصورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`products.${index}.title`} render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`products.${index}.description`} render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendProduct({ imageUrl: '', title: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4" /> إضافة ميزة</Button>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>قسم التقييمات</AccordionTrigger>
                                    <AccordionContent className="space-y-4 p-4 border rounded-md">
                                        {reviewFields.map((field, index) => (
                                            <div key={field.id} className="space-y-2 border p-3 rounded-md relative">
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 left-1" onClick={() => removeReview(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                <FormField control={form.control} name={`reviews.${index}.text`} render={({ field }) => (<FormItem><FormLabel>نص التقييم</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`reviews.${index}.author`} render={({ field }) => (<FormItem><FormLabel>صاحب التقييم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                 <FormField control={form.control} name={`reviews.${index}.rating`} render={({ field }) => (<FormItem><FormLabel>التقييم (1-5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendReview({ text: '', author: '', rating: 5 })}><PlusCircle className="mr-2 h-4 w-4" /> إضافة تقييم</Button>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-5">
                                    <AccordionTrigger>قسم نموذج الطلب</AccordionTrigger>
                                    <AccordionContent className="space-y-4 p-4 border rounded-md">
                                        <FormField control={form.control} name="formTitle" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="formDescription" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="countdownDate" render={({ field }) => (<FormItem><FormLabel>تاريخ انتهاء العرض (اختياري)</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-6">
                                    <AccordionTrigger>القسم السفلي (Footer)</AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-md">
                                        <FormField control={form.control} name="footerText" render={({ field }) => (<FormItem><FormLabel>نص حقوق النشر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>المنتج والتسعير</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField control={form.control} name="productIdentifier" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="flex items-center gap-1">معرف المنتج <Info className="w-3 h-3" /></span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>هذا الاسم سيظهر في تفاصيل الطلب.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                     )} />
                                     <FormField control={form.control} name="originalPrice" render={({ field }) => (<FormItem><FormLabel>السعر الأصلي (DH)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={form.control} name="salePrice" render={({ field }) => (<FormItem><FormLabel>سعر العرض (DH)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </CardContent>
                            </Card>
                             {generatedHtml && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>الكود المولد</CardTitle>
                                        <CardDescription>انسخ هذا الكود وألصقه في صفحة HTML جديدة.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            readOnly
                                            value={generatedHtml}
                                            className="h-64 font-mono text-xs"
                                            dir="ltr"
                                        />
                                        <Button onClick={copyToClipboard} className="w-full mt-4">
                                            <Copy className="mr-2 h-4 w-4" />
                                            نسخ الكود
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
