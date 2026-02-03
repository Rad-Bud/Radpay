import { Wallet, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="py-16 border-t border-border/50 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tashil-emerald to-tashil-emerald-light flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gradient-primary">Tashil Pay</h3>
                <p className="text-xs text-muted-foreground">تسهيل الدفع</p>
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
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">مركز المساعدة</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">الأسئلة الشائعة</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">الشروط والأحكام</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">سياسة الخصوصية</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@tashilpay.ly</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span dir="ltr">+218 91 XXX XXXX</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>طرابلس، ليبيا</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Tashil Pay. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              سياسة الخصوصية
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              الشروط والأحكام
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
