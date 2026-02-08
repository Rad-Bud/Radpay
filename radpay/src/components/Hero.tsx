import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Shield, TrendingUp } from "lucide-react";

import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-tashil-gold/5 rounded-full blur-3xl" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">منصة رقمية متكاملة</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight animate-slide-up">
            <span className="text-foreground">كل أرصدتك</span>
            <br />
            <span className="text-primary">في مكان واحد</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            منصة توزيع رصيد وخدمات مالية رقمية موجهة لمكاتب الاتصالات ونقاط البيع.
            شحن آلي، محاسبة دقيقة، وتحكم كامل في العمليات.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button variant="hero" size="xl" className="group" onClick={() => navigate("/login")}>
              ابدأ مجاناً
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => {
              const servicesSection = document.getElementById('services');
              servicesSection?.scrollIntoView({ behavior: 'smooth' });
            }}>
              اكتشف جميع الخدمات
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">+1M</div>
              <div className="text-xs md:text-sm text-muted-foreground">عملية شحن</div>
            </div>
            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-tashil-gold" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">99.9%</div>
              <div className="text-xs md:text-sm text-muted-foreground">نسبة النجاح</div>
            </div>
            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-tashil-success" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">+500</div>
              <div className="text-xs md:text-sm text-muted-foreground">مكتب نشط</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
