import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MapPin, Upload, DollarSign, Edit, AlertCircle } from "lucide-react";

import { algeriaData, getBaladiyatByWilaya } from "@/lib/algeria-complete";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
const backendUrl = "http://localhost:3000/api";

const Users = () => {
    const { role: currentUserRole, user: authUser } = useAuth();
    const currentUserId = authUser?.uid;
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBalanceOpen, setIsBalanceOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<any>(null);

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        role: "retailer",
        wilaya: "",
        baladiya: "",
        location: "", // Restored Google Maps Link
        idCard: null as File | null
    });

    const [balanceAmount, setBalanceAmount] = useState("");
    const [transactionType, setTransactionType] = useState("cash"); // cash | credit | repay

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month
    const [availableBaladiyat, setAvailableBaladiyat] = useState<string[]>([]);

    // Fetch Users and Current User
    useEffect(() => {
        fetchUsers();
        fetchCurrentUser();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Build query parameters based on role
            let url = `${backendUrl}/users`;
            const params = new URLSearchParams();

            // If wholesaler, only show retailers they created
            if (currentUserRole === 'wholesaler' && currentUserId) {
                params.append('createdBy', currentUserId);
                params.append('role', 'retailer');
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log('[Users] Fetching with URL:', url);

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched users:', data);
                console.log('Number of users:', data.length);
                setUsers(data);
            } else {
                console.error('Failed to fetch users, status:', res.status);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const idTokenResult = await user.getIdTokenResult();
                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    role: idTokenResult.claims.role
                });
            } catch (error) {
                console.error('Failed to fetch current user:', error);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${backendUrl}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    wilaya: formData.wilaya,
                    baladiya: formData.baladiya,
                    location: formData.location,
                    idCardUrl: "https://placehold.co/400?text=ID+Card",
                    createdBy: currentUser?.uid || null
                })
            });

            if (res.ok) {
                alert("تم إضافة المستخدم بنجاح!");
                setIsAddOpen(false);
                fetchUsers();
                setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    password: "",
                    role: "retailer",
                    wilaya: "",
                    baladiya: "",
                    location: "",
                    idCard: null
                });
            } else {
                const err = await res.json();
                alert("خطأ: " + err.error);
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            phone: user.phone,
            email: user.email || "",
            password: "",
            role: user.role || "retailer",
            wilaya: user.wilaya || "",
            baladiya: user.baladiya || "",
            location: user.location || "",
            idCard: null
        });

        // Load baladiyat if wilaya exists
        if (user.wilaya) {
            const wilayaCode = user.wilaya.split(" - ")[0];
            setAvailableBaladiyat(getBaladiyatByWilaya(wilayaCode));
        }

        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            const res = await fetch(`${backendUrl}/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    role: formData.role,
                    wilaya: formData.wilaya,
                    baladiya: formData.baladiya,
                    location: formData.location,
                })
            });

            if (res.ok) {
                alert("تم تحديث البيانات بنجاح!");
                setIsEditOpen(false);
                fetchUsers();
            } else {
                alert("خطأ في التحديث");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const handleBalanceClick = (user: any) => {
        setSelectedUser(user);
        setBalanceAmount("");
        setTransactionType("cash");
        setIsBalanceOpen(true);
    };

    const handleToggleStatus = (user: any) => {
        console.log('handleToggleStatus called for user:', user.name, 'status:', user.status);
        setUserToToggle(user);
        setIsConfirmOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!userToToggle) return;

        const action = userToToggle.status === 'Disabled' ? 'تفعيل' : 'تعطيل';
        console.log('User confirmed, sending request...');

        try {
            const res = await fetch(`${backendUrl}/users/${userToToggle.id}/toggle-status`, {
                method: 'POST'
            });

            console.log('Response received:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('Response data:', data);
                alert(`تم ${action} الحساب بنجاح`);
                // Refresh the users list
                fetchUsers();
            } else {
                console.error('Request failed with status:', res.status);
                alert('فشل في تغيير حالة الحساب');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('خطأ في الاتصال بالسيرفر');
        } finally {
            setIsConfirmOpen(false);
            setUserToToggle(null);
        }
    };

    const handleBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !balanceAmount) return;
        try {
            const res = await fetch(`${backendUrl}/users/${selectedUser.id}/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(balanceAmount),
                    type: transactionType === 'zero' ? 'set' : transactionType,
                    chargedBy: authUser?.uid
                })
            });

            if (res.ok) {
                alert("تمت العملية بنجاح!");
                setIsBalanceOpen(false);
                fetchUsers();
            } else {
                const err = await res.json();
                alert("خطأ: " + err.error);
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    // Filtering Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm);

        const matchesRole = roleFilter === "all" || user.role === roleFilter;

        let matchesDate = true;
        if (dateFilter !== "all") {
            const userDate = new Date(user.createdAt);
            const now = new Date();
            if (dateFilter === "today") {
                matchesDate = userDate.toDateString() === now.toDateString();
            } else if (dateFilter === "week") {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                matchesDate = userDate >= weekAgo;
            } else if (dateFilter === "month") {
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                matchesDate = userDate >= monthAgo;
            }
        }

        return matchesSearch && matchesRole && matchesDate;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
                        <p className="text-muted-foreground mt-1">عرض وإدارة الوكلاء ونقاط البيع</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                إضافة مستخدم جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                            <DialogHeader className="text-right">
                                <DialogTitle>إضافة حساب جديد</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="add-name">الاسم</Label>
                                        <Input id="name" value={formData.name} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="add-phone">الهاتف</Label>
                                        <Input id="phone" value={formData.phone} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-email">البريد</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-password">كلمة المرور</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>نوع الحساب</Label>
                                    <Select
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                                        defaultValue={formData.role}
                                        disabled={currentUserRole === 'wholesaler'}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {currentUserRole === 'super_admin' && (
                                                <SelectItem value="wholesaler">بائع جملة</SelectItem>
                                            )}
                                            <SelectItem value="retailer">بائع تجزئة</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>الولاية</Label>
                                        <Select
                                            onValueChange={(val) => {
                                                setFormData(prev => ({ ...prev, wilaya: val, baladiya: "" }));
                                                const wilayaCode = val.split(" - ")[0];
                                                setAvailableBaladiyat(getBaladiyatByWilaya(wilayaCode));
                                            }}
                                            value={formData.wilaya}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الولاية" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {algeriaData.map((w) => (
                                                    <SelectItem key={w.code} value={`${w.code} - ${w.name}`}>
                                                        {w.code} - {w.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>البلدية</Label>
                                        <Select
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, baladiya: val }))}
                                            value={formData.baladiya}
                                            disabled={!formData.wilaya}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={formData.wilaya ? "اختر البلدية" : "اختر الولاية أولاً"} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {availableBaladiyat.map((baladiya) => (
                                                    <SelectItem key={baladiya} value={baladiya}>
                                                        {baladiya}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-location">رابط الموقع (Google Maps)</Label>
                                    <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="https://maps.google.com/..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idCard">صورة الهوية</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="idCard"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFormData(prev => ({ ...prev, idCard: e.target.files?.[0] || null }))}
                                            className="cursor-pointer"
                                        />
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">حفظ</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="pr-9"
                            placeholder="بحث باسم أو رقم الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="تصفية حسب الدور" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الأدوار</SelectItem>
                                <SelectItem value="wholesaler">بائع جملة</SelectItem>
                                <SelectItem value="retailer">بائع تجزئة</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="تصفية الوقت" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الأوقات</SelectItem>
                                <SelectItem value="today">اليوم</SelectItem>
                                <SelectItem value="week">آخر 7 أيام</SelectItem>
                                <SelectItem value="month">آخر 30 يوم</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Edit Modal */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                        <DialogHeader className="text-right">
                            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">الاسم</Label>
                                    <Input id="name" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone">الهاتف</Label>
                                    <Input id="phone" value={formData.phone} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label>نوع الحساب</Label>
                                <Select
                                    value={formData.role}
                                    disabled={true}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wholesaler">بائع جملة</SelectItem>
                                        <SelectItem value="retailer">بائع تجزئة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>الولاية</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            setFormData(prev => ({ ...prev, wilaya: val, baladiya: "" }));
                                            const wilayaCode = val.split(" - ")[0];
                                            setAvailableBaladiyat(getBaladiyatByWilaya(wilayaCode));
                                        }}
                                        value={formData.wilaya}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الولاية" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {algeriaData.map((w) => (
                                                <SelectItem key={w.code} value={`${w.code} - ${w.name}`}>
                                                    {w.code} - {w.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>البلدية</Label>
                                    <Select
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, baladiya: val }))}
                                        value={formData.baladiya}
                                        disabled={!formData.wilaya}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={formData.wilaya ? "اختر البلدية" : "اختر الولاية أولاً"} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {availableBaladiyat.map((baladiya) => (
                                                <SelectItem key={baladiya} value={baladiya}>
                                                    {baladiya}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-location">رابط الموقع (Google Maps)</Label>
                                <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="https://maps.google.com/..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit">تحديث</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Balance & Debt Modal */}
                <Dialog open={isBalanceOpen} onOpenChange={setIsBalanceOpen}>
                    <DialogContent className="sm:max-w-[450px] text-right" dir="rtl">
                        <DialogHeader className="text-right mb-4">
                            <DialogTitle>إدارة الرصيد والديون</DialogTitle>
                            <DialogDescription>للمستخدم: {selectedUser?.name}</DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1 text-center border-l border-border/50">
                                <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                                <p className="font-bold text-emerald-600 text-lg">{formatCurrency(selectedUser?.balance)} <span className="text-xs">د.ج</span></p>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="text-xs text-muted-foreground">الديون المستحقة</p>
                                <p className="font-bold text-red-500 text-lg">{formatCurrency(selectedUser?.debt)} <span className="text-xs">د.ج</span></p>
                            </div>
                        </div>

                        <Tabs defaultValue="cash" onValueChange={(val) => {
                            setTransactionType(val);
                            if (val === 'zero') setBalanceAmount("0");
                            else setBalanceAmount("");
                        }} className="w-full">
                            <TabsList className={`grid w-full mb-4 ${currentUserRole === 'super_admin' ? 'grid-cols-6' : 'grid-cols-3'}`}>
                                <TabsTrigger value="cash">شحن 💵</TabsTrigger>
                                {currentUserRole === 'super_admin' && (
                                    <>
                                        <TabsTrigger value="deduct">خصم 🔻</TabsTrigger>
                                        <TabsTrigger value="set">تعيين ⚙️</TabsTrigger>
                                        <TabsTrigger value="zero">تصفير 🗑️</TabsTrigger>
                                    </>
                                )}
                                <TabsTrigger value="credit">دين 📝</TabsTrigger>
                                <TabsTrigger value="repay">تسديد ↩️</TabsTrigger>
                            </TabsList>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (transactionType === 'zero') {
                                    handleBalanceSubmit(e);
                                } else {
                                    handleBalanceSubmit(e);
                                }
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>
                                        {transactionType === 'set' ? 'الرصيد الجديد (DZD)' :
                                            transactionType === 'deduct' ? 'المبلغ المراد خصمه (DZD)' :
                                                transactionType === 'zero' ? 'قيمة الرصيد الجديد' :
                                                    'المبلغ (DZD)'}
                                    </Label>
                                    <Input
                                        type="number"
                                        value={balanceAmount}
                                        onChange={(e) => setBalanceAmount(e.target.value)}
                                        placeholder="0"
                                        className="text-right text-lg font-bold"
                                        autoFocus
                                        min="0"
                                        disabled={transactionType === 'zero'}
                                    />
                                </div>

                                <TabsContent value="cash" className="text-xs text-muted-foreground mt-2">
                                    <AlertCircle className="w-3 h-3 inline ml-1" />
                                    سيتم إضافة المبلغ للرصيد مباشرة.
                                </TabsContent>
                                <TabsContent value="deduct" className="text-xs text-muted-foreground mt-2">
                                    <AlertCircle className="w-3 h-3 inline ml-1" />
                                    سيتم إنقاص الرصيد الحالي بهذا المبلغ.
                                </TabsContent>
                                <TabsContent value="zero" className="text-xs text-muted-foreground mt-2">
                                    <AlertCircle className="w-3 h-3 inline ml-1" />
                                    تحذير: سيتم حذف الرصيد بالكامل وتعيينه إلى 0.
                                </TabsContent>
                                <TabsContent value="set" className="text-xs text-muted-foreground mt-2">
                                    <AlertCircle className="w-3 h-3 inline ml-1" />
                                    سيتم تغيير الرصيد الحالي ليصبح مساوياً لهذا المبلغ تماماً.
                                </TabsContent>
                                <TabsContent value="credit" className="text-xs text-muted-foreground mt-2">
                                    <AlertCircle className="w-3 h-3 inline ml-1" />
                                    سيتم إضافة المبلغ للرصيد وتسجيله كدين.
                                </TabsContent>
                                <TabsContent value="repay" className="text-xs text-muted-foreground mt-2">
                                    <AlertCircle className="w-3 h-3 inline ml-1" />
                                    سيتم خصم المبلغ من الديون المستحقة.
                                </TabsContent>

                                <DialogFooter className="mt-6">
                                    <Button type="submit"
                                        className={`w-full ${transactionType === 'repay' ? 'bg-blue-600 hover:bg-blue-700' :
                                            transactionType === 'credit' ? 'bg-orange-600 hover:bg-orange-700' :
                                                transactionType === 'deduct' ? 'bg-red-600 hover:bg-red-700' :
                                                    transactionType === 'set' ? 'bg-gray-600 hover:bg-gray-700' :
                                                        'bg-emerald-600 hover:bg-emerald-700'
                                            }`}
                                    >
                                        {transactionType === 'repay' ? 'تأكيد التسديد' :
                                            transactionType === 'deduct' ? 'تأكيد الخصم' :
                                                transactionType === 'set' ? 'تعيين الرصيد' :
                                                    'تأكيد الشحن'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Tabs>
                    </DialogContent>
                </Dialog>

                {/* Table */}
                <div className="rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">الاسم</TableHead>
                                <TableHead className="text-right">الدور</TableHead>
                                <TableHead className="text-right">الرصيد</TableHead>
                                <TableHead className="text-right">الديون</TableHead>
                                <TableHead className="text-right">الهاتف</TableHead>
                                <TableHead className="text-right">الولاية / البلدية</TableHead>
                                <TableHead className="text-right">الانتساب</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center">تحميل...</TableCell></TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد نتائج مطابقة</TableCell></TableRow>
                            ) : filteredUsers.map((user) => {
                                const creator = users.find(u => u.id === user.createdBy);
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'wholesaler' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                                {user.role === 'wholesaler' ? 'بائع جملة' : 'بائع تجزئة'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-emerald-500">
                                            {formatCurrency(user.balance)}
                                        </TableCell>
                                        <TableCell className="font-bold text-red-500">
                                            {formatCurrency(user.debt)}
                                        </TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                {user.wilaya ? <span>{user.wilaya} - {user.baladiya}</span> : '-'}
                                                {user.location && <a href={user.location} target="_blank" className="text-primary hover:underline flex items-center gap-1 font-bold"><MapPin className="w-3 h-3" /> الخريطة</a>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {creator ? creator.name : (user.createdBy ? 'غير معروف' : 'مدير النظام')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="flex gap-2 items-center">
                                            <Button size="sm" onClick={() => handleBalanceClick(user)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow hover:shadow-md transition-all">
                                                <DollarSign className="w-4 h-4 ml-1" />
                                                شحن الرصيد
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant={user.status === 'Disabled' ? 'default' : 'destructive'}
                                                size="sm"
                                                onClick={() => handleToggleStatus(user)}
                                            >
                                                {user.status === 'Disabled' ? '✓ تفعيل' : '✕ تعطيل'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Confirmation Dialog for Toggle Status */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد العملية</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToToggle && (
                                <>
                                    هل أنت متأكد من {userToToggle.status === 'Disabled' ? 'تفعيل' : 'تعطيل'} حساب <strong>{userToToggle.name}</strong>؟
                                    {userToToggle.status !== 'Disabled' && (
                                        <div className="mt-2 text-red-600 font-semibold">
                                            ⚠️ تحذير: لن يتمكن المستخدم من تسجيل الدخول بعد التعطيل!
                                        </div>
                                    )}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsConfirmOpen(false);
                            setUserToToggle(null);
                        }}>
                            إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmToggleStatus}>
                            تأكيد
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default Users;
