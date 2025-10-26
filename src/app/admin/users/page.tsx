
'use client';
import { useMemo, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { User as AppUser } from "@/lib/types";
import { Loader2, PlusCircle, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';


const availableRoles = [
    { id: 'admin', label: 'Admin' },
    { id: 'editor', label: 'Editor' },
    { id: 'viewer', label: 'Viewer' },
];

// This is a mock function. In a real app, this would be a cloud function call.
// We are simulating the call to set custom claims.
async function setCustomUserClaims(uid: string, roles: string[]): Promise<{success: boolean, error?: string}> {
    console.log(`Simulating setting custom claims for UID: ${uid}`, { admin: roles.includes('admin') });
    // In a real scenario, this function doesn't exist on the client.
    // This is a placeholder to represent the action.
    // The actual claim setting happens on the backend.
    
    // For the prototype, we will directly update the user's document in Firestore
    // as we don't have a backend function to set claims. This is NOT secure for production.
    try {
        const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
        const { initializeFirebase } = await import('@/firebase');
        const { firestore } = initializeFirebase();
        
        if (firestore) {
            const userRef = doc(firestore, "users", uid);
            await updateDoc(userRef, { roles });
            return { success: true };
        } else {
            return { success: false, error: "Firestore not initialized." };
        }
    } catch(e: any) {
        return { success: false, error: e.message };
    }
}


const addUserSchema = z.object({
  displayName: z.string().min(3, "الاسم مطلوب."),
  email: z.string().email("البريد الإلكتروني غير صالح."),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل."),
  roles: z.array(z.string()).min(1, "يجب تحديد دور واحد على الأقل."),
});

function AddUserForm({ onClose }: { onClose: () => void }) {
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof addUserSchema>>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            displayName: '',
            email: '',
            password: '',
            roles: ['viewer'],
        },
    });

    const { isSubmitting } = form.formState;

    const onSubmit = async (values: z.infer<typeof addUserSchema>) => {
        if (!auth || !firestore) {
            toast({ title: "خطأ", description: "خدمات Firebase غير متاحة.", variant: "destructive" });
            return;
        }

        try {
            // Step 1: Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            // Step 2: Create user document in Firestore
            const userRef = doc(firestore, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                displayName: values.displayName,
                email: values.email,
                roles: values.roles,
                createdAt: serverTimestamp(),
            });

            // Step 3 (Simulated): Set custom claims. In a real app, this would be a backend call.
            await setCustomUserClaims(user.uid, values.roles);
            
            toast({ title: "نجاح", description: "تم إنشاء المستخدم بنجاح." });
            form.reset();
            onClose();

        } catch (error: any) {
            console.error("Error creating user:", error);
            let description = "فشل إنشاء المستخدم. الرجاء المحاولة مرة أخرى.";
            if (error.code === 'auth/email-already-in-use') {
                description = "هذا البريد الإلكتروني مستخدم بالفعل.";
            }
            toast({ title: "خطأ", description, variant: "destructive" });
        }
    };

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl><Input placeholder="اسم المستخدم" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl><Input type="password" placeholder="********" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel>الأدوار</FormLabel>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                       <span>{field.value.join(', ') || 'اختر الأدوار'}</span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>الأدوار المتاحة</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {availableRoles.map((role) => (
                                        <DropdownMenuCheckboxItem
                                            key={role.id}
                                            checked={field.value.includes(role.id)}
                                            onCheckedChange={(checked) => {
                                                const newRoles = checked
                                                    ? [...field.value, role.id]
                                                    : field.value.filter((r) => r !== role.id);
                                                field.onChange(newRoles);
                                            }}
                                        >
                                            {role.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">إلغاء</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        إنشاء مستخدم
                    </Button>
                </DialogFooter>
            </form>
         </Form>
    );
}


function RoleSelector({ user }: { user: AppUser }) {
    const { toast } = useToast();
    const [currentRoles, setCurrentRoles] = useState(user.roles || []);
    
    // Disable for the super admin
    const isSuperAdminUser = user.email === "ouaddou.abdellah.topo@gmail.com";

    const handleRoleChange = async (roleId: string, checked: boolean) => {
        const newRoles = checked 
            ? [...currentRoles, roleId]
            : currentRoles.filter(r => r !== roleId);
        
        setCurrentRoles(newRoles); // Optimistic update

        const result = await setCustomUserClaims(user.uid, newRoles);

        if (result.success) {
            toast({ title: "نجاح", description: `تم تحديث أدوار ${user.displayName}.` });
        } else {
            setCurrentRoles(currentRoles); // Revert on error
            toast({ title: "خطأ", description: `فشل تحديث أدوار المستخدم: ${result.error}`, variant: "destructive" });
        }
    };
    
    if (isSuperAdminUser) {
        return <Badge>Super Admin</Badge>;
    }


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="outline" className="w-[180px] justify-between" disabled={isSuperAdminUser}>
                    <span className="truncate">{currentRoles.join(', ') || 'لا توجد أدوار'}</span>
                     <ChevronDown className="h-4 w-4 opacity-50" />
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>تعديل الأدوار</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {availableRoles.map(role => (
                    <DropdownMenuCheckboxItem
                        key={role.id}
                        checked={currentRoles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleChange(role.id, checked)}
                    >
                        {role.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


export default function AdminUsersPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users, isLoading: loading, error } = useCollection<AppUser>(usersQuery);

     useEffect(() => {
        if (error) {
            // Error is handled by the global error listener
        }
    }, [error, toast]);
    
    const handleDeleteUser = async (userId: string) => {
        if (!firestore) return;
        // Note: This only deletes the Firestore user document, not the Firebase Auth user.
        try {
            await deleteDoc(doc(firestore, "users", userId));
            toast({ title: "نجاح", description: "تم حذف مستند المستخدم." });
        } catch (err) {
            toast({ title: "خطأ", description: "فشل حذف مستند المستخدم.", variant: "destructive" });
        }
    };
    
    const sortedUsers = useMemo(() => {
        if (!users) return [];
        return [...users].sort((a, b) => {
            if (a.email === 'ouaddou.abdellah.topo@gmail.com') return -1;
            if (b.email === 'ouaddou.abdellah.topo@gmail.com') return 1;
            const aIsAdmin = a.roles?.includes('admin');
            const bIsAdmin = b.roles?.includes('admin');
            if (aIsAdmin && !bIsAdmin) return -1;
            if (!aIsAdmin && bIsAdmin) return 1;
            return (a.displayName || '').localeCompare(b.displayName || '');
        });
    }, [users]);

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">إدارة المستخدمين</h2>
                    <p className="text-muted-foreground">
                        عرض، تعديل، وحذف المستخدمين وصلاحياتهم.
                    </p>
                </div>
                 <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> إضافة مستخدم
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                            <DialogDescription>
                                أدخل تفاصيل المستخدم الجديد لإنشاء حساب له في النظام.
                            </DialogDescription>
                        </DialogHeader>
                        <AddUserForm onClose={() => setIsAddUserOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>قائمة المستخدمين</CardTitle>
                    <CardDescription>
                        إجمالي {users?.length || 0} مستخدم.
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
                                    <TableHead>الاسم</TableHead>
                                    <TableHead>البريد الإلكتروني</TableHead>
                                    <TableHead>الأدوار</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedUsers && sortedUsers.map((user, index) => (
                                    <TableRow key={user.uid} className={cn(index % 2 === 0 ? 'bg-muted/50' : '')}>
                                        <TableCell className="font-medium">
                                            {user.displayName || 'غير متوفر'}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <RoleSelector user={user} />
                                        </TableCell>
                                        <TableCell className="text-left">
                                           {user.email !== "ouaddou.abdellah.topo@gmail.com" && (
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
                                                          هذا الإجراء سيحذف سجل المستخدم من قاعدة البيانات، لكنه لن يحذف حساب المصادقة الخاص به.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>متابعة</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                           )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
