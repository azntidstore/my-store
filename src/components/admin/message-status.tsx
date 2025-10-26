'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type MessageStatus } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { updateMessageStatus } from '@/app/use-cases/messages';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  messageId: string;
  currentStatus: MessageStatus;
}

const statusOptions: { value: MessageStatus; label: string; color: string }[] = [
  { value: 'unread', label: 'غير مقروءة', color: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'read', label: 'مقروءة', color: 'bg-gray-500 hover:bg-gray-600' },
];

export default function MessageStatusBadge({ messageId, currentStatus }: MessageStatusProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: MessageStatus) => {
    if (!firestore) {
      toast({ title: 'خطأ', description: 'فشل الاتصال بقاعدة البيانات.', variant: 'destructive' });
      return;
    }
    try {
      await updateMessageStatus(firestore, messageId, newStatus);
      toast({ title: 'نجاح', description: 'تم تحديث حالة الرسالة بنجاح.' });
    } catch (error) {
      console.error('Failed to update message status:', error);
      toast({ title: 'خطأ', description: 'فشل تحديث حالة الرسالة.', variant: 'destructive' });
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
