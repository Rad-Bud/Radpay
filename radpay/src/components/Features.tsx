import {
  Cpu,
  Layers,
  Bell,
  ShieldCheck,
  BarChart3,
  Expand
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "توزيع ذكي للشرائح",
    description: "اختيار الشريحة الأقل استخداماً وتجنب الشرائح المرهقة مع إيقاف تلقائي عند الخطأ"
  },
  {
    icon: Layers,
    title: "نظام الطوابير الذكي",
    description: "منع تداخل العمليات وضمان تنفيذ الطلبات بالترتيب مع سرعة معالجة عالية"
  },
  {
    icon: Bell,
    title: "تنبيهات ذكية",
    description: "إشعارات فورية عند نفاد الرصيد أو الفشل المتكرر أو النشاط غير الطبيعي"
  },
  {
    icon: ShieldCheck,
    title: "أمان متقدم",
    description: "تشفير البيانات وحماية من الطلبات الوهمية مع تسجيل كامل لكل نشاط"
  },
  {
    icon: BarChart3,
    title: "تقارير شاملة",
    description: "متابعة العمليات لحظة بلحظة مع تقارير مالية وتصدير PDF و Excel"
  },
  {
    icon: Expand,
    title: "قابلية التوسع",
    description: "بنية تقنية مرنة تسمح بإضافة خدمات OTP و SMS و دفع الفواتير"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-tashil-gold/10 text-tashil-gold text-sm font-medium mb-4">
            مميزات ذكية
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            تقنيات <span className="text-tashil-gold">متطورة</span> لأداء استثنائي
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            نستخدم أحدث التقنيات لضمان سرعة وموثوقية وأمان عملياتك
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-gradient-to-b from-secondary/50 to-transparent border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
