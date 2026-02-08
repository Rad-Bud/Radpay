import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="py-16 border-t border-border/50 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Rad Pay Logo" className="w-16 h-16 rounded-xl object-contain" />
              <div>
                <h3 className="text-lg font-bold text-gradient-primary">Rad Pay</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              منصة رقمية متكاملة لتوزيع الرصيد والخدمات المالية الرقمية
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              <li><a href="#services" className="text-muted-foreground hover:text-primary transition-colors text-sm">الخدمات</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors text-sm">المميزات</a></li>
              <li><a href="#dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm">لوحة التحكم</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">الأسعار</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-4">الدعم</h4>
            <ul className="space-y-3">
              <li><a href="#faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">الأسئلة الشائعة</a></li>
              <li><a href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">سياسة الخصوصية</a></li>
              <li><a href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors text-sm">الشروط والأحكام</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@radpay.dz</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span dir="ltr">+213 XX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>الجزائر</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Rad Pay. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              سياسة الخصوصية
            </a>
            <a href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              الشروط والأحكام
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
