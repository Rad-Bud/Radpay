import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ArrowUpRight, AlertTriangle, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const [period, setPeriod] = useState("30"); // Default 30 days

    const backendUrl = "http://localhost:3000/api";

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${backendUrl}/stats/financials?days=${period}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    const errText = await res.text();
                    console.error('Failed to fetch financial stats:', errText);
                    setError(`Error: ${res.status} - ${res.statusText}`);
                }
            } catch (error: any) {
                console.error('Error fetching stats:', error);
                setError(error.message || 'Unknown Error');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [period]);

    if (loading && !stats) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                </div>
            </DashboardLayout>
        );
    }

    if (!stats) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">تعذر تحميل البيانات المالية</p>
                    {error && <p className="text-sm text-red-500 mt-2 bg-red-50/10 p-2 rounded">{error}</p>}
                    <p className="text-sm opacity-70 mt-1">يرجى المحاولة لاحقاً</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('fin_title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('fin_header_desc')}</p>
                    </div>

                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('fin_period_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">{t('fin_period_7')}</SelectItem>
                            <SelectItem value="30">{t('fin_period_30')}</SelectItem>
                            <SelectItem value="90">{t('fin_period_90')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 1. Top KPI Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{t('fin_current_balance')}</CardTitle>
                            <Wallet className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                {formatCurrency(stats.totalSystemBalance)} د.ج
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{t('fin_available_balance')}</p>
                            {stats.uid && <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono text-left" dir="ltr">{stats.uid}</p>}

                            {stats.wholesalerDebt !== undefined && (
                                <div className="mt-4 pt-4 border-t border-dashed">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-red-500">{t('fin_debt')}</p>
                                        <div className="flex items-center gap-1 text-red-600 font-bold">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>{formatCurrency(stats.wholesalerDebt)} د.ج</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{t('fin_retailers_balance')}</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(stats.totalRetailersBalance)} د.ج
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{t('fin_retailers_balance_desc')}</p>
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
                </div>

                {/* 2. Middle Section: Low Balance & Active */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                    {/* Low Balance Retailers (3 cols) - Now First (Right in RTL) */}
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

                    {/* Active Retailers (4 cols) - Now Second (Left in RTL) */}
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
            </div>
        </DashboardLayout>
    );
};

export default Financials;
