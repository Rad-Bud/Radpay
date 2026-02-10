import {
  Smartphone,
  Wallet,
  Building2,
  PiggyBank,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Smartphone,
    title: "شحن كل الأرصدة",
    description: "شحن رصيد جميع شبكات الاتصال آلياً عبر شرائح SIM مع تأكيد فوري",
    features: ["موبيليس", "جيزي", "أوريدو"],
    color: "primary"
  },
  {
    icon: Wallet,
    title: "شحن كل بطاقات الإنترنت",
    description: "جميع بطاقات شحن الإنترنت متوفرة لجميع الخدمات والباقات",
    features: ["ADSL", "FIBER", "IDOOM"],
    color: "gold"
  },
  {
    icon: Building2,
    title: "إدارة المكاتب",
    description: "نظام متكامل لإدارة المكاتب مع صلاحيات وسقف يومي للعمليات",
    features: ["صلاحيات مخصصة", "سقف يومي", "لوحة متابعة"],
    color: "info"
  },
  {
    icon: PiggyBank,
    title: "نظام العمولات",
    description: "أرباح تلقائية عند كل عملية مع تقارير لحظية ودعم عمولات متنوعة",
    features: ["عمولة ثابتة", "نسبة مئوية", "تقارير أرباح"],
    color: "success"
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "primary":
      return {
        bg: "bg-primary/10",
        border: "border-primary/30",
        icon: "text-primary",
        hover: "group-hover:bg-primary/20"
      };
    case "gold":
      return {
        bg: "bg-tashil-gold/10",
        border: "border-tashil-gold/30",
        icon: "text-tashil-gold",
        hover: "group-hover:bg-tashil-gold/20"
      };
    case "info":
      return {
        bg: "bg-tashil-info/10",
        border: "border-tashil-info/30",
        icon: "text-tashil-info",
        hover: "group-hover:bg-tashil-info/20"
      };
    case "success":
      return {
        bg: "bg-tashil-success/10",
        border: "border-tashil-success/30",
        icon: "text-tashil-success",
        hover: "group-hover:bg-tashil-success/20"
      };
    default:
      return {
        bg: "bg-primary/10",
        border: "border-primary/30",
        icon: "text-primary",
        hover: "group-hover:bg-primary/20"
      };
  }
};

const Services = () => {
  return (
    <section id="services" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            خدماتنا الأساسية
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            كل ما تحتاجه في <span className="text-primary">منصة واحدة</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            نظام مالي رقمي متكامل يمكّنك من إدارة أعمالك باحترافية وكفاءة عالية
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service, index) => {
            const colors = getColorClasses(service.color);
            return (
              <div
                key={index}
                className="group glass-card p-6 md:p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-6 transition-colors ${colors.hover}`}>
                  <service.icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                <h3 className="text-xl md:text-2xl font-bold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-6">{service.description}</p>

                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg" className="group">
            اكتشف جميع الخدمات
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
