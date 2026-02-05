import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowRight, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InternetCardCategories from "@/components/cards/InternetCardCategories";
import CardsTable from "@/components/cards/CardsTable";
import AddCardDialog from "@/components/cards/AddCardDialog";

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
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const [offers, setOffers] = useState<any[]>([]);
    const [sims, setSims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOffer, setSelectedOffer] = useState<any>(null);

    // Internet Cards State
    const [selectedCardCategory, setSelectedCardCategory] = useState<number | null>(null);
    const [internetCards, setInternetCards] = useState<any[]>([]);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    // Config State
    const [configOperator, setConfigOperator] = useState<string | null>(null);
    const [flexyTemplate, setFlexyTemplate] = useState("");

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

    // Internet Cards Effect
    useEffect(() => {
        if (selectedCardCategory) {
            fetchInternetCards(selectedCardCategory);
        }
    }, [selectedCardCategory]);

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

    const fetchInternetCards = async (category: number) => {
        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/cards?operator=${selectedOperator}&category=${category}`);
            if (res.ok) {
                const data = await res.json();
                setInternetCards(data);
            }
        } catch (error) {
            console.error("Failed to fetch cards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOperatorSelect = (operatorId: string) => {
        setSelectedOperator(operatorId);
        setFormData(prev => ({ ...prev, operator: operatorId }));
    };

    const handleBackToOperators = () => {
        setSelectedOperator(null);
    };

    const handleBackToCategories = () => {
        setSelectedCardCategory(null);
        setInternetCards([]);
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

    const handleAddCardSubmit = async (data: any) => {
        try {
            const res = await fetch(`${backendUrl}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operator: selectedOperator,
                    category: selectedCardCategory, // Use the selected category
                    ...data
                })
            });

            if (res.ok) {
                alert("تم إضافة البطاقة بنجاح");
                if (selectedCardCategory) fetchInternetCards(selectedCardCategory);
            } else {
                alert("فشل إضافة البطاقة");
            }
        } catch (error) {
            console.error(error);
            alert("خطأ في الاتصال");
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

    const handleConfigClick = async (operatorId: string) => {
        setConfigOperator(operatorId);
        try {
            const res = await fetch(`${backendUrl}/operators/${operatorId}/config`);
            if (res.ok) {
                const data = await res.json();
                setFlexyTemplate(data.flexyTemplate || "");
            } else {
                setFlexyTemplate("");
            }
            setIsConfigOpen(true);
        } catch (error) {
            console.error("Failed to fetch config", error);
            alert("فشل تحميل الإعدادات");
        }
    };

    const handleConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configOperator) return;

        try {
            const res = await fetch(`${backendUrl}/operators/${configOperator}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flexyTemplate })
            });

            if (res.ok) {
                alert("تم تحديث الإعدادات بنجاح!");
                setIsConfigOpen(false);
            } else {
                alert("خطأ في التحديث");
            }
        } catch (error) {
            console.error("Failed to update config", error);
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const isInternetProvider = (id: string) => ['idoom', 'fiber', 'adsl'].includes(id);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">عروض المتعاملين</h1>
                    <p className="text-muted-foreground">
                        {selectedOperator
                            ? `إدارة عروض ${[...operators, ...internetProviders].find(op => op.id === selectedOperator)?.name}`
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
                                    className="cursor-pointer hover:shadow-lg transition-all border-l-4 hover:border-l-8 relative group"
                                    style={{ borderLeftColor: operator.id === 'mobilis' ? '#16a34a' : operator.id === 'djezzy' ? '#dc2626' : '#eab308' }}
                                    onClick={() => handleOperatorSelect(operator.id)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConfigClick(operator.id);
                                        }}
                                        className="absolute top-2 left-2 p-2 hover:bg-muted rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="إعدادات الشحن"
                                    >
                                        <Settings className="w-4 h-4 text-muted-foreground" />
                                    </button>
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
                ) : isInternetProvider(selectedOperator) ? (
                    // Internet Cards View
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <Button variant="ghost" className="gap-2" onClick={selectedCardCategory ? handleBackToCategories : handleBackToOperators}>
                                <ArrowRight className="w-4 h-4" />
                                {selectedCardCategory ? 'رجوع للفئات' : 'رجوع للمتعاملين'}
                            </Button>

                            {selectedCardCategory && (
                                <Button className="gap-2" onClick={() => setIsAddCardOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                    إضافة بطاقة
                                </Button>
                            )}
                        </div>

                        {!selectedCardCategory ? (
                            <InternetCardCategories onSelect={setSelectedCardCategory} />
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-2xl font-bold">بطاقات {selectedCardCategory} د.ج</h2>
                                    <span className="text-muted-foreground text-sm">({internetCards.length} بطاقة)</span>
                                </div>
                                <CardsTable cards={internetCards} loading={loading} />
                            </>
                        )}

                        {selectedCardCategory && (
                            <AddCardDialog
                                open={isAddCardOpen}
                                onOpenChange={setIsAddCardOpen}
                                onSubmit={handleAddCardSubmit}
                                category={selectedCardCategory}
                            />
                        )}
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

            {/* Config Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>إعدادات الشحن العادي (Flexy)</DialogTitle>
                        <DialogDescription>
                            ضبط قالب USSD لعمليات الشحن العادي الخاصة بـ {operators.find(op => op.id === configOperator)?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConfigSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="flexyTemplate">قالب كود USSD</Label>
                            <Input
                                id="flexyTemplate"
                                value={flexyTemplate}
                                onChange={(e) => setFlexyTemplate(e.target.value)}
                                placeholder="مثال: *610*{phone}*{amount}*{pin}#"
                                className="font-mono text-left"
                                dir="ltr"
                            />
                            <p className="text-xs text-muted-foreground">
                                المتغيرات المتاحة: <code className="bg-muted px-1">{"{phone}"}</code>, <code className="bg-muted px-1">{"{amount}"}</code>, <code className="bg-muted px-1">{"{pin}"}</code>
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="submit">حفظ الإعدادات</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
};

export default Offers;
