import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ArrowUpRight, AlertTriangle, Wallet, Smartphone, Save, TrendingDown, Calendar, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Rates Interface
interface OperatorRates {
    mobilis: number;
    djezzy: number;
    ooredoo: number;
}
interface ProfitRates {
    admin: OperatorRates;
    wholesaler: OperatorRates;
    retailer: OperatorRates;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-bold mb-1">{label}</p>
                <p className="text-emerald-600">
                    المبلغ: {formatCurrency(payload[0].value as number)} د.ج
                </p>
                <p className="text-blue-600">
                    العمليات: {payload[0].payload.count} PROCESS
                </p>
            </div>
        );
    }
    return null;
};

const Financials = () => {
    const { role, token } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState("30");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    // Rates State
    const [rates, setRates] = useState<ProfitRates | null>(null);
    const [ratesLoading, setRatesLoading] = useState(false);

    const backendUrl = "http://localhost:3000/api";

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
                let url = `${backendUrl}/stats/financials`;
                if (period === 'custom') {
                    if (customStartDate && customEndDate) {
                        url += `?startDate=${customStartDate}&endDate=${customEndDate}`;
                    } else {
                        // If custom selected but dates not set, skip fetch
                        setLoading(false);
                        return;
                    }
                } else {
                    url += `?days=${period}`;
                }

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    setError("Failed to load stats");
                }
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [period, customStartDate, customEndDate, token]);

    // Fetch Rates on Mount (if Admin)
    useEffect(() => {
        if (role !== 'super_admin' && role !== 'admin') return;
        const fetchRates = async () => {
            setRatesLoading(true);
            try {
                const res = await fetch(`${backendUrl}/settings/rates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRates(data);
                }
            } catch (e) {
                console.error("Failed to fetch rates", e);
            } finally {
                setRatesLoading(false);
            }
        };
        fetchRates();
    }, [role, token]);

    const handleRateChange = (level: keyof ProfitRates, op: keyof OperatorRates, value: string) => {
        if (!rates) return;
        setRates({
            ...rates,
            [level]: {
                ...rates[level],
                [op]: Number(value)
            }
        });
    };

    const saveRates = async () => {
        if (!rates) return;
        try {
            const res = await fetch(`${backendUrl}/settings/rates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(rates)
            });
            if (res.ok) {
                alert("تم تحديث النسب بنجاح!");
            } else {
                alert("فشل الحفظ");
            }
        } catch (e) {
            alert("خطأ في الاتصال");
        }
    };

    if (loading && !stats) {
        return <DashboardLayout><div>Loading...</div></DashboardLayout>;
    }

    if (!stats) {
        return <DashboardLayout><div>Error loading data</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('fin_title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('fin_header_desc')}</p>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="overview">نظرة عامة (Overview)</TabsTrigger>
                        {((role as string) === 'super_admin' || (role as string) === 'admin') && (
                            <TabsTrigger value="rates">تحكم النسب (Rates)</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                        {/* Period Selector */}
                        <div className="flex flex-col gap-4 mb-4" dir="rtl">
                            <div className="flex justify-start gap-2">
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={t('fin_period_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">{t('fin_period_7')}</SelectItem>
                                        <SelectItem value="30">{t('fin_period_30')}</SelectItem>
                                        <SelectItem value="90">{t('fin_period_90')}</SelectItem>
                                        <SelectItem value="custom">فترة مخصصة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {period === 'custom' && (
                                <div className="flex gap-2 items-center">
                                    <Label className="text-sm font-medium">من:</Label>
                                    <Input
                                        type="date"
                                        className="w-[160px]"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                    <Label className="text-sm font-medium">إلى:</Label>
                                    <Input
                                        type="date"
                                        className="w-[160px]"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 1. Top KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {role === 'super_admin' && (
                                <Card className="glass-card">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">رصيد الشرائح الإجمالي</CardTitle>
                                        <Smartphone className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-500">
                                            {formatCurrency(stats.totalSimsBalance || 0)} د.ج
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">إجمالي الرصيد المتوفر في الشرائح</p>
                                        {stats.uid && <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono text-left" dir="ltr">{stats.uid}</p>}

                                        {(() => {
                                            const totalSystemHoldings = (stats.totalWholesalerBalance || 0) + (stats.totalRetailersBalance || 0);
                                            const deficit = totalSystemHoldings - (stats.totalSimsBalance || 0);

                                            if (deficit > 0) {
                                                return (
                                                    <div className="mt-4 pt-4 border-t border-dashed">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-red-500">العجز الحالي</p>
                                                            <div className="flex items-center gap-1 text-red-600 font-bold">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                <span>{formatCurrency(deficit)} د.ج</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">{role === 'retailer' ? 'رصيدي الحالي' : t('fin_retailers_balance')}</CardTitle>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(role === 'retailer' ? stats.totalSystemBalance : stats.totalRetailersBalance)} د.ج
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{role === 'retailer' ? 'الرصيد المتوفر في محفظتك' : t('fin_retailers_balance_desc')}</p>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">{t('fin_volume')}</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(stats.chartData?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0)} د.ج
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {period === "7" ? t('fin_period_7') : period === "30" ? t('fin_period_30') : t('fin_period_90')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* PROFIT CARDS */}
                            {((role as string) === 'super_admin' || (role as string) === 'admin') && (
                                <Card className="glass-card border-green-100 dark:border-green-900/20">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">صافي الربح (Admin)</CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            +{formatCurrency(stats.totalAdminProfit || 0)} د.ج
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            الأرباح من الفارق بين سعر الجملة وسعر التكلفة
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {((role as string) === 'wholesaler' || (role as string) === 'super_wholesaler') && (
                                <Card className="glass-card border-green-100 dark:border-green-900/20">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">صافي الربح (Wholesaler)</CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            +{formatCurrency(stats.totalWholesalerProfit || 0)} د.ج
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            الأرباح من الفارق بين سعر التجزئة وسعر الجملة
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* RETAILER PROFIT CARDS */}
                            {role === 'retailer' && (
                                <>
                                    <Card className="glass-card border-emerald-100 dark:border-emerald-900/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">ربح اليوم</CardTitle>
                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-emerald-600">
                                                +{formatCurrency(stats.todayProfit || 0)} د.ج
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                الأرباح المحققة اليوم
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-card border-blue-100 dark:border-blue-900/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">ربح الأسبوع</CardTitle>
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-blue-600">
                                                +{formatCurrency(stats.weekProfit || 0)} د.ج
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                آخر 7 أيام
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-card border-purple-100 dark:border-purple-900/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">ربح الشهر</CardTitle>
                                            <BarChart3 className="h-4 w-4 text-purple-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-purple-600">
                                                +{formatCurrency(stats.monthProfit || 0)} د.ج
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                آخر 30 يوم
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-card border-amber-100 dark:border-amber-900/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium">متوسط الربح اليومي</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-amber-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-amber-600">
                                                +{formatCurrency(stats.averageDailyProfit || 0)} د.ج
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                المعدل الشهري
                                            </p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>

                        {/* 2. Middle Section: Low Balance & Active */}
                        {role !== 'retailer' && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                {/* Low Balance Retailers (3 cols) */}
                                <Card className="lg:col-span-3 glass-card border-red-100 dark:border-red-900/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                            {t('fin_low_balance')}
                                        </CardTitle>
                                        <CardDescription>{t('fin_low_balance_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {stats.lowBalanceRetailers?.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                                                    <Wallet className="w-8 h-8 opacity-20" />
                                                    <p>جميع الأرصدة جيدة</p>
                                                </div>
                                            ) : (
                                                stats.lowBalanceRetailers?.map((retailer: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                                        <span className="font-medium text-sm">{retailer.name}</span>
                                                        <span className="font-bold text-red-600 text-sm">{formatCurrency(retailer.balance)} د.ج</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Active Retailers (4 cols) */}
                                <Card className="lg:col-span-4 glass-card">
                                    <CardHeader>
                                        <CardTitle>{t('fin_active_retailers')}</CardTitle>
                                        <CardDescription>{t('fin_active_retailers_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {stats.activeRetailers?.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">لا توجد بيانات كافية</p>
                                            ) : (
                                                stats.activeRetailers?.map((retailer: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border hover:border-primary/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{retailer.name}</p>
                                                                <p className="text-xs text-muted-foreground">{retailer.count} عملية</p>
                                                            </div>
                                                        </div>
                                                        <div className="font-bold text-emerald-600 text-sm">
                                                            {formatCurrency(retailer.volume)} د.ج
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* 3. Bottom Section: Activity Chart */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>{t('fin_chart_title')}</CardTitle>
                                <CardDescription>{t('fin_chart_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('ar-DZ', { day: '2-digit', month: '2-digit' })}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `${val / 1000}k`}
                                            fontSize={12}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* RATES CONFIGURATION TAB */}
                    {((role as string) === 'super_admin' || (role as string) === 'admin') && (
                        <TabsContent value="rates" className="mt-6 space-y-6">
                            {ratesLoading ? (
                                <div className="py-8 text-center text-muted-foreground">جاري تحميل النسب...</div>
                            ) : !rates ? (
                                <div className="py-8 text-center text-red-500">فشل في تحميل إعدادات النسب</div>
                            ) : (
                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle>تكوين نسبة التخفيض (% Discount)</CardTitle>
                                        <CardDescription>
                                            حدد نسبة التخفيض لكل مستوى (المدير، الجملة، التجزئة) من سعر البيع لكل متعامل.
                                            <br />
                                            هذه النسب ستستخدم لحساب الأرباح تلقائياً عند كل عملية.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto" dir="rtl">
                                            <table className="w-full text-sm text-right">
                                                <thead className="bg-muted/50 text-muted-foreground">
                                                    <tr>
                                                        <th className="p-3">المستوى (Level)</th>
                                                        <th className="p-3 text-emerald-600">Mobilis (%)</th>
                                                        <th className="p-3 text-red-600">Djezzy (%)</th>
                                                        <th className="p-3 text-yellow-600">Ooredoo (%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {/* Admin Row */}
                                                    <tr>
                                                        <td className="p-3 font-bold">المدير (Admin Cost)</td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.admin.mobilis}
                                                                onChange={(e) => handleRateChange('admin', 'mobilis', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.admin.djezzy}
                                                                onChange={(e) => handleRateChange('admin', 'djezzy', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.admin.ooredoo}
                                                                onChange={(e) => handleRateChange('admin', 'ooredoo', e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                    {/* Wholesaler Row */}
                                                    <tr>
                                                        <td className="p-3 font-bold">تاجر الجملة (Wholesaler)</td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.wholesaler.mobilis}
                                                                onChange={(e) => handleRateChange('wholesaler', 'mobilis', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.wholesaler.djezzy}
                                                                onChange={(e) => handleRateChange('wholesaler', 'djezzy', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.wholesaler.ooredoo}
                                                                onChange={(e) => handleRateChange('wholesaler', 'ooredoo', e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                    {/* Retailer Row */}
                                                    <tr className="bg-muted/10">
                                                        <td className="p-3 font-bold">بائع التجزئة (Retailer) <br /><span className="text-xs font-normal text-muted-foreground">غالباً 0% لأنه يبيع بالسعر الكامل</span></td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.retailer.mobilis}
                                                                onChange={(e) => handleRateChange('retailer', 'mobilis', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.retailer.djezzy}
                                                                onChange={(e) => handleRateChange('retailer', 'djezzy', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number" className="w-20"
                                                                value={rates.retailer.ooredoo}
                                                                onChange={(e) => handleRateChange('retailer', 'ooredoo', e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button onClick={saveRates} className="gap-2">
                                                <Save className="w-4 h-4" />
                                                حفظ التغييرات
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Financials;
