'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {getProductRecommendations} from '@/ai/flows/product-recommendations';
import {Loader} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

// Mock data, in a real app this would come from user's state or db
const mockUserHistory = 'المستخدم اشترى سابقاً قفطان وديكورات منزلية. يبدي اهتماماً بالمنتجات الجلدية.';
const mockProductCatalog = 'طاجين, جلابة, بوف جلدي, زيت الأركان, مصباح نحاسي';

export default function ProductRecommendations() {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();

  const handleGetRecommendations = async () => {
    setLoading(true);
    setRecommendations([]);
    try {
      const result = await getProductRecommendations({
        userHistory: mockUserHistory,
        productCatalog: mockProductCatalog,
      });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب التوصيات. الرجاء المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">توصيات خاصة لك</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              بناءً على اهتماماتك، قد تعجبك هذه المنتجات. اضغط على الزر لتوليد توصيات جديدة باستخدام الذكاء الاصطناعي.
            </p>
            <Button onClick={handleGetRecommendations} disabled={loading} size="lg">
              {loading && <Loader className="ml-2 h-5 w-5 animate-spin" />}
              {loading ? 'جاري التفكير...' : 'احصل على توصيات'}
            </Button>

            {recommendations.length > 0 && (
              <div className="mt-8 text-right">
                <h4 className="font-bold mb-4">مقترحاتنا:</h4>
                <ul className="list-disc list-inside space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-lg">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
