import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Rad Pay Logo" className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-contain" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gradient-primary">Rad Pay</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-muted-foreground hover:text-primary transition-colors">
              الخدمات
            </a>
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              المميزات
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
              تواصل معنا
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>تسجيل الدخول</Button>
            <Button variant="hero" onClick={() => navigate("/login")}>ابدأ الآن</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 animate-fade-in">
            <nav className="flex flex-col gap-4 mb-6">
              <a href="#services" className="text-muted-foreground hover:text-primary transition-colors py-2">
                الخدمات
              </a>
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors py-2">
                المميزات
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors py-2">
                تواصل معنا
              </a>
            </nav>
            <div className="flex flex-col gap-3">
              <Button variant="ghost" className="w-full" onClick={() => navigate("/login")}>تسجيل الدخول</Button>
              <Button variant="hero" className="w-full" onClick={() => navigate("/login")}>ابدأ الآن</Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
