import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowRight, Bike, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const backendUrl = "http://localhost:3000/api";

const DeliveryApps = () => {
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddAppOpen, setIsAddAppOpen] = useState(false);
    const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

    // Forms
    const [appForm, setAppForm] = useState({ name: "", description: "" });
    const [pkgForm, setPkgForm] = useState({ name: "", price: "", costPrice: "" });

    useEffect(() => { fetchApps(); }, []);

    const fetchApps = async () => {
        try {
            const res = await fetch(`${backendUrl}/delivery-apps`);
            if (res.ok) setApps(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAddApp = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${backendUrl}/delivery-apps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appForm)
        });
        if (res.ok) {
            fetchApps();
            setIsAddAppOpen(false);
            setAppForm({ name: "", description: "" });
        }
    };

    const handleAddPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${backendUrl}/delivery-apps/${selectedApp.id}/packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pkgForm)
        });
        if (res.ok) {
            const newPkg = await res.json();
            // Optimistic update
            setApps(prev => prev.map(a => {
                if (a.id === selectedApp.id) {
                    const updated = { ...a, packages: [...(a.packages || []), newPkg] };
                    setSelectedApp(updated);
                    return updated;
                }
                return a;
            }));
            setIsAddPackageOpen(false);
            setPkgForm({ name: "", price: "", costPrice: "" });
        }
    };

    const handleDeleteApp = async (id: string, e: any) => {
        e.stopPropagation();
        if (confirm("حذف التطبيق؟")) {
            await fetch(`${backendUrl}/delivery-apps/${id}`, { method: 'DELETE' });
            fetchApps();
        }
    };

    const handleDeletePkg = async (pkgId: string) => {
        if (confirm("حذف الباقة؟")) {
            await fetch(`${backendUrl}/delivery-apps/${selectedApp.id}/packages/${pkgId}`, { method: 'DELETE' });
            // Local update
            setApps(prev => prev.map(a => {
                if (a.id === selectedApp.id) {
                    const updated = { ...a, packages: a.packages.filter((p: any) => p.id !== pkgId) };
                    setSelectedApp(updated);
                    return updated;
                }
                return a;
            }));
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">تطبيقات التوصيل</h1>
                        <p className="text-muted-foreground">إدارة شحن رصيد تطبيقات التوصيل (Yassir, Heetch...)</p>
                    </div>
                </div>

                {!selectedApp ? (
                    <div className="space-y-6">
                        <Dialog open={isAddAppOpen} onOpenChange={setIsAddAppOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2"><Plus className="w-4 h-4" /> إضافة تطبيق</Button>
                            </DialogTrigger>
                            <DialogContent className="text-right" dir="rtl">
                                <DialogHeader className="text-right"><DialogTitle>إضافة تطبيق جديد</DialogTitle></DialogHeader>
                                <form onSubmit={handleAddApp} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>اسم التطبيق</Label>
                                        <Input value={appForm.name} onChange={e => setAppForm({ ...appForm, name: e.target.value })} placeholder="مثال: Yassir" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>وصف</Label>
                                        <Input value={appForm.description} onChange={e => setAppForm({ ...appForm, description: e.target.value })} placeholder="شحن رصيد سائق/عميل" />
                                    </div>
                                    <DialogFooter><Button type="submit">حفظ</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {loading ? <p>تحميل...</p> : apps.length === 0 ? (
                                <div className="col-span-3 text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                                    <Bike className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>لا توجد تطبيقات مضافة</p>
                                </div>
                            ) : apps.map(app => (
                                <Card key={app.id} onClick={() => setSelectedApp(app)} className="cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
                                    <CardHeader>
                                        <div className="flex justify-between">
                                            <CardTitle>{app.name}</CardTitle>
                                            <Button variant="ghost" size="icon" onClick={(e) => handleDeleteApp(app.id, e)} className="text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <CardDescription>{app.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="w-4 h-4" /> <span>{app.packages?.length || 0} باقات</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setSelectedApp(null)} className="gap-2"><ArrowRight className="w-4 h-4" /> رجوع</Button>
                            <Dialog open={isAddPackageOpen} onOpenChange={setIsAddPackageOpen}>
                                <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> إضافة باقة</Button></DialogTrigger>
                                <DialogContent className="text-right" dir="rtl">
                                    <DialogHeader className="text-right"><DialogTitle>إضافة باقة لـ {selectedApp.name}</DialogTitle></DialogHeader>
                                    <form onSubmit={handleAddPackage} className="space-y-4 py-4">
                                        <div className="space-y-2"><Label>اسم الباقة</Label><Input value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="مثال: رصيد 1000 دج" required /></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2"><Label>سعر البيع</Label><Input type="number" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} required /></div>
                                            <div className="space-y-2"><Label>سعر التكلفة</Label><Input type="number" value={pkgForm.costPrice} onChange={e => setPkgForm({ ...pkgForm, costPrice: e.target.value })} /></div>
                                        </div>
                                        <DialogFooter><Button type="submit">إضافة</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="rounded-xl border bg-card">
                            <Table>
                                <TableHeader><TableRow><TableHead className="text-right">الباقة</TableHead><TableHead className="text-right">السعر</TableHead><TableHead className="text-right">حذف</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {selectedApp.packages?.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center">لا توجد باقات</TableCell></TableRow> :
                                        selectedApp.packages?.map((p: any) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.name}</TableCell>
                                                <TableCell className="font-bold text-emerald-600">{Number(p.price).toLocaleString()} د.ج</TableCell>
                                                <TableCell><Button variant="ghost" size="sm" onClick={() => handleDeletePkg(p.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default DeliveryApps;
