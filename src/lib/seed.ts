// /src/lib/seed.ts

import type { Product, Category, Page, MenuItem } from "@/lib/types";
import { Firestore, collection, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import placeholderImages from '@/lib/placeholder-images.json';

const MOCK_MENUS_DATA: Omit<MenuItem, 'id' | 'createdAt'>[] = [
    {
        title: 'الرئيسية',
        type: 'page',
        value: '/',
        order: 0,
        location: 'header',
        status: 'active',
        is_indexed: true,
    },
    {
        title: 'جميع المنتجات',
        type: 'page',
        value: 'products',
        order: 1,
        location: 'header',
        status: 'active',
        is_indexed: true,
    },
    {
        title: 'المدونة',
        type: 'page',
        value: 'blog',
        order: 2,
        location: 'header',
        status: 'active',
        is_indexed: true,
    },
    {
        title: 'من نحن',
        type: 'page',
        value: 'about',
        order: 3,
        location: 'header',
        status: 'active',
        is_indexed: true,
    },
     {
        title: 'اتصل بنا',
        type: 'page',
        value: 'contact',
        order: 4,
        location: 'header',
        status: 'active',
        is_indexed: true,
    }
];

const MOCK_CATEGORIES_DATA: Omit<Category, 'id' | 'createdAt'>[] = [
    { name: 'ملابس تقليدية', slug: 'clothing', order: 0, imageUrl: placeholderImages.categories.clothing },
    { name: 'ديكور منزلي', slug: 'decor', order: 1, imageUrl: placeholderImages.categories.decor },
    { name: 'أدوات المطبخ', slug: 'kitchen', order: 2, imageUrl: placeholderImages.categories.kitchen },
    { name: 'منتجات جلدية', slug: 'leather', order: 3, imageUrl: placeholderImages.categories.leather },
    { name: 'مجوهرات', slug: 'jewelry', order: 4, imageUrl: placeholderImages.categories.jewelry },
    { name: 'تجميل', slug: 'beauty', order: 5, imageUrl: placeholderImages.categories.beauty },
];

const MOCK_PAGES_DATA: Omit<Page, 'id' | 'createdAt'>[] = [
    {
        title: 'من نحن',
        slug: 'about',
        type: 'static',
        content: '<h2>مرحباً في سوق مرحبا</h2><p>وُلد "سوق مرحبا" من حب عميق للثقافة المغربية الغنية والرغبة في الحفاظ على فنونها التقليدية. بدأنا رحلتنا في أزقة مراكش الضيقة، مستلهمين من الألوان الزاهية، الروائح العطرة، ومهارة الحرفيين الذين ينسجون السحر بأيديهم.</p><p>نؤمن بأن كل قطعة مصنوعة يدويًا تحمل في طياتها قصة، جزءًا من روح صانعها، ولمسة من تاريخ المغرب العريق. هدفنا هو أن نكون الجسر الذي يربط بين هؤلاء المبدعين وبينكم، لنقدم لكم كنوزًا فريدة تضيف لمسة من الأصالة والدفء إلى حياتكم.</p>',
        order: 0
    },
    {
        title: 'اتصل بنا',
        slug: 'contact',
        type: 'static',
        content: '<div id="contact-page-content"></div>',
        order: 1
    }
];

const MOCK_PRODUCTS_DATA: Omit<Product, 'id' | 'createdAt'>[] = [
    {
        title: 'قفطان مغربي أزرق',
        slug: 'blue-kaftan',
        sku: 'KFT-BLU-01',
        price: 850,
        images: [{ src: placeholderImages.products.kaftan, alt: 'Blue Kaftan', 'data-ai-hint': 'blue kaftan' }],
        badge: 'جديد',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'قفطان أزرق ملكي مطرز يدوياً بخيوط ذهبية، مثالي للمناسبات الخاصة.',
        specifications: [{name: 'الخامة', value: 'حرير'}, {name: 'التطريز', value: 'يدوي'}],
        categoryId: 'clothing',
        totalStock: 10,
        variants: [
            { id: 'v1', size: 'M', color: 'أزرق', colorCode: '#0000FF', stock: 5 },
            { id: 'v2', size: 'L', color: 'أزرق', colorCode: '#0000FF', stock: 5 },
        ]
    },
    {
        title: 'فانوس معدني تقليدي',
        slug: 'metal-lantern',
        sku: 'LNT-MTL-02',
        price: 450,
        images: [{ src: placeholderImages.products.lantern, alt: 'Metal Lantern', 'data-ai-hint': 'metal lantern' }],
        badge: 'VIP',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'فانوس معدني بتصميم شرقي أصيل، يضيف لمسة دافئة لمنزلك.',
        categoryId: 'decor',
        totalStock: 10,
        variants: []
    },
    {
        title: 'بوف جلد طبيعي',
        slug: 'leather-pouf',
        sku: 'POF-LTH-03',
        price: 600,
        images: [{ src: placeholderImages.products.pouf, alt: 'Leather Pouf', 'data-ai-hint': 'leather pouf' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'بوف مصنوع من الجلد الطبيعي الفاخر، متوفر بألوان متعددة.',
        categoryId: 'decor',
        totalStock: 10,
        variants: []
    },
    {
        title: 'طاجين خزفي ملون',
        slug: 'ceramic-tagine',
        sku: 'TGN-CER-04',
        price: 350,
        images: [{ src: placeholderImages.products.tagine, alt: 'Ceramic Tagine', 'data-ai-hint': 'ceramic tagine' }],
        badge: 'تخفيض',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'طاجين خزفي ملون لطهي أشهى المأكولات المغربية.',
        categoryId: 'kitchen',
        totalStock: 10,
        variants: []
    },
    {
        title: 'بلغة صفراء',
        slug: 'yellow-slippers',
        sku: 'SLP-YEL-05',
        price: 250,
        images: [{ src: placeholderImages.products.slippers, alt: 'Yellow Slippers', 'data-ai-hint': 'yellow slippers' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'بلغة تقليدية مصنوعة من الجلد الناعم، مريحة وأنيقة.',
        categoryId: 'clothing',
        totalStock: 10,
        variants: []
    },
    {
        title: 'طقم شاي مغربي',
        slug: 'tea-set',
        sku: 'TEA-SET-06',
        price: 700,
        images: [{ src: placeholderImages.products['tea-set'], alt: 'Tea Set', 'data-ai-hint': 'tea set' }],
        badge: 'VIP',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'طقم شاي متكامل بتصميم مغربي أصيل، مثالي لاستقبال الضيوف.',
        categoryId: 'kitchen',
        totalStock: 10,
        variants: []
    },
    {
        title: 'سجادة بربرية',
        slug: 'berber-rug',
        sku: 'RUG-BER-07',
        price: 1200,
        images: [{ src: placeholderImages.products.rug, alt: 'Berber Rug', 'data-ai-hint': 'berber rug' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'سجادة بربرية مصنوعة يدوياً من الصوف الطبيعي.',
        categoryId: 'decor',
        totalStock: 5,
        variants: []
    },
    {
        title: 'زيت أركان نقي',
        slug: 'argan-oil',
        sku: 'OIL-ARG-08',
        price: 150,
        images: [{ src: placeholderImages.products.argan, alt: 'Argan Oil', 'data-ai-hint': 'argan oil' }],
        badge: 'الأكثر مبيعاً',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'زيت الأركان النقي للعناية بالبشرة والشعر.',
        categoryId: 'beauty',
        totalStock: 20,
        variants: []
    },
    {
        title: 'حقيبة جلدية مصنوعة يدوياً',
        slug: 'handmade-leather-bag',
        sku: 'BAG-LTH-09',
        price: 950,
        images: [{ src: placeholderImages.products['leather-bag'], alt: 'Handmade Leather Bag', 'data-ai-hint': 'leather bag' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'حقيبة جلدية بتصميم فريد، مصنوعة بحرفية عالية.',
        categoryId: 'leather',
        totalStock: 8,
        variants: []
    },
    {
        title: 'جلابة رجالية',
        slug: 'men-djellaba',
        sku: 'DJL-MEN-10',
        price: 750,
        images: [{ src: placeholderImages.products.djellaba, alt: 'Men Djellaba', 'data-ai-hint': 'men djellaba' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'جلابة رجالية من قماش عالي الجودة، مناسبة لكل الأوقات.',
        categoryId: 'clothing',
        totalStock: 12,
        variants: []
    },
    {
        title: 'مرآة بإطار نحاسي',
        slug: 'brass-mirror',
        sku: 'MIR-BRS-11',
        price: 880,
        images: [{ src: placeholderImages.products.mirror, alt: 'Brass Mirror', 'data-ai-hint': 'brass mirror' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'مرآة حائط بإطار نحاسي منقوش يدويًا.',
        categoryId: 'decor',
        totalStock: 7,
        variants: []
    },
    {
        title: 'مجموعة بهارات مغربية',
        slug: 'moroccan-spices',
        sku: 'SPC-MOR-12',
        price: 120,
        images: [{ src: placeholderImages.products.spices, alt: 'Moroccan Spices', 'data-ai-hint': 'moroccan spices' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'تشكيلة من البهارات المغربية الأساسية لمطبخك.',
        categoryId: 'kitchen',
        totalStock: 30,
        variants: []
    },
    {
        title: 'قلادة فضية',
        slug: 'silver-necklace',
        sku: 'NEC-SLV-13',
        price: 550,
        images: [{ src: placeholderImages.products.necklace, alt: 'Silver Necklace', 'data-ai-hint': 'silver necklace' }],
        badge: 'جديد',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'قلادة فضية بتصميم مستوحى من التراث الأمازيغي.',
        categoryId: 'jewelry',
        totalStock: 15,
        variants: []
    },
    {
        title: 'صندوق خشبي مزخرف',
        slug: 'wooden-box',
        sku: 'BOX-WDN-14',
        price: 420,
        images: [{ src: placeholderImages.products['wood-box'], alt: 'Wooden Box', 'data-ai-hint': 'wooden box' }],
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'صندوق خشبي مزخرف لحفظ المجوهرات والأشياء الثمينة.',
        categoryId: 'decor',
        totalStock: 9,
        variants: []
    },
    {
        title: 'حذاء جلدي رجالي',
        slug: 'leather-shoes',
        sku: 'SHOE-LTH-15',
        price: 680,
        images: [{ src: placeholderImages.products.shoes, alt: 'Leather Shoes', 'data-ai-hint': 'leather shoes' }],
        description: '<p>وصف طويل للمنتجG...</p>',
        shortDescription: 'حذاء جلدي أنيق ومريح مصنوع يدويًا.',
        categoryId: 'leather',
        totalStock: 11,
        variants: []
    },
    {
        title: 'أطباق تقديم خزفية',
        slug: 'ceramic-plates',
        sku: 'PLT-CER-16',
        price: 320,
        images: [{ src: placeholderImages.products.plates, alt: 'Ceramic Plates', 'data-ai-hint': 'ceramic plates' }],
        badge: 'تخفيض',
        description: '<p>وصف طويل للمنتج...</p>',
        shortDescription: 'مجموعة أطباق تقديم خزفية مرسومة يدويًا.',
        categoryId: 'kitchen',
        totalStock: 18,
        variants: []
    }
  ];

/**
 * Seeds the database with mock data if collections are empty.
 * This should only be called once, typically on app startup.
 * @param db The Firestore instance.
 */
export async function seedDatabase(db: Firestore) {
    const seedables: Record<string, any[]> = {
        products: MOCK_PRODUCTS_DATA,
        categories: MOCK_CATEGORIES_DATA,
        pages: MOCK_PAGES_DATA,
        menus: MOCK_MENUS_DATA,
    };

    for (const [collectionName, data] of Object.entries(seedables)) {
        try {
            const colRef = collection(db, collectionName);
            const snapshot = await getDocs(colRef);
            if (snapshot.empty) {
                console.log(`Collection '${collectionName}' is empty. Seeding...`);
                const batch = writeBatch(db);
                data.forEach(itemData => {
                    const docRef = doc(colRef); // Automatically generate ID
                    batch.set(docRef, {
                        ...itemData,
                        createdAt: serverTimestamp(),
                    });
                });
                await batch.commit();
                console.log(`Collection '${collectionName}' seeded successfully.`);
            } else {
                // console.log(`Collection '${collectionName}' already contains data. Skipping seed.`);
            }
        } catch (error) {
            console.error(`Error seeding collection '${collectionName}':`, error);
        }
    }
}
