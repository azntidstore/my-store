'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type OrderStatus } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { updateOrderStatus } from '@/app/use-cases/orders';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'قيد المعالجة', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: 'confirmed', label: 'تم التأكيد', color: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'shipped', label: 'تم الشحن', color: 'bg-indigo-500 hover:bg-indigo-600' },
  { value: 'delivered', label: 'تم التوصيل', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'cancelled', label: 'تم الإلغاء', color: 'bg-red-500 hover:bg-red-600' },
];

export default function OrderStatusBadge({ orderId, currentStatus }: OrderStatusBadgeProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!firestore) {
      toast({ title: 'خطأ', description: 'فشل الاتصال بقاعدة البيانات.', variant: 'destructive' });
      return;
    }
    try {
      await updateOrderStatus(firestore, orderId, newStatus);
      toast({ title: 'نجاح', description: 'تم تحديث حالة الطلب بنجاح.' });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({ title: 'خطأ', description: 'فشل تحديث حالة الطلب.', variant: 'destructive' });
    }
  };
  
  const statusInfo = statusOptions.find(s => s.value === currentStatus);

  return (
     <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className={cn(
        "w-[140px] border-none text-white focus:ring-0",
        statusInfo?.color
      )}>
        <SelectValue placeholder="تغيير الحالة..." />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
             <div className="flex items-center">
                <span className={cn("inline-block w-2 h-2 rounded-full mr-2", option.color)}></span>
                <span>{option.label}</span>
             </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
