'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader } from 'lucide-react';
import { Logo } from '@/components/icons';

const ADMIN_KEY = "ua1506";

export default function AdminLoginPage() {
  const [step, setStep] = useState<'credentials' | 'admin_key'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!auth) {
        toast({ title: 'خطأ', description: 'لم يتم تهيئة خدمة المصادقة.', variant: 'destructive'});
        setIsLoading(false);
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStep('admin_key');
    } catch (err: any) {
      console.error("Login failed:", err);
      let errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      if (err.code === 'auth/invalid-credential') {
        errorMessage = "بيانات الاعتماد غير صالحة. يرجى التحقق والمحاولة مرة أخرى.";
      }
      setError(errorMessage);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (adminKey === ADMIN_KEY) {
      toast({
        title: "تم التحقق بنجاح",
        description: "جاري توجيهك إلى لوحة التحكم.",
      });
      router.replace('/admin');
    } else {
      setError("مفتاح الإدارة غير صحيح.");
      toast({
        title: "خطأ في التحقق",
        description: "مفتاح الإدارة الذي أدخلته غير صحيح.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-8">
        <Logo />
      </div>
      {step === 'credentials' ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">تسجيل دخول المسؤول</CardTitle>
            <CardDescription>الخطوة 1 من 2: أدخل بيانات الاعتماد الخاصة بك.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ouaddou.abdellah.topo@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader className="animate-spin" /> : 'التالي'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">التحقق الإضافي</CardTitle>
            <CardDescription>الخطوة 2 من 2: أدخل مفتاح الإدارة للمتابعة.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminKeySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-key">مفتاح الإدارة</Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="********"
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader className="animate-spin" /> : 'تأكيد الدخول'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
