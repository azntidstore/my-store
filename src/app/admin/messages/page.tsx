'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, orderBy, query, deleteDoc } from 'firebase/firestore';
import type { Message, User, MessageStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, Trash2, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import MessageStatusBadge from '@/components/admin/message-status';
import { cn } from '@/lib/utils';

const getStatusClassNames = (status: MessageStatus) => {
    switch (status) {
        case 'unread':
            return 'bg-blue-500/10';
        case 'read':
            return 'bg-gray-500/10';
        default:
            return 'bg-transparent';
    }
};

function MessageRow({ message }: { message: Message }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const statusClass = getStatusClassNames(message.status);

    const handleDelete = async () => {
        if (!firestore) return;
        const msgRef = doc(firestore, 'messages', message.id);
        try {
            await deleteDoc(msgRef);
            toast({
                title: "تم الحذف بنجاح",
                description: "تم حذف الرسالة.",
            });
        } catch (error) {
             toast({
                title: "خطأ",
                description: "فشل حذف الرسالة.",
                variant: "destructive"
            });
        }
    }
    
    const senderName = message.senderInfo?.name || 'مستخدم غير معروف';
    const senderInitial = senderName.charAt(0) || 'U';

    return (
        <Collapsible key={message.id} asChild>
            <TableBody>
                <TableRow className={cn(statusClass, 'transition-colors')}>
                    <TableCell className="w-[50px]">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                <span className="sr-only">Toggle details</span>
                            </Button>
                        </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{senderInitial}</AvatarFallback>
                            </Avatar>
                            <span>{senderName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {message.createdAt?.toDate ? format(message.createdAt.toDate(), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <MessageStatusBadge messageId={message.id} currentStatus={message.status || 'unread'} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-sm">
                        {message.content}
                    </TableCell>
                     <TableCell className="text-left">
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
                                        هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الرسالة نهائيًا.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>متابعة</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                    <TableRow>
                        <TableCell colSpan={6} className="p-0">
                           <div className="p-6 bg-muted/50">
                               <h4 className="font-bold mb-2">محتوى الرسالة الكامل:</h4>
                               <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                               {message.senderInfo?.email && (
                                   <p className="text-xs text-muted-foreground mt-4">بريد المرسل: {message.senderInfo.email}</p>
                               )}
                           </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleContent>
            </TableBody>
        </Collapsible>
    )
}


export default function AdminMessagesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'messages'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: messages, isLoading: loading, error } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
       <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">الرسائل الواردة</h2>
                <p className="text-muted-foreground">
                    عرض وإدارة الرسائل من العملاء والزوار.
                </p>
            </div>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>صندوق الوارد</CardTitle>
          <CardDescription>
            إجمالي {messages?.length || 0} رسالة.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
           ) : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"><span className="sr-only">Details</span></TableHead>
                        <TableHead>المرسل</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead className="hidden md:table-cell">الحالة</TableHead>
                        <TableHead className="hidden md:table-cell">مقتطف</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                
                {messages && messages.map((message) => (
                    <MessageRow key={message.id} message={message} />
                ))}
                
             </Table>
           )}
           {!loading && messages?.length === 0 && (
                <div className="text-center p-12 text-muted-foreground">
                    لا توجد رسائل لعرضها.
                </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
