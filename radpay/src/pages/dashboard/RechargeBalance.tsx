
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Smartphone, CheckCircle2, Wifi, Router, Gamepad2, Ticket, Wallet, Eye, EyeOff, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Operator configuration matching the design
const OPERATORS = [
    {
        id: "ooredoo",
        name: "أوريدو",
        color: "bg-orange-500",
        iconColor: "text-white",
        ringColor: "ring-orange-500",
        borderColor: "border-orange-500",
        prefixes: ["05"]
    },
    {
        id: "djezzy",
        name: "جيزي",
        color: "bg-red-600",
        iconColor: "text-white",
        ringColor: "ring-red-600",
        borderColor: "border-red-600",
        prefixes: ["07"]
    },
    {
        id: "mobilis",
        name: "موبيليس",
        color: "bg-green-600",
        iconColor: "text-white",
        ringColor: "ring-green-600",
        borderColor: "border-green-600",
        prefixes: ["06"]
    }
];

const INTERNET_OPERATORS = [
    { id: "idoom", name: "إيدوم", icon: Router, borderColor: "border-blue-500", color: "bg-blue-500" },
    { id: "adsl", name: "ADSL", icon: Wifi, borderColor: "border-cyan-500", color: "bg-cyan-500" },
    { id: "4g", name: "4G", icon: Smartphone, borderColor: "border-indigo-500", color: "bg-indigo-500" }
];

const QUICK_AMOUNTS = [100, 200, 500, 1000];

// Stub for Games Interface (Keeping existing logic)
interface GamePackage { id: string; name: string; price: number; }
interface Game { id: string; name: string; image: string; packages: GamePackage[]; }

interface Offer {
    id: string;
    operator: string;
    name: string;
    description: string;
    price: number;
    ussdTemplate: string;
}

