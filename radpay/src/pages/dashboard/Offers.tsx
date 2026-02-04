import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowRight, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const backendUrl = "http://localhost:3000/api";

const operators = [
    { id: 'mobilis', name: 'موبيليس', color: 'bg-green-600', textColor: 'text-green-600' },
    { id: 'djezzy', name: 'جيزي', color: 'bg-red-600', textColor: 'text-red-600' },
    { id: 'ooredoo', name: 'أوريدو', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
];

const internetProviders = [
    { id: 'idoom', name: 'إيدوم (Idoom)', color: 'bg-blue-600', textColor: 'text-blue-600' },
    { id: 'fiber', name: 'ألياف بصرية (Fiber)', color: 'bg-purple-600', textColor: 'text-purple-600' },
    { id: 'adsl', name: 'ADSL', color: 'bg-cyan-600', textColor: 'text-cyan-600' },
];

const Offers = () => {
    const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isExecuteOpen, setIsExecuteOpen] = useState(false);

    const [offers, setOffers] = useState<any[]>([]);
    const [sims, setSims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOffer, setSelectedOffer] = useState<any>(null);
    const [selectedSimId, setSelectedSimId] = useState<string>("");

    const [formData, setFormData] = useState({
        operator: "mobilis",
        name: "",
        description: "",
        price: "",
        ussdTemplate: "*600*{price}*{phone}*{pin}#"
    });

    useEffect(() => {
        fetchOffers();
        fetchSims();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await fetch(`${backendUrl}/offers`);
            if (res.ok) {
                const data = await res.json();
                setOffers(data);
            }
        } catch (error) {
            console.error("Failed to fetch offers", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSims = async () => {
        try {
            const res = await fetch(`${backendUrl}/gateway/sims`);
            if (res.ok) {
                const data = await res.json();
                setSims(data);
            }
        } catch (error) {
            console.error("Failed to fetch sims", error);
        }
    };

    const handleOperatorSelect = (operatorId: string) => {
        setSelectedOperator(operatorId);
        setFormData(prev => ({ ...prev, operator: operatorId }));
    };

    const handleBackToOperators = () => {
        setSelectedOperator(null);
    };

    const filteredOffers = selectedOperator
        ? offers.filter(offer => offer.operator === selectedOperator)
        : [];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${backendUrl}/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("تم إضافة العرض بنجاح!");
                setIsAddOpen(false);
                fetchOffers();
                setFormData({
                    operator: selectedOperator || "mobilis",
                    name: "",
                    description: "",
                    price: "",
                    ussdTemplate: "*600*{price}*{phone}*{pin}#"
                });
            } else {
                alert("خطأ في الإضافة");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const handleEditClick = (offer: any) => {
        setSelectedOffer(offer);
        setFormData({
            operator: offer.operator,
            name: offer.name,
            description: offer.description,
            price: offer.price,
            ussdTemplate: offer.ussdTemplate
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOffer) return;
        try {
            const res = await fetch(`${backendUrl}/offers/${selectedOffer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("تم تحديث العرض بنجاح!");
                setIsEditOpen(false);
                fetchOffers();
            } else {
                alert("خطأ في التحديث");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
        try {
            await fetch(`${backendUrl}/offers/${id}`, { method: 'DELETE' });
            fetchOffers();
        } catch (error) {
            alert("فشل الحذف");
        }
    };

    const handleExecuteClick = (offer: any) => {
        setSelectedOffer(offer);
        setSelectedSimId("");
        setIsExecuteOpen(true);
    };

    const handleExecuteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSimId || !selectedOffer) {
            alert("يرجى اختيار شريحة");
            return;
        }

        try {
            const res = await fetch(`${backendUrl}/gateway/execute-offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    simId: selectedSimId,
                    ussdCode: selectedOffer.ussdTemplate,
                    offerName: selectedOffer.name,
                    price: selectedOffer.price
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`تم تنفيذ العرض بنجاح!\n${data.message || ''}`);
                setIsExecuteOpen(false);
            } else {
                const error = await res.json();
                alert(`فشل في تنفيذ العرض: ${error.error || 'خطأ غير معروف'}`);
            }
        } catch (error) {
            alert("خطأ في الاتصال بالسيرفر");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">عروض المتعاملين</h1>
                    <p className="text-muted-foreground">
                        {selectedOperator
                            ? `إدارة عروض ${operators.find(op => op.id === selectedOperator)?.name}`
                            : 'اختر متعاملاً لعرض وإدارة العروض الخاصة به'
                        }
                    </p>
                </div>

                {!selectedOperator ? (
                    // Operators Grid View
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            {operators.map(operator => (
                                <Card
                                    key={operator.id}
                                    className="cursor-pointer hover:shadow-lg transition-all border-l-4 hover:border-l-8"
                                    style={{ borderLeftColor: operator.id === 'mobilis' ? '#16a34a' : operator.id === 'djezzy' ? '#dc2626' : '#eab308' }}
                                    onClick={() => handleOperatorSelect(operator.id)}
                                >
                                    <CardHeader>
                                        <CardTitle className={`text-2xl ${operator.textColor}`}>{operator.name}</CardTitle>
                                        <CardDescription>اضغط لإدارة العروض</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {offers.filter(o => o.operator === operator.id).length}
                                        </div>
                                        <span className="text-muted-foreground text-sm">عروض نشطة</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-10">
                            <h2 className="text-xl font-bold mb-4">بطاقات انترنت</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {internetProviders.map(provider => (
                                    <Card
                                        key={provider.id}
                                        className="cursor-pointer hover:shadow-lg transition-all border-l-4 hover:border-l-8"
                                        style={{ borderLeftColor: provider.id === 'idoom' ? '#2563eb' : provider.id === 'fiber' ? '#9333ea' : '#0891b2' }}
                                        onClick={() => handleOperatorSelect(provider.id)}
                                    >
                                        <CardHeader>
                                            <CardTitle className={`text-2xl ${provider.textColor}`}>{provider.name}</CardTitle>
                                            <CardDescription>خدمات الانترنت الثابت</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">
                                                {offers.filter(o => o.operator === provider.id).length}
                                            </div>
                                            <span className="text-muted-foreground text-sm">عروض نشطة</span>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Offers List View
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" className="gap-2" onClick={handleBackToOperators}>
                                <ArrowRight className="w-4 h-4" />
                                رجوع للمتعاملين
                            </Button>

                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        إضافة عرض جديد
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] text-right" dir="rtl">
                                    <DialogHeader className="text-right">
                                        <DialogTitle>إضافة عرض - {operators.find(op => op.id === selectedOperator)?.name}</DialogTitle>
                                        <DialogDescription>
                                            استخدم المتغيرات: <code className="bg-muted px-1 rounded">{"{price}"}</code>, <code className="bg-muted px-1 rounded">{"{phone}"}</code>, <code className="bg-muted px-1 rounded">{"{pin}"}</code>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price">السعر / نقطة الارتكاز (د.ج)</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                placeholder="مثال: 100"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">اسم العرض</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="مثال: PixX 100"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">وصف العرض (اختياري)</Label>
                                            <Input
                                                id="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="تفاصيل إضافية..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ussdTemplate">قالب كود USSD</Label>
                                            <Input
                                                id="ussdTemplate"
                                                value={formData.ussdTemplate}
                                                onChange={handleInputChange}
                                                placeholder="*600*{price}*{phone}*{pin}#"
                                                className="font-mono text-left"
                                                dir="ltr"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                مثال: <span dir="ltr" className="font-mono">*600*{formData.price || '100'}*{"{phone}"}*{"{pin}"}#</span>
                                            </p>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">حفظ العرض</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">اسم العرض</TableHead>
                                        <TableHead className="text-right">السعر</TableHead>
                                        <TableHead className="text-right">قالب USSD</TableHead>
                                        <TableHead className="text-right">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center">تحميل...</TableCell></TableRow>
                                    ) : filteredOffers.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد عروض لهذا المتعامل</TableCell></TableRow>
                                    ) : filteredOffers.map((offer) => (
                                        <TableRow key={offer.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{offer.name}</span>
                                                    <span className="text-xs text-muted-foreground">{offer.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-emerald-600">
                                                {Number(offer.price).toLocaleString()} د.ج
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground" dir="ltr">
                                                {offer.ussdTemplate}
                                            </TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => handleExecuteClick(offer)}
                                                >
                                                    <Play className="w-4 h-4" />
                                                    تنفيذ
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(offer)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(offer.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Edit Modal (Scoped to offers list view) */}
                        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <DialogContent className="sm:max-w-[600px] text-right" dir="rtl">
                                <DialogHeader className="text-right">
                                    <DialogTitle>تعديل العرض</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">السعر / نقطة الارتكاز (د.ج)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">اسم العرض</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">وصف العرض (اختياري)</Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ussdTemplate">قالب كود USSD</Label>
                                        <Input
                                            id="ussdTemplate"
                                            value={formData.ussdTemplate}
                                            onChange={handleInputChange}
                                            className="font-mono text-left"
                                            dir="ltr"
                                            required
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">تحديث</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Execute Offer Dialog */}
            <Dialog open={isExecuteOpen} onOpenChange={setIsExecuteOpen}>
                <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>تنفيذ العرض</DialogTitle>
                        <DialogDescription>
                            اختر الشريحة التي تريد تنفيذ العرض عليها
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleExecuteSubmit} className="space-y-4 py-4">
                        {selectedOffer && (
                            <div className="space-y-4 p-4 bg-muted rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">اسم العرض:</span>
                                    <span className="font-semibold">{selectedOffer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">السعر:</span>
                                    <span className="font-bold text-emerald-600">
                                        {Number(selectedOffer.price).toLocaleString()} د.ج
                                    </span>
                                </div>
                                {selectedOffer.description && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">الوصف:</span>
                                        <span className="text-sm">{selectedOffer.description}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="simId">اختر الشريحة</Label>
                            <select
                                id="simId"
                                value={selectedSimId}
                                onChange={(e) => setSelectedSimId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            >
                                <option value="">-- اختر شريحة --</option>
                                {sims.map((sim, index) => (
                                    <option key={sim.id} value={sim.id}>
                                        شريحة #{index + 1} - {sim.phone} ({sim.operator})
                                    </option>
                                ))}
                            </select>
                            {sims.length === 0 && (
                                <p className="text-sm text-red-500">لا توجد شرائح متاحة. يرجى إضافة شريحة أولاً.</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsExecuteOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={!selectedSimId || sims.length === 0}>
                                <Play className="w-4 h-4 ml-2" />
                                تنفيذ العرض
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
};

export default Offers;
