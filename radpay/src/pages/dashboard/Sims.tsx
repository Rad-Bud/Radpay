import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Smartphone, Signal, Power, Search, Settings, RefreshCw, Wallet, CheckCircle, Clock, AlertTriangle, Scale, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth } from "@/lib/firebase";

const backendUrl = "http://localhost:3000/api";

const Sims = () => {
    const { t } = useLanguage();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false); // New State

    const [sims, setSims] = useState<any[]>([]);
    const [stats, setStats] = useState({ completed: 0, pending: 0 });
    const [financials, setFinancials] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSim, setSelectedSim] = useState<any>(null);

    const [formData, setFormData] = useState({
        operator: "mobilis", // mobilis, djezzy, ooredoo
        phone: "",
        pin: "",
        port: "",
        balance: "",
        status: "active"
    });

    // Purchase Form Data
    const [purchaseData, setPurchaseData] = useState({
        amount: "",
        discountRate: "0"
    });

    // Purchase UI States
    const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
    const [purchaseStep, setPurchaseStep] = useState<'input' | 'verifying'>('input');
    const [initialBalance, setInitialBalance] = useState<number>(0);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [ussdConfig, setUssdConfig] = useState({
        mobilis: "",
        djezzy: "",
        ooredoo: ""
    });

    // Helper for Authenticated Fetch
    const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
        try {
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            return fetch(url, options);
        } catch (error) {
            console.error("Auth Error:", error);
            throw error;
        }
    };

    useEffect(() => {
        const init = async () => {
            // Wait a moment for auth if needed, but usually auth.currentUser is ready or we handle it
            // We can retry if no user? For now assume user is logged in if accessing dashboard
            await fetchSims();
            await fetchStats();
            await fetchFinancials();
            await fetchSettings(); // Also fetch settings
        };
        init();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetchWithAuth(`${backendUrl}/settings/operators`);
            if (res.ok) {
                const data = await res.json();
                setUssdConfig({
                    mobilis: data.mobilis || "",
                    djezzy: data.djezzy || "",
                    ooredoo: data.ooredoo || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const handleSettingsOpen = () => {
        fetchSettings();
        setIsSettingsOpen(true);
    };

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${backendUrl}/settings/operators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ussdConfig)
            });

            if (res.ok) {
                alert("تم حفظ الإعدادات بنجاح!");
                setIsSettingsOpen(false);
            } else {
                alert("فشل حفظ الإعدادات");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [operatorFilter, setOperatorFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

    const fetchFinancials = async () => {
        try {
            const res = await fetchWithAuth(`${backendUrl}/stats/financials?days=30`);
            if (res.ok) {
                const data = await res.json();
                setFinancials(data);
            } else {
                console.error("Financials fetch failed", res.status);
            }
        } catch (error) {
            console.error("Failed to fetch financials", error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetchWithAuth(`${backendUrl}/stats/transactions`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const fetchSims = async () => {
        try {
            const res = await fetchWithAuth(`${backendUrl}/sims`);
            if (res.ok) {
                const data = await res.json();
                setSims(data);
            }
        } catch (error) {
            console.error("Failed to fetch sims", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${backendUrl}/sims`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("تم إضافة الشريحة بنجاح!");
                setIsAddOpen(false);
                fetchSims();
                setFormData({ operator: "mobilis", phone: "", pin: "", port: "", status: "active", balance: "" });
            } else {
                alert("خطأ في الإضافة");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const handleRefreshBalance = async (sim: any) => {
        // Defaults if config is missing
        let code = "";
        if (sim.operator === "mobilis") code = ussdConfig.mobilis || "*222#";
        else if (sim.operator === "djezzy") code = ussdConfig.djezzy || "*710#";
        else if (sim.operator === "ooredoo") code = ussdConfig.ooredoo || "*200#";

        if (!code) code = "*222#"; // Fallback

        // Validating click
        alert(`جاري طلب الرصيد للشريحة ${sim.phone} (${code})...`);

        try {
            console.log("Sending USSD request...");
            const res = await fetchWithAuth(`${backendUrl}/gateway/ussd`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot: sim.id, code })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`✅ تم! رد الشبكة:\n${data.message}`);
                fetchSims();
            } else {
                alert(`❌ خطأ من السيرفر: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("⚠️ فشل الاتصال بالسيرفر! تأكد أن السيرفر يعمل.");
        }
    };

    const handleEditClick = (sim: any) => {
        setSelectedSim(sim);
        setFormData({
            operator: sim.operator,
            phone: sim.phone,
            pin: sim.pin,
            port: sim.port,
            status: sim.status,
            balance: sim.balance
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSim) return;
        try {
            const res = await fetchWithAuth(`${backendUrl}/sims/${selectedSim.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("تم تحديث الشريحة بنجاح!");
                setIsEditOpen(false);
                fetchSims();
            } else {
                alert("خطأ في التحديث");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الشريحة؟")) return;
        try {
            await fetchWithAuth(`${backendUrl}/sims/${id}`, { method: 'DELETE' });
            fetchSims();
        } catch (error) {
            alert("فشل الحذف");
        }
    };

    const handleToggleStatus = async (sim: any) => {
        const newStatus = sim.status === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'active' ? 'تفعيل' : 'تعطيل';
        if (!confirm(`هل أنت متأكد من ${actionText} هذه الشريحة؟`)) return;

        try {
            const res = await fetchWithAuth(`${backendUrl}/sims/${sim.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchSims();
            } else {
                alert("فشل تحديث الحالة");
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    const getOperatorColor = (op: string) => {
        switch (op) {
            case 'mobilis': return 'bg-green-600';
            case 'djezzy': return 'bg-red-600';
            case 'ooredoo': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    // Purchase Handlers
    const handlePurchaseClick = async (sim: any) => {
        setSelectedSim(sim);
        // Default state
        setPurchaseData({
            amount: "",
            discountRate: "0"
        });
        setPurchaseStep('input');
        setIsPurchaseLoading(false);
        // Track the balance BEFORE we start any refreshes or topups
        const startBalance = Number(sim.balance) || 0;
        setInitialBalance(startBalance);
        setIsPurchaseOpen(true);

        // Auto-fetch latest discount
        try {
            const res = await fetchWithAuth(`${backendUrl}/sims/purchases/latest?operator=${sim.operator}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.discountRate !== undefined) {
                    setPurchaseData(prev => ({
                        ...prev,
                        discountRate: String(data.discountRate)
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch latest purchase info", error);
        }

        // Auto-refresh balance to get latest truth? 
        // If we refresh immediately, and the top-up hasn't happened yet (user just opened modal),
        // we essentially just confirm the 'initialBalance'.
        // If the user ALREADY topped up before opening the modal, this refresh might catch it.
        // But then 'initialBalance' would be the ALREADY topped up value?
        // Scenario: 
        // 1. User opens modal. System refreshes. Balance=1000.  Initial=1000.
        // 2. User physically tops up 3000. 
        // 3. User clicks "Refresh". System finds 4000.
        // 4. 4000 >= 1000 + 3000. OK.

        // Update: refreshSimBalanceInternal should NOT update initialBalance only selectedSim.
        refreshSimBalanceInternal(sim, true); // Pass true to indicate 'initial/mount' check
    };

    const refreshSimBalanceInternal = async (sim: any, isMount = false) => {
        setIsPurchaseLoading(true);
        let code = "";
        if (sim.operator === "mobilis") code = ussdConfig.mobilis || "*222#";
        else if (sim.operator === "djezzy") code = ussdConfig.djezzy || "*710#";
        else if (sim.operator === "ooredoo") code = ussdConfig.ooredoo || "*200#";
        if (!code) code = "*222#";

        try {
            const res = await fetchWithAuth(`${backendUrl}/gateway/ussd`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot: sim.id, code })
            });

            if (res.ok) {
                // If successful, we should reload the SIM data to get the parsed balance
                // But typically the gateway/ussd endpoint might return the raw text.
                // We rely on fetchSims() updating the list.
                await fetchSims();
                // We need to update selectedSim with the new balance from the list
                // Since fetchSims updates 'sims' state, we need to read from there?
                // Actually, let's just wait a bit or re-find the sim
                const updatedSimsRes = await fetchWithAuth(`${backendUrl}/sims`);
                const updatedSims = await updatedSimsRes.json();
                const found = updatedSims.find((s: any) => s.id === sim.id);
                if (found) {
                    setSelectedSim(found);
                    if (isMount) {
                        setInitialBalance(Number(found.balance));
                    }
                }
            }
        } catch (error) {
            console.error("Auto-refresh failed", error);
        } finally {
            setIsPurchaseLoading(false);
        }
    };

    const handleVerifyAndSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSim) return;

        const currentBal = Number(selectedSim.balance) || 0;
        const amount = Number(purchaseData.amount);

        // Expected total is Initial + Amount? 
        // Or Current + Amount? 
        // If user refreshed multiple times, 'selectedSim' is current.
        // But verification is: Has it reached (Initial + Amount)?
        // Use Initial for the mathematical target.
        const targetBal = initialBalance + amount;

        if (amount <= 0) {
            alert("يرجى إدخال مبلغ صحيح");
            return;
        }

        // Check if we are in verification step
        if (purchaseStep === 'input') {
            // Move to verification
            setPurchaseStep('verifying');
            // Trigger USSD Check
            await refreshSimBalanceInternal(selectedSim);
            // The user will see the balance update. 
            // If it matches expected, they can confirm in the next click?
            // Actually, the user wants "Check -> If Confirmed -> Pass"
            // So we just stay in 'verifying' state and button becomes "Confirm & Save"
            return;
        }

        // In Verifying Step: Check if balance arrived
        // We use the 'selectedSim.balance' which should have been updated by the refresh above
        // We allow some small margin or just strict check?
        // Let's warn if strictly less than expected
        // STRICT BLOCKING:
        if (currentBal < targetBal) {
            alert(`خطأ: الرصيد لم يصل بعد!\nالرصيد الحالي: ${currentBal}\nالرصيد المتوقع: ${targetBal}\nيرجى الانتظار واعادة التحقق.`);
            // Remain in verifying step, do not save.
            // But we might want to refresh again?
            // The button is "Confirm". The user clicked it expecting it to work.
            // We blocked it. They can click "Refresh" (Wait, the button is confirm).
            // We should probably have a separate "Refresh" button in verifying step OR 
            // allow the "Confirm" button to trigger a refresh logic if it fails?
            // Current flow: "Refresh" (step 1) -> "Confirm" (step 2).
            // If checking fails in step 2, we should probably stay there or maybe revert to step 1 automatically?
            // Let's just output the alert and let them try again (maybe we can add a 'refresh' icon button separately or just switch step back to input?)
            setPurchaseStep('input'); // Switch back to 'input' so they can click 'Refresh' again easily.
            return;
        }

        // Proceed to Save
        try {
            const res = await fetchWithAuth(`${backendUrl}/sims/${selectedSim.id}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newBalance: currentBal, // Save the actual confirmed balance
                    discountRate: Number(purchaseData.discountRate)
                })
            });

            if (res.ok) {
                alert("تم تسجيل عملية الشراء بنجاح!");
                setIsPurchaseOpen(false);
                fetchSims();
                fetchFinancials();
            } else {
                const err = await res.json();
                alert(`فشل العملية: ${err.error}`);
            }
        } catch (error) {
            alert("فشل الاتصال بالسيرفر");
        }
    };

    // Filtering Logic
    const filteredSims = sims.filter(sim => {
        const matchesSearch = sim.phone.includes(searchTerm) ||
            (sim.port && sim.port.includes(searchTerm));

        const matchesOperator = operatorFilter === "all" || sim.operator === operatorFilter;

        let matchesDate = true;
        if (dateFilter !== "all" && sim.createdAt) {
            const simDate = new Date(sim.createdAt);
            const now = new Date();
            if (dateFilter === "today") {
                matchesDate = simDate.toDateString() === now.toDateString();
            } else if (dateFilter === "week") {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                matchesDate = simDate >= weekAgo;
            } else if (dateFilter === "month") {
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                matchesDate = simDate >= monthAgo;
            }
        }

        return matchesSearch && matchesOperator && matchesDate;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">إدارة الشرائح (SIMs)</h1>
                        <p className="text-muted-foreground mt-1">تكوين وإدارة بوابات GSM</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <Button variant="outline" size="icon" onClick={handleSettingsOpen}>
                                <Settings className="w-5 h-5 text-muted-foreground" />
                            </Button>
                            <DialogContent className="sm:max-w-[400px] text-right" dir="rtl">
                                <DialogHeader className="text-right">
                                    <DialogTitle>إعدادات المتعاملين (USSD)</DialogTitle>
                                    <DialogDescription>أكواد كشف الرصيد لكل شبكة</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSettingsSubmit} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>موبيليس (Mobilis)</Label>
                                        <Input
                                            value={ussdConfig.mobilis}
                                            onChange={(e) => setUssdConfig(prev => ({ ...prev, mobilis: e.target.value }))}
                                            placeholder="*222#"
                                            dir="ltr"
                                            className="font-mono text-left"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>جيزي (Djezzy)</Label>
                                        <Input
                                            value={ussdConfig.djezzy}
                                            onChange={(e) => setUssdConfig(prev => ({ ...prev, djezzy: e.target.value }))}
                                            placeholder="*710#"
                                            dir="ltr"
                                            className="font-mono text-left"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>أوريدو (Ooredoo)</Label>
                                        <Input
                                            value={ussdConfig.ooredoo}
                                            onChange={(e) => setUssdConfig(prev => ({ ...prev, ooredoo: e.target.value }))}
                                            placeholder="*200#"
                                            dir="ltr"
                                            className="font-mono text-left"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">حفظ التغييرات</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    إضافة شريحة جديدة
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                                <DialogHeader className="text-right">
                                    <DialogTitle>إعداد شريحة جديدة</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>المتعامل</Label>
                                        <Select
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, operator: val }))}
                                            defaultValue={formData.operator}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mobilis">موبيليس (Mobilis)</SelectItem>
                                                <SelectItem value="djezzy">جيزي (Djezzy)</SelectItem>
                                                <SelectItem value="ooredoo">أوريدو (Ooredoo)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">رقم الهاتف</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="06xxxxxxxx"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="balance">الرصيد الحالي (د.ج)</Label>
                                        <Input
                                            id="balance"
                                            type="number"
                                            value={formData.balance}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pin">PIN Code</Label>
                                            <Input
                                                id="pin"
                                                value={formData.pin}
                                                onChange={handleInputChange}
                                                placeholder="0000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="port">رقم المنفذ / IP</Label>
                                            <Input
                                                id="port"
                                                value={formData.port}
                                                onChange={handleInputChange}
                                                placeholder="192.168.1.1:8080"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">حفظ الإعدادات</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card p-4 rounded-lg border border-border flex flex-row items-center justify-between shadow-sm overflow-hidden relative">
                        <div className="flex-1 min-w-0 z-10">
                            <p className="text-sm text-muted-foreground truncate">إجمالي رصيد الشرائح</p>
                            <h3 className="text-xl md:text-2xl font-bold mt-1 text-primary truncate">
                                {sims.reduce((acc, sim) => acc + (parseFloat(sim.balance) || 0), 0).toLocaleString()} <span className="text-xs md:text-sm font-normal">د.ج</span>
                            </h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-full flex-shrink-0 mr-4 z-10">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-border flex flex-row items-center justify-between shadow-sm overflow-hidden">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground truncate">العمليات المكتملة</p>
                            <h3 className="text-2xl font-bold mt-1 text-green-600 font-mono">
                                {stats.completed}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-full flex-shrink-0 mr-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-border flex flex-row items-center justify-between shadow-sm overflow-hidden">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground truncate">قيد المعالجة</p>
                            <h3 className="text-2xl font-bold mt-1 text-amber-600 font-mono">
                                {stats.pending}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-full flex-shrink-0 mr-4">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                {/* --- NEW SECTION: Large Financial Analysis Card --- */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* 1. Left Side (RTL): Per Operator Breakdown */}
                        <div className="lg:w-1/3 space-y-4 border-l border-border/50 pl-0 lg:pl-8">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-primary" />
                                {t('sims_operator_balances')}
                            </h3>

                            {['mobilis', 'djezzy', 'ooredoo'].map(op => {
                                const total = sims
                                    .filter(s => s.operator === op)
                                    .reduce((acc, s) => acc + (parseFloat(s.balance) || 0), 0);

                                return (
                                    <div key={op} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${getOperatorColor(op)}`} />
                                            <span className="capitalize font-medium">{op}</span>
                                        </div>
                                        <span className="font-bold text-lg">{total.toLocaleString()} <span className="text-xs text-muted-foreground">د.ج</span></span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 2. Right Side: Wholesaler vs Retailer vs SIMs Analysis */}
                        <div className="lg:w-2/3 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Wholesaler Balance */}
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                    <p className="text-sm text-muted-foreground mb-1">{t('sims_wholesaler_balance')}</p>
                                    <h2 className="text-3xl font-bold text-blue-600">
                                        {financials?.totalWholesalerBalance?.toLocaleString() || 0} <span className="text-sm">د.ج</span>
                                    </h2>
                                </div>

                                {/* Retailer Balance */}
                                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                    <p className="text-sm text-muted-foreground mb-1">{t('sims_retailer_balance')}</p>
                                    <h2 className="text-3xl font-bold text-purple-600">
                                        {financials?.totalRetailersBalance?.toLocaleString() || 0} <span className="text-sm">د.ج</span>
                                    </h2>
                                </div>
                            </div>

                            {/* Aggregated Logic & Alert */}
                            {(() => {
                                const totalSimsBalance = sims.reduce((acc, s) => acc + (parseFloat(s.balance) || 0), 0);
                                const totalSystemHoldings = (financials?.totalWholesalerBalance || 0) + (financials?.totalRetailersBalance || 0);
                                const deficit = totalSystemHoldings - totalSimsBalance;
                                const hasDeficit = deficit > 0; // If System (People's money) > Real SIM Money => DEFICIT

                                return (
                                    <div className={`mt-6 p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 ${hasDeficit ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                                        <div className={`p-2 rounded-full ${hasDeficit ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {hasDeficit ? <AlertTriangle className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-lg ${hasDeficit ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {hasDeficit ? t('sims_system_deficit') : t('dash_safe_stable')}
                                            </h4>
                                            <p className="text-sm text-foreground/80 mt-1">
                                                {hasDeficit
                                                    ? `${t('sims_deficit_alert')} (${deficit.toLocaleString()} د.ج)`
                                                    : "رصيد الشرائح كافٍ لتغطية أرصدة جميع المستخدمين."
                                                }
                                            </p>

                                            <div className="mt-3 text-xs flex gap-4 text-muted-foreground font-mono">
                                                <span>Total SIMs: {totalSimsBalance.toLocaleString()}</span>
                                                <span>vs</span>
                                                <span>System: {totalSystemHoldings.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="pr-9"
                            placeholder="بحث برقم الهاتف أو المنفذ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="تصفية حسب المتعامل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المتعاملين</SelectItem>
                                <SelectItem value="mobilis">موبيليس</SelectItem>
                                <SelectItem value="djezzy">جيزي</SelectItem>
                                <SelectItem value="ooredoo">أوريدو</SelectItem>
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

                {/* Table */}
                <div className="rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right w-20">#</TableHead>
                                <TableHead className="text-right">المعرف</TableHead>
                                <TableHead className="text-right">المتعامل</TableHead>
                                <TableHead className="text-right">رقم الهاتف</TableHead>
                                <TableHead className="text-right">الرصيد</TableHead>
                                <TableHead className="text-right">PIN</TableHead>
                                <TableHead className="text-right">Port / IP</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={9} className="text-center">تحميل...</TableCell></TableRow>
                            ) : filteredSims.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد شرائح مطابقة</TableCell></TableRow>
                            ) : filteredSims.map((sim, index) => (
                                <TableRow key={sim.id}>
                                    <TableCell className="font-semibold text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {sim.id ? sim.id.substring(0, 8) : 'N/A'}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getOperatorColor(sim.operator)}`} />
                                            <span className="capitalize">{sim.operator}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{sim.phone}</TableCell>
                                    <TableCell className="font-bold text-emerald-600">
                                        {sim.balance ? Number(sim.balance).toLocaleString() : '0'} د.ج
                                    </TableCell>
                                    <TableCell className="font-mono text-muted-foreground">
                                        {sim.pin ? '****' : '-'}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{sim.port}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs flex items-center w-fit gap-1 ${sim.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <Signal className="w-3 h-3" />
                                            {sim.status === 'active' ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(sim)} title={sim.status === 'active' ? 'تعطيل' : 'تفعيل'}>
                                            <Power className={`w-4 h-4 ${sim.status === 'active' ? 'text-orange-500' : 'text-green-500'}`} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleRefreshBalance(sim)} title="تحديث الرصيد">
                                            <RefreshCw className="w-4 h-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handlePurchaseClick(sim)} title="شراء رصيد (Top-up)">
                                            <Banknote className="w-4 h-4 text-emerald-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(sim)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sim.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>تعديل بيانات الشريحة</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>المتعامل</Label>
                            <Select
                                onValueChange={(val) => setFormData(prev => ({ ...prev, operator: val }))}
                                defaultValue={formData.operator}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mobilis">موبيليس (Mobilis)</SelectItem>
                                    <SelectItem value="djezzy">جيزي (Djezzy)</SelectItem>
                                    <SelectItem value="ooredoo">أوريدو (Ooredoo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">رقم الهاتف</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="balance">الرصيد الحالي (د.ج)</Label>
                            <Input
                                id="balance"
                                type="number"
                                value={formData.balance}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pin">PIN Code</Label>
                                <Input
                                    id="pin"
                                    value={formData.pin}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">رقم المنفذ / IP</Label>
                                <Input
                                    id="port"
                                    value={formData.port}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">تحديث</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Purchase Modal */}
            <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
                <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>شراء رصيد (Top-up)</DialogTitle>
                        <DialogDescription>
                            تسجيل عملية شراء رصيد جديدة للشريحة
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSim && (
                        <form onSubmit={handleVerifyAndSubmit} className="space-y-4 py-4">
                            {/* Status Indicator */}
                            {isPurchaseLoading && (
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-md flex items-center gap-2 text-sm justify-center mb-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    جاري تحديث الرصيد من الشبكة...
                                </div>
                            )}

                            {/* Strict Verification Alert */}
                            {!isPurchaseLoading && purchaseStep === 'verifying' && (() => {
                                const current = Number(selectedSim.balance) || 0;
                                const amount = Number(purchaseData.amount) || 0;
                                const target = initialBalance + amount;
                                const isArrived = current >= target;

                                return (
                                    <div className={`p-3 rounded-md flex items-center gap-3 text-sm mb-2 border ${isArrived ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {isArrived ? (
                                            <>
                                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                <span>تم التحقق من وصول الرصيد بنجاح! يمكن الحفظ الآن.</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold">تنبيه: الرصيد لم يصل بعد!</span>
                                                    <span>المتوقع: {target.toLocaleString()} | الحالي: {current.toLocaleString()}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">الرصيد الحالي (المحقق):</span>
                                <div className="text-left">
                                    <span className="font-bold font-mono text-lg block">{Number(selectedSim.balance).toLocaleString()} د.ج</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>المتعامل</Label>
                                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
                                        <div className={`w-3 h-3 rounded-full ${getOperatorColor(selectedSim.operator)}`} />
                                        <span className="capitalize">{selectedSim.operator}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>رقم الهاتف</Label>
                                    <div className="p-2 border rounded-md bg-muted/20 font-mono text-left">
                                        {selectedSim.phone}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">مبلغ التعبئة (د.ج)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={purchaseData.amount}
                                    onChange={(e) => {
                                        setPurchaseData(prev => ({ ...prev, amount: e.target.value }));
                                        setPurchaseStep('input');
                                    }}
                                    placeholder="مثلاً: 3000"
                                    required
                                    className="font-mono text-lg border-primary/20 focus:border-primary"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discountRate">نسبة التخفيض (%)</Label>
                                <Input
                                    id="discountRate"
                                    type="number"
                                    step="0.1"
                                    value={purchaseData.discountRate}
                                    onChange={(e) => setPurchaseData(prev => ({ ...prev, discountRate: e.target.value }))}
                                    placeholder="مثلاً: 6"
                                    className="font-mono"
                                />
                            </div>

                            {/* Calculations Preview */}
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-dashed">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground mr-1">نسبة التخفيض:</span>
                                    <span className="font-bold text-emerald-600">{purchaseData.discountRate}%</span>
                                </div>
                                <div className="divide-x divide-x-reverse border-t my-2"></div>
                                <div className="flex justify-between items-center text-base">
                                    <span className="font-bold text-foreground">التكلفة الحقيقة (الدفع):</span>
                                    <span className="font-bold text-xl text-emerald-600">
                                        {(Number(purchaseData.amount) * (1 - (Number(purchaseData.discountRate) / 100))).toLocaleString()} د.ج
                                    </span>
                                </div>
                            </div>

                            {/* Strict Verification Logic:
                                The user can only Confirm if they have "Refreshed" AND we (optionally) see a change?
                                Actually, purely blocking based on 'step' is good enough. 
                                "Refresh" moves to "Verifying". 
                                The user checks the "Current Balance" visually.
                                If the user sees it hasn't arrived, they shouldn't click Confirm.
                                BUT USER ASKED: "If it didn't arrive, cannot confirm".
                                This implies automatic check.
                                For automatic check, we need 'initialBalance'.
                                I'll add 'initialBalance' state in the component logic (next tool call) and use it here.
                            */}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsPurchaseOpen(false)}>إلغاء</Button>
                                <Button
                                    type="submit"
                                    className={`gap-2 ${purchaseStep === 'verifying' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    disabled={isPurchaseLoading}
                                >
                                    {isPurchaseLoading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : purchaseStep === 'input' ? (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            تحقق من الوصول (Refresh)
                                        </>
                                    ) : (
                                        <>
                                            <Banknote className="w-4 h-4" />
                                            تأكيد وحفظ (Confirm)
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default Sims;

