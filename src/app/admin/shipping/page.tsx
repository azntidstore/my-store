
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { ShippingZone } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, Truck, BadgeDollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// --- Form Schema and Component ---

const rateSchema = z.object({
  name: z.string().min(1, 'اسم السعر مطلوب.'),
  price: z.coerce.number().min(0, 'السعر يجب أن يكون إيجابيا.'),
  conditionType: z.enum(['none', 'min_order_value']).default('none'),
  conditionValue: z.coerce.number().optional(),
});

const shippingZoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'اسم المنطقة مطلوب.'),
  cities: z.string().min(2, 'يجب إدخال مدينة واحدة على الأقل.'),
  rates: z.array(rateSchema).min(1, 'يجب إضافة سعر شحن واحد على الأقل.'),
});

type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>;

function ShippingZoneForm({ zone, onSave, onDone }: { zone?: ShippingZone, onSave: (data: ShippingZoneFormData) => Promise<void>, onDone: () => void }) {
  const form = useForm<ShippingZoneFormData>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: zone ? {
        ...zone,
        cities: zone.cities.join(', '), // Convert array to comma-separated string for editing
        rates: zone.rates.map(r => ({...r, conditionType: r.conditionType || 'none'}))
    } : { name: '', cities: '', rates: [{ name: 'توصيل عادي', price: 30, conditionType: 'none' }] },
  });

  const { isSubmitting } = form.formState;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rates",
  });

  const handleFormSubmit = async (data: ShippingZoneFormData) => {
    await onSave(data);
    onDone();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المنطقة</FormLabel>
              <FormControl><Input placeholder="مثال: الدار البيضاء الكبرى" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المدن</FormLabel>
              <FormControl><Textarea placeholder="الدار البيضاء، المحمدية، برشيد..." {...field} /></FormControl>
              <FormDescription>أدخل أسماء المدن مفصولة بفاصلة (,).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
            <Label className="mb-2 block">أسعار الشحن</Label>
            <div className="space-y-3">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-end gap-2 p-3 border rounded-md">
                     <FormField
                        control={form.control}
                        name={`rates.${index}.name`}
                        render={({ field }) => (
                            <FormItem>
                               <FormLabel>اسم السعر</FormLabel>
                                <FormControl><Input placeholder="توصيل عادي" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                      control={form.control}
                      name={`rates.${index}.conditionType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الشرط</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر شرطًا" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">بدون شرط</SelectItem>
                              <SelectItem value="min_order_value">قيمة الطلب أكبر من</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rates.${index}.conditionValue`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>القيمة (DH)</FormLabel>
                          <FormControl><Input type="number" placeholder="500" {...field} className="w-28" /></FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name={`rates.${index}.price`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>السعر (DH)</FormLabel>
                                <FormControl><Input type="number" placeholder="30" {...field} className="w-24" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="self-center">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => append({ name: '', price: 0, conditionType: 'none', conditionValue: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                إضافة سعر
            </Button>
        </div>

        <DialogFooter>
           <DialogClose asChild>
              <Button type="button" variant="secondary">إلغاء</Button>
           </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function AdminShippingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | undefined>(undefined);
  
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);
    const zonesQuery = query(collection(firestore, 'shipping-zones'), orderBy('name'));
    
    const unsubscribe = onSnapshot(zonesQuery, (snapshot) => {
        const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingZone));
        setShippingZones(zones);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching shipping zones:", error);
        toast({ title: "خطأ", description: "فشل تحميل مناطق الشحن.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const handleSaveZone = async (data: ShippingZoneFormData) => {
    if (!firestore) return;
    
    const citiesArray = data.cities.split(',').map(city => city.trim()).filter(Boolean);
    const payload = {
        name: data.name,
        cities: citiesArray,
        rates: data.rates.map(rate => ({
            ...rate,
            conditionValue: rate.conditionValue || 0,
            conditionType: rate.conditionType || 'none'
        }))
    };

    try {
        if (editingZone) {
          const zoneRef = doc(firestore, 'shipping-zones', editingZone.id);
          await updateDoc(zoneRef, payload);
          toast({ title: 'نجاح', description: 'تم تحديث منطقة الشحن.' });
        } else {
          const colRef = collection(firestore, 'shipping-zones');
          await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
          toast({ title: 'نجاح', description: 'تم إنشاء منطقة الشحن.' });
        }
        setIsFormOpen(false);
    } catch (err: any) {
        toast({ title: 'خطأ', description: `فشل حفظ المنطقة: ${err.message}`, variant: 'destructive' });
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!firestore) return;
    const zoneRef = doc(firestore, 'shipping-zones', id);
    try {
        await deleteDoc(zoneRef);
        toast({ title: 'نجاح', description: 'تم حذف منطقة الشحن.' });
    } catch(err: any) {
        toast({ title: 'خطأ', description: `فشل حذف المنطقة: ${err.message}`, variant: 'destructive' });
    }
  };
  
  const handleOpenEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setIsFormOpen(true);
  }

  const handleOpenAdd = () => {
    setEditingZone(undefined);
    setIsFormOpen(true);
  }


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة الشحن</h2>
          <p className="text-muted-foreground">
            قم بإعداد مناطق وأسعار الشحن لمتجرك.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleOpenAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" /> إضافة منطقة شحن
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingZone ? 'تعديل منطقة الشحن' : 'إنشاء منطقة جديدة'}</DialogTitle>
                </DialogHeader>
                <ShippingZoneForm
                    zone={editingZone}
                    onSave={handleSaveZone}
                    onDone={() => setIsFormOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </div>

       {isLoading && (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      )}

      {!isLoading && shippingZones && shippingZones.length === 0 && (
         <Card>
             <CardContent className="p-0">
                <div className="text-center p-12 text-muted-foreground">
                    <Truck className="mx-auto h-12 w-12 mb-4" />
                    <p>لم تقم بإعداد أي مناطق شحن بعد.</p>
                     <p className="text-sm">انقر على "إضافة منطقة شحن" للبدء.</p>
                </div>
            </CardContent>
         </Card>
      )}

      {!isLoading && shippingZones && shippingZones.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shippingZones.map(zone => (
                  <Card key={zone.id} className="flex flex-col">
                      <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                              <span>{zone.name}</span>
                               <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(zone)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                       <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف منطقة الشحن نهائيًا.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteZone(zone.id)}>متابعة</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-3">
                         <div>
                            <h4 className="font-semibold text-sm mb-2">المدن المشمولة:</h4>
                            <ScrollArea className="h-24 w-full rounded-md border p-3">
                                <div className="flex flex-wrap gap-2">
                                    {zone.cities.map(city => (
                                        <Badge key={city} variant="secondary">{city}</Badge>
                                    ))}
                                </div>
                            </ScrollArea>
                         </div>
                         <div>
                            <h4 className="font-semibold text-sm mb-2">أسعار الشحن:</h4>
                            <div className="space-y-2">
                                {zone.rates.map((rate, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">{rate.name}</span>
                                            {rate.conditionType === 'min_order_value' && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                                <Info className="w-3 h-3"/>
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>يُطبق عندما تكون قيمة الطلب أكبر من {rate.conditionValue} DH</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <span className="font-semibold">{rate.price} DH</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      )}

    </div>
  );
}
