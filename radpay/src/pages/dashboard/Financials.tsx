import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Financials = () => {
    const { role } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const backendUrl = "http://localhost:3000/api";

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${backendUrl}/stats/financials`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    console.error('Failed to fetch financial stats');
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!stats) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                    <p className="text-red-500 font-medium">فشل تحميل البيانات المالية</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-primary hover:underline"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">المالية</h1>
                    <p className="text-muted-foreground mt-1">نظرة عامة على الوضع المالي للنظام</p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي رصيد النظام</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totalSystemBalance)} د.ج</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                الرصيد المتوفر في جميع المحافظ
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">أرصدة اجمالية لبائعي تجزئة</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totalWholesalerBalance)} د.ج</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                مجموع أرصدة حسابات الجملة
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ديون بائعي التجزئة</CardTitle>
                            <ArrowDownLeft className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalRetailerDebt)} د.ج</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                المبالغ المستحقة على بائعي التجزئة
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction Volume */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>حركة اليوم</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                <TrendingUp className="h-8 w-8 text-emerald-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">حجم التعاملات</p>
                                    <h3 className="text-2xl font-bold">{formatCurrency(stats.todayVolume)} د.ج</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                <ArrowUpRight className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">عدد العمليات</p>
                                    <h3 className="text-2xl font-bold">{stats.todayTransactions}</h3>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Financials;
