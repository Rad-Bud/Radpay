import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    Smartphone,
    History,
    Settings,
    LogOut,
    Wallet,
    Tag,
    Gamepad2,
    Bike,
    Bell,
    MessageSquareWarning,
    ChevronRight,
    ChevronLeft,
    Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

// Menu items for each role - Using keys for translation
const menuItemsByRole: Record<string, Array<{ icon: any; label: string; href: string }>> = {
    super_admin: [
        { icon: LayoutDashboard, label: "nav_dashboard", href: "/dashboard" },
        { icon: Landmark, label: "nav_financials", href: "/dashboard/financials" },
        { icon: Users, label: "nav_users", href: "/dashboard/users" },
        { icon: Smartphone, label: "nav_sims", href: "/dashboard/sims" },
        { icon: Tag, label: "nav_offers", href: "/dashboard/offers" },
        { icon: Gamepad2, label: "nav_games", href: "/dashboard/games" },
        { icon: Bike, label: "nav_delivery", href: "/dashboard/delivery-apps" },
        { icon: Bell, label: "nav_notifications", href: "/dashboard/notifications" },
        { icon: MessageSquareWarning, label: "nav_complaints", href: "/dashboard/complaints" },
        { icon: History, label: "nav_transactions", href: "/dashboard/transactions" },

    ],
    wholesaler: [
        { icon: LayoutDashboard, label: "nav_dashboard", href: "/dashboard" },
        { icon: Users, label: "nav_users", href: "/dashboard/users" },
        { icon: Wallet, label: "nav_financials", href: "/dashboard/financials" },
        { icon: Smartphone, label: "nav_recharge", href: "/dashboard/recharge-balance" },
        { icon: History, label: "nav_transactions", href: "/dashboard/transactions" },

    ],
    retailer: [
        { icon: LayoutDashboard, label: "nav_dashboard", href: "/dashboard" },
        { icon: Wallet, label: "nav_balance", href: "/dashboard/balance" },
        { icon: History, label: "nav_operations", href: "/dashboard/transactions" },

    ]
};

const Sidebar = () => {
    const location = useLocation();
    const { role } = useAuth();
    const { t } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Get menu items for current role
    const sidebarItems = menuItemsByRole[role || 'retailer'] || menuItemsByRole.retailer;

    return (
        <div className={cn(
            "flex flex-col h-full bg-card border-e border-border/50 backdrop-blur-xl transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-border/50 relative">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-primary" />
                </div>
                {!isCollapsed && (
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent whitespace-nowrap">
                        Tashil Pay
                    </h1>
                )}
            </div>

            {/* Toggle Button - Uses logical adjustments */}
            <div className="relative">
                <button
                    onClick={toggleSidebar}
                    className="absolute -end-4 top-4 w-8 h-8 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-all duration-200 shadow-lg z-50"
                    title={isCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-white rtl:rotate-180" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-white rtl:rotate-180" />
                    )}
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "animate-pulse")} />
                            {!isCollapsed && (
                                <>
                                    <span className="font-medium">{t(item.label)}</span>
                                    {isActive && (
                                        <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                    )}
                                </>
                            )}
                            {isCollapsed && isActive && (
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border/50 space-y-2">
                <Link
                    to="/dashboard/settings"
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? t('nav_settings') : undefined}
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">{t('nav_settings')}</span>}
                </Link>

                <button
                    onClick={() => auth.signOut()}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? t('nav_logout') : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">{t('nav_logout')}</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
