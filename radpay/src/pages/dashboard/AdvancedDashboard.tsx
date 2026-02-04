
import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Wallet, Users, AlertTriangle, TrendingUp, TrendingDown,
    MapPin, Clock, Smartphone, Briefcase, Activity, ArrowUpRight
} from "lucide-react";

const backendUrl = "http://localhost:3000/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdvancedDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${backendUrl}/stats/dashboard`);
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

    if (loading) return <div className="p-8 text-center">جاري تحميل البيانات...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">فشل تحميل البيانات</div>;

    const { kpi, geo, offers, time, dealers } = data;

    return (
        <div className="space-y-6" dir="rtl">

            {/* 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="إجمالي العمليات اليوم"
                    value={kpi.totalTransactions}
                    icon={<Activity className="text-blue-500" />}
                    trend="+12%" // Mock trend
                />
                <KPICard
                    title="إجمالي الإيرادات"
                    value={`${kpi.totalRevenue.toLocaleString()} د.ج`}
                    icon={<Wallet className="text-green-500" />}
                    trend="+5%"
                />
                <KPICard
                    title="المكاتب النشطة"
                    value={kpi.activeDealersCount}
                    icon={<Users className="text-purple-500" />}
                    trend="+2"
                />
                <KPICard
                    title="العمليات الفاشلة"
                    value={kpi.failedTransactions}
                    icon={<AlertTriangle className="text-red-500" />}
                    trend="-1%"
                    isNegative={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 2. Geographic Analysis */}
                <div className="bg-card border rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            أكثر البلديات نشاطاً
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
                                    formatter={(value: any) => [`${value} د.ج`, "الإيرادات"]}
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
                        العروض الأكثر طلباً
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
                    تحليل النشاط الزمني (أوقات الذروة)
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
                            <Tooltip labelFormatter={(h) => `الساعة ${h}:00`} />
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
                        أفضل المتعاملين أداءً
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
                        حالة النظام المالية
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl text-white">
                            <p className="text-blue-100 text-sm">إجمالي الأرصدة في النظام</p>
                            <h2 className="text-3xl font-bold mt-2">{kpi.systemBalance.toLocaleString()} د.ج</h2>
                            <div className="mt-4 flex gap-2">
                                <span className="bg-white/20 px-2 py-1 rounded text-xs">آمن ومستقر</span>
                            </div>
                        </div>

                        {/* Placeholder for SIM Balances - requires fetching SIMs separatly or passing them */}
                        <div className="p-4 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                            تنبيهات الأرصدة المنخفضة ستظهر هنا
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function KPICard({ title, value, icon, trend, isNegative }: any) {
    return (
        <div className="bg-card border p-6 rounded-xl shadow-sm flex flex-col justify-between">
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
                <span className={`flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'} font-medium`}>
                    {trend.startsWith('-') ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                    {trend}
                </span>
                <span className="text-muted-foreground mr-1">مقارنة بالأمس</span>
            </div>
        </div>
    );
}
