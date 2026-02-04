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
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

const sidebarItems = [
    { icon: LayoutDashboard, label: "الرئيسية", href: "/dashboard" },
    { icon: Users, label: "إدارة المستخدمين", href: "/dashboard/users" },
    { icon: Smartphone, label: "إدارة الشرائح", href: "/dashboard/sims" },
    { icon: Tag, label: "عروض المتعاملين", href: "/dashboard/offers" },
    { icon: Gamepad2, label: "شحن الألعاب", href: "/dashboard/games" },
    { icon: Bike, label: "تطبيقات التوصيل", href: "/dashboard/delivery-apps" },
    { icon: Bell, label: "الإشعارات", href: "/dashboard/notifications" },
    { icon: MessageSquareWarning, label: "الشكاوي", href: "/dashboard/complaints" },
    { icon: History, label: "سجل العمليات", href: "/dashboard/transactions" },
    { icon: Settings, label: "الإعدادات", href: "/dashboard/settings" },
];

const Sidebar = () => {
    const location = useLocation();
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

    return (
        <div className={cn(
            "flex flex-col h-full bg-card border-l border-border/50 backdrop-blur-xl transition-all duration-300",
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

            {/* Toggle Button - Outside logo area for better visibility */}
            <div className="relative">
                <button
                    onClick={toggleSidebar}
                    className="absolute -left-4 top-4 w-8 h-8 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-all duration-200 shadow-lg z-50"
                    title={isCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
                >
                    {isCollapsed ? (
                        <ChevronLeft className="w-5 h-5 text-white" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-white" />
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
                                    <span className="font-medium">{item.label}</span>
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
                    title={isCollapsed ? "الإعدادات" : undefined}
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">الإعدادات</span>}
                </Link>

                <button
                    onClick={() => auth.signOut()}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "تسجيل الخروج" : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">تسجيل الخروج</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
