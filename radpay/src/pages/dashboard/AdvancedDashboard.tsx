
import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Wallet, Users, AlertTriangle, TrendingUp, TrendingDown,
    MapPin, Clock, Smartphone, Briefcase, Activity, ArrowUpRight,
    Wifi, Gamepad
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SpendingDetailsModal from "@/components/modals/SpendingDetailsModal";

const backendUrl = "http://localhost:3000/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdvancedDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showSpendingModal, setShowSpendingModal] = useState(false);
    const { t } = useLanguage();
    const { role } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = auth.currentUser;
                const token = user ? await user.getIdToken() : null;

                const res = await fetch(`${backendUrl}/stats/dashboard`, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">{t('dash_loading')}</div>;
    if (!data) return <div className="p-8 text-center text-red-500">{t('dash_error')}</div>;

    const { kpi, geo, offers, time, dealers } = data;

    const isPrivileged = ['admin', 'super_admin', 'wholesaler', 'super_wholesaler'].includes(role || '');

    // RETAILER (NON-PRIVILEGED) VIEW
    if (!isPrivileged) {
        return (
            <div className="space-y-6" dir="rtl">
                {/* Retailer KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                        title="رصيدي الحالي"
                        value={`${(kpi.systemBalance || 0).toLocaleString()} د.ج`}
                        icon={<Wallet className="text-emerald-500" />}
                        trend=""
                    />
                    <KPICard
                        title="إجمالي العمليات"
                        value={kpi.totalTransactions}
                        icon={<Activity className="text-blue-500" />}
                        trend=""
                    />
                    <KPICard
                        title="إجمالي المدفوعات"
                        value={`${(kpi.totalRevenue || 0).toLocaleString()} د.ج`}
                        icon={<ArrowUpRight className="text-purple-500" />}
                        trend=""
                    />
                </div>

                {/* Retailer Charts (Personal Traffic) */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        نشاطي اليومي
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={time}>
                                <defs>
                                    <linearGradient id="colorCountRet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                                <YAxis />
                                <Tooltip labelFormatter={(h) => `${t('dash_time_tooltip')} ${h}:00`} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCountRet)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Offer Analysis (My Top Sales) */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        أكثر العروض مبيعاً
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={offers}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {offers.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {offers.slice(0, 5).map((entry: any, index: number) => (
                                <div key={index} className="flex items-center gap-1 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ADMIN / WHOLESALER VIEW
    return (
        <div className="space-y-6" dir="rtl">

            {/* 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard
                    title={t('dash_total_transactions')}
                    value={kpi.totalTransactions}
                    icon={<Activity className="text-blue-500" />}
                    trend="+12%" // Mock trend
                />
                <KPICard
                    title="إجمالي المصروفات"
                    value={`${(kpi.totalSpent || 0).toLocaleString()} د.ج`}
                    icon={<TrendingDown className="text-red-500" />}
                    trend=""
                    onClick={() => setShowSpendingModal(true)}
                    clickable={true}
                />
                <KPICard
                    title={t('dash_active_dealers')}
                    value={kpi.activeDealersCount}
                    icon={<Users className="text-purple-500" />}
                    trend="+2"
                />

                {/* Financial Breakdowns - SUPER ADMIN ONLY */}
                {role === 'super_admin' && (
                    <>
                        <KPICard
                            title="رصيد الشرائح (SIMs)"
                            value={`${kpi.totalSimsBalance?.toLocaleString() || 0} د.ج`}
                            icon={<Smartphone className="text-emerald-600" />}
                            trend=""
                            isNegative={false}
                        />
                        <KPICard
                            title="رصيد بطاقات الألعاب"
                            value={`${kpi.totalGameCardsBalance?.toLocaleString() || 0} د.ج`}
                            icon={<Gamepad className="text-amber-500" />}
                            trend=""
                            isNegative={false}
                        />
                        <KPICard
                            title="رصيد بطاقات الإنترنت"
                            value={`${kpi.totalInternetCardsBalance?.toLocaleString() || 0} د.ج`}
                            icon={<Wifi className="text-blue-600" />}
                            trend=""
                            isNegative={false}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 2. Geographic Analysis */}
                <div className="bg-card border rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            {t('dash_geo_title')}
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={geo}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${value} د.ج`, t('dash_geo_revenue')]}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Offer Analysis */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        {t('dash_offers_title')}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={offers}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {offers.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {offers.slice(0, 5).map((entry: any, index: number) => (
                                <div key={index} className="flex items-center gap-1 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Time Analysis */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('dash_time_title')}
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={time}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                            <YAxis />
                            <Tooltip labelFormatter={(h) => `${t('dash_time_tooltip')} ${h}:00`} />
                            <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 5. Top Dealers */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        {t('dash_dealers_title')}
                    </h3>
                    <div className="space-y-4">
                        {dealers.map((dealer: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{dealer.name}</p>
                                        <p className="text-xs text-muted-foreground">{dealer.count} عملية</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">{dealer.revenue.toLocaleString()} د.ج</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. System Health / Wallets */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        {t('dash_system_health')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl text-white">
                            <p className="text-blue-100 text-sm">{t('dash_system_balance')}</p>
                            <h2 className="text-3xl font-bold mt-2">{kpi.systemBalance.toLocaleString()} د.ج</h2>
                            <div className="mt-4 flex gap-2">
                                <span className="bg-white/20 px-2 py-1 rounded text-xs">{t('dash_safe_stable')}</span>
                            </div>
                        </div>

                        {/* Placeholder for SIM Balances - requires fetching SIMs separatly or passing them */}
                        <div className="p-4 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                            {t('dash_low_balance_alert')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Spending Details Modal */}
            <SpendingDetailsModal
                open={showSpendingModal}
                onClose={() => setShowSpendingModal(false)}
                spendingData={kpi.spendingByUser || []}
                totalSpent={kpi.totalSpent || 0}
            />
        </div>
    );
}

function KPICard({ title, value, icon, trend, isNegative, onClick, clickable }: any) {
    const { t } = useLanguage();
    return (
        <div
            className={`bg-card border p-6 rounded-xl shadow-sm flex flex-col justify-between ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${isNegative ? 'bg-red-50' : 'bg-secondary/50'}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                {trend && (
                    <>
                        <span className={`flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'} font-medium`}>
                            {trend.startsWith('-') ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                            {trend}
                        </span>
                        <span className="text-muted-foreground mr-1">{t('dash_vs_yesterday')}</span>
                    </>
                )}
                {clickable && (
                    <span className="text-primary text-xs mr-auto">اضغط للتفاصيل</span>
                )}
            </div>
        </div>
    );
}