const RechargeBalance = () => {
    const { user } = useAuth();
    // Phone State
    const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
    const [rechargeType, setRechargeType] = useState<'flexy' | 'offers'>('flexy');
    const [phoneNumber, setPhoneNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [isRecharging, setIsRecharging] = useState(false);

    // Offers State
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

    // Internet State
    const [selectedInternetOp, setSelectedInternetOp] = useState<string | null>(null);
    const [internetNumber, setInternetNumber] = useState("");
    const [internetAmount, setInternetAmount] = useState("");

    // Games State
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
    const [loadingGames, setLoadingGames] = useState(false);

    // Balance State
    const [balance, setBalance] = useState(0);
    const [showBalance, setShowBalance] = useState(true);

    const backendUrl = "http://localhost:3000/api";

    useEffect(() => {
        // Fetch Games
        const fetchGames = async () => {
            setLoadingGames(true);
            try {
                const res = await fetch(`${backendUrl}/games`);
                if (res.ok) {
                    const data = await res.json();
                    setGames(data);
                }
            } catch (error) {
                console.error("Failed to fetch games", error);
            } finally {
                setLoadingGames(false);
            }
        };

        // Fetch Offers
        const fetchOffers = async () => {
            try {
                const res = await fetch(`${backendUrl}/offers`);
                if (res.ok) {
                    const data = await res.json();
                    setOffers(data);
                }
            } catch (error) {
                console.error("Failed to fetch offers", error);
            }
        };

        fetchGames();
        fetchOffers();
        fetchBalance();
    }, [user]);

    // Fetch Real Balance
    const fetchBalance = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${backendUrl}/stats/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.kpi?.currentBalance !== undefined) {
                    setBalance(data.kpi.currentBalance);
                } else if (data.currentBalance !== undefined) {
                    setBalance(data.currentBalance);
                }
            }
        } catch (error) {
            console.error("Failed to fetch balance", error);
        }
    };

    // Auto-select operator based on phone number
    useEffect(() => {
        // Keep only digits
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        if (cleanNumber.length >= 2) {
            const prefix = cleanNumber.substring(0, 2);
            const matchedOperator = OPERATORS.find(op => op.prefixes.includes(prefix));

            if (matchedOperator) {
                setSelectedOperator(matchedOperator.id);
            }
        }
    }, [phoneNumber]);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedOperator) {
            toast.error("يرجى اختيار المتعامل");
            return;
        }
        if (phoneNumber.length < 9) {
            toast.error("يرجى إدخال رقم هاتف صحيح");
            return;
        }

        setIsRecharging(true);
        const token = await user?.getIdToken();

        try {
            if (rechargeType === 'offers') {
                if (!selectedOffer) {
                    toast.error("يرجى اختيار العرض");
                    setIsRecharging(false);
                    return;
                }

                // Execute Offer API
                const res = await fetch(`${backendUrl}/recharge/offer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        phoneNumber,
                        offerId: selectedOffer.id
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    toast.success(`تم تفعيل العرض بنجاح! ID: ${data.transactionId}`);
                    // Refresh balance
                    fetchBalance();
                } else {
                    toast.error(data.error || "فشلت العملية");
                }

            } else {
                // Flexy API
                if (!amount) {
                    toast.error("يرجى إدخال المبلغ");
                    setIsRecharging(false);
                    return;
                }

                const res = await fetch(`${backendUrl}/recharge/flexy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        phoneNumber,
                        amount: Number(amount),
                        operator: selectedOperator
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    toast.success(`تم الشحن بنجاح! ID: ${data.transactionId}`);
                    fetchBalance();
                    setAmount(""); // Reset amount
                } else {
                    toast.error(data.error || "فشلت العملية");
                }
            }
        } catch (error) {
            console.error("Recharge Error", error);
            toast.error("حدث خطأ في الاتصال");
        } finally {
            setIsRecharging(false);
        }
    };

    const handleInternetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInternetOp) {
            toast.error("يرجى اختيار اشتراك الإنترنت");
            return;
        }
        toast.success("تم إرسال طلب شحن الإنترنت بنجاح");
    };

    const handleGameSubmit = () => {
        if (!selectedGame || !selectedPackage) return;
        toast.success("تم شراء البطاقة بنجاح");
    };

    // Filter offers based on selected operator
    const filteredOffers = selectedOperator
        ? offers.filter(o => o.operator === selectedOperator)
        : [];

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10" dir="rtl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">بيع رصيد</h1>
                        <p className="text-muted-foreground mt-1">شحن فليكسي أو تفعيل عروض</p>
                    </div>

                    {/* Current Balance Card - Matching Design */}
                    <div className="bg-[#E6F4F1] dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl w-64 border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium opacity-80">رصيدك الحالي</span>
                                <button
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 rounded-full transition-colors cursor-pointer z-20"
                                    title={showBalance ? "إخفاء الرصيد" : "إظهار الرصيد"}
                                >
                                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                            </div>
                            <span
                                className={cn(
                                    "text-2xl font-bold mt-2 transition-all duration-300",
                                    !showBalance && "blur-md select-none opacity-50"
                                )}
                                dir="ltr"
                            >
                                {balance.toLocaleString()} DZD
                            </span>
                        </div>
                        <Wallet className="absolute -left-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
                    </div>
                </div>

                <div className="max-w-5xl mx-auto space-y-12">

                    {/* SECTION 1: Phone Recharge */}
                    <section className="space-y-6">

                        {/* 1. Operator Selection Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {OPERATORS.map((op) => {
                                const isSelected = selectedOperator === op.id;
                                return (
                                    <div
                                        key={op.id}
                                        onClick={() => setSelectedOperator(op.id)}
                                        className={cn(
                                            "cursor-pointer relative bg-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 border-2 shadow-sm hover:shadow-md h-40",
                                            isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300",
                                            op.color,
                                            isSelected ? "scale-110" : ""
                                        )}>
                                            <Smartphone className="w-6 h-6 text-white" />
                                        </div>

                                        <span className="font-bold text-lg">{op.name}</span>

                                        {isSelected && (
                                            <div className="animate-in fade-in zoom-in duration-200">
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 2. Transaction Data Form Container */}
                        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-8 space-y-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 className="text-xl font-bold">بيانات العملية</h2>
                                </div>

                                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                                        <Input
                                            type="tel"
                                            placeholder="0X XX XX XX XX"
                                            className="text-left text-lg font-mono tracking-wider h-14 bg-background/50 border-input focus:border-primary/50 transition-all rounded-xl"
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setPhoneNumber(val);
                                            }}
                                            required
                                            disabled={isRecharging}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 bg-background/50 p-1.5 rounded-xl gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRechargeType('flexy');
                                                setSelectedOffer(null);
                                            }}
                                            className={cn(
                                                "py-3 rounded-lg text-sm font-bold transition-all",
                                                rechargeType === 'flexy'
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-white/10"
                                            )}
                                            disabled={isRecharging}
                                        >
                                            فليكسي (مبلغ حر)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRechargeType('offers')}
                                            className={cn(
                                                "py-3 rounded-lg text-sm font-bold transition-all",
                                                rechargeType === 'offers'
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-white/10"
                                            )}
                                            disabled={isRecharging}
                                        >
                                            عروض (Internet/Calls)
                                        </button>
                                    </div>

                                    {/* Conditional Content Based on Recharge Type */}
                                    {rechargeType === 'flexy' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">المبلغ (د.ج)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="أدخل المبلغ"
                                                    className="h-14 text-lg bg-background/50 border-input focus:border-primary/50 transition-all rounded-xl"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    min="1"
                                                    required
                                                    disabled={isRecharging}
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 gap-3">
                                                {QUICK_AMOUNTS.map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setAmount(val.toString())}
                                                        className="py-2.5 rounded-lg border border-border bg-background/50 hover:bg-primary/10 hover:border-primary/50 text-sm font-medium transition-all"
                                                        disabled={isRecharging}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                                <span>اختر العرض</span>
                                                {selectedOperator && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                        {filteredOffers.length} عروض متاحة
                                                    </span>
                                                )}
                                            </label>

                                            {!selectedOperator ? (
                                                <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
                                                    يرجى اختيار المتعامل أولاً لعرض العروض المتاحة
                                                </div>
                                            ) : filteredOffers.length === 0 ? (
                                                <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
                                                    لا توجد عروض متاحة لهذا المتعامل حالياً
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {filteredOffers.map((offer) => {
                                                        const isSelected = selectedOffer?.id === offer.id;
                                                        return (
                                                            <div
                                                                key={offer.id}
                                                                onClick={() => !isRecharging && setSelectedOffer(offer)}
                                                                className={cn(
                                                                    "relative cursor-pointer border rounded-xl p-4 transition-all hover:shadow-md flex flex-col gap-2",
                                                                    isSelected
                                                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                                        : "border-border bg-card hover:border-primary/50",
                                                                    isRecharging && "opacity-50 cursor-not-allowed"
                                                                )}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="font-bold text-lg">{offer.name}</div>
                                                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground line-clamp-2">
                                                                    {offer.description}
                                                                </div>
                                                                <div className="mt-auto pt-2 flex items-center justify-between">
                                                                    <div className="font-bold text-lg text-emerald-600">
                                                                        {offer.price.toLocaleString()} د.ج
                                                                    </div>
                                                                    <Tag className="w-4 h-4 text-muted-foreground opacity-50" />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-14 text-lg font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        disabled={!selectedOperator || phoneNumber.length < 9 || (rechargeType === 'offers' && !selectedOffer) || isRecharging}
                                    >
                                        {isRecharging ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                                جاري المعالجة...
                                            </>
                                        ) : (
                                            <>
                                                {rechargeType === 'flexy' ? 'تأكيد العملية' : 'تفعيل العرض'}
                                                {rechargeType === 'offers' && selectedOffer && ` (${selectedOffer.price} د.ج)`}
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    {/* SECTION 2: Internet Recharge */}
                    <section className="space-y-6 pt-10 border-t border-dashed border-border/50">
                        <div className="flex items-center gap-2">
                            <Wifi className="w-6 h-6 text-blue-500" />
                            <h2 className="text-2xl font-bold">شحن الإنترنت</h2>
                        </div>

                        <form onSubmit={handleInternetSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {INTERNET_OPERATORS.map((op) => {
                                    const isSelected = selectedInternetOp === op.id;
                                    return (
                                        <div
                                            key={op.id}
                                            onClick={() => setSelectedInternetOp(op.id)}
                                            className={cn(
                                                "cursor-pointer relative bg-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 border-2 h-40",
                                                isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-border hover:border-border/80"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center shadow-md",
                                                op.color,
                                                isSelected ? "scale-110 text-white" : "bg-secondary text-foreground"
                                            )}>
                                                <op.icon className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-lg">{op.name}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">رقم الهاتف / الشريحة</label>
                                        <Input
                                            type="text"
                                            placeholder="أدخل الرقم"
                                            className="h-14 text-lg bg-background/50 border-input rounded-xl"
                                            value={internetNumber}
                                            onChange={(e) => setInternetNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">المبلغ (د.ج)</label>
                                        <Input
                                            type="number"
                                            placeholder="أدخل المبلغ"
                                            className="h-14 text-lg bg-background/50 border-input rounded-xl"
                                            value={internetAmount}
                                            onChange={(e) => setInternetAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Button
                                            type="submit"
                                            className="w-full h-14 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700"
                                        >
                                            تأكيد شحن الإنترنت
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </section>

                    {/* SECTION 3: Games Recharge */}
                    <section className="space-y-6 pt-10 border-t border-dashed border-border/50">
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="w-6 h-6 text-purple-500" />
                            <h2 className="text-2xl font-bold">شحن الألعاب</h2>
                        </div>

                        {loadingGames ? (
                            <div className="text-center py-8">جاري تحميل الألعاب...</div>
                        ) : games.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">لا توجد ألعاب متوفرة حالياً</div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {games.map((game) => {
                                        const isSelected = selectedGame?.id === game.id;
                                        return (
                                            <div
                                                key={game.id}
                                                onClick={() => {
                                                    setSelectedGame(game);
                                                    setSelectedPackage(null);
                                                }}
                                                className={cn(
                                                    "cursor-pointer bg-card rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-3 h-32 hover:shadow-md transition-all",
                                                    isSelected ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" : "border-border"
                                                )}
                                            >
                                                {game.image ? (
                                                    <img src={game.image} alt={game.name} className="w-12 h-12 object-contain" />
                                                ) : (
                                                    <Gamepad2 className="w-10 h-10 text-purple-500" />
                                                )}
                                                <span className="font-bold text-sm text-center">{game.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedGame && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-purple-500" />
                                            اختر البطاقة لـ {selectedGame.name}:
                                        </h3>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {selectedGame.packages?.map((pkg) => {
                                                const isPkgSelected = selectedPackage?.id === pkg.id;
                                                return (
                                                    <div
                                                        key={pkg.id}
                                                        onClick={() => setSelectedPackage(pkg)}
                                                        className={cn(
                                                            "cursor-pointer p-4 rounded-xl border transition-all hover:shadow-md",
                                                            isPkgSelected
                                                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10"
                                                                : "border-border bg-card hover:border-purple-200"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-sm">{pkg.name}</span>
                                                            {isPkgSelected && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                                                        </div>
                                                        <div className="text-xl font-bold text-primary">
                                                            {pkg.price.toLocaleString()} د.ج
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedPackage && (
                                    <div className="pt-4">
                                        <Button
                                            onClick={handleGameSubmit}
                                            className="w-full h-14 text-lg font-bold bg-purple-600 hover:bg-purple-700"
                                        >
                                            شراء البطاقة ({selectedPackage.price.toLocaleString()} د.ج)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default RechargeBalance;
