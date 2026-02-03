import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

const statsCards = [
  {
    title: "إجمالي العمليات",
    value: "12,847",
    change: "+12.5%",
    isPositive: true,
    icon: Activity
  },
  {
    title: "المكاتب النشطة",
    value: "342",
    change: "+8.2%",
    isPositive: true,
    icon: Users
  },
  {
    title: "الإيرادات اليومية",
    value: "45,230 د.ل",
    change: "+23.1%",
    isPositive: true,
    icon: TrendingUp
  },
  {
    title: "نسبة النجاح",
    value: "99.8%",
    change: "-0.1%",
    isPositive: false,
    icon: CreditCard
  }
];

const recentTransactions = [
  { office: "مكتب الأمل", amount: "500 د.ل", network: "ليبيانا", status: "success", time: "منذ دقيقة" },
  { office: "نقطة البيع 12", amount: "250 د.ل", network: "المدار", status: "success", time: "منذ 3 دقائق" },
  { office: "مكتب النور", amount: "1000 د.ل", network: "ليبيا للاتصالات", status: "pending", time: "منذ 5 دقائق" },
  { office: "مكتب السلام", amount: "750 د.ل", network: "ليبيانا", status: "success", time: "منذ 8 دقائق" },
];

const Dashboard = () => {
  return (
    <section id="dashboard" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            لوحة التحكم
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            تحكم <span className="text-gradient-primary">كامل</span> في عملياتك
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            لوحة تحكم شاملة لمتابعة العمليات وإدارة المكاتب والتقارير المالية
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-4 md:p-8 rounded-3xl">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className="bg-secondary/50 rounded-2xl p-4 md:p-5 border border-border/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      stat.isPositive ? 'text-tashil-success' : 'text-destructive'
                    }`}>
                      {stat.isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.title}</div>
                </div>
              ))}
            </div>

            {/* Transactions Table */}
            <div className="bg-secondary/30 rounded-2xl p-4 md:p-6 border border-border/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">آخر العمليات</h3>
                <Button variant="ghost" size="sm" className="text-primary">
                  عرض الكل
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground text-sm border-b border-border/30">
                      <th className="text-right pb-4 font-medium">المكتب</th>
                      <th className="text-right pb-4 font-medium hidden sm:table-cell">الشبكة</th>
                      <th className="text-right pb-4 font-medium">المبلغ</th>
                      <th className="text-right pb-4 font-medium">الحالة</th>
                      <th className="text-right pb-4 font-medium hidden md:table-cell">الوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx, index) => (
                      <tr key={index} className="border-b border-border/20 last:border-0">
                        <td className="py-4">
                          <span className="font-medium">{tx.office}</span>
                        </td>
                        <td className="py-4 hidden sm:table-cell">
                          <span className="text-muted-foreground">{tx.network}</span>
                        </td>
                        <td className="py-4">
                          <span className="font-bold text-primary">{tx.amount}</span>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'success' 
                              ? 'bg-tashil-success/10 text-tashil-success' 
                              : 'bg-tashil-warning/10 text-tashil-warning'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === 'success' ? 'bg-tashil-success' : 'bg-tashil-warning'
                            }`} />
                            {tx.status === 'success' ? 'ناجح' : 'قيد التنفيذ'}
                          </span>
                        </td>
                        <td className="py-4 text-muted-foreground text-sm hidden md:table-cell">
                          {tx.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            جرب لوحة التحكم مجاناً
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
