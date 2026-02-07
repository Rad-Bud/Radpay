import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, LogOut, Sun, Moon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageContext";

const backendUrl = "http://localhost:3000/api";

const DashboardHeader = () => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { theme, setTheme } = useTheme();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getRoleName = (r: string | null) => {
        switch (r) {
            case 'super_admin': return t('role_super_admin');
            case 'wholesaler': return t('role_wholesaler');
            case 'retailer': return t('role_retailer');
            case 'super_wholesaler': return t('role_super_wholesaler');
            default: return t('role_user');
        }
    };

    const fetchAlerts = async () => {
        try {
            const newAlerts: any[] = []; // Explicit type

            // 1. Check Pending Complaints
            const complaintsRes = await fetch(`${backendUrl}/complaints`);
            if (complaintsRes.ok) {
                const complaints = await complaintsRes.json();
                const pending = complaints.filter((c: any) => c.status === 'pending');
                pending.forEach((c: any) => {
                    newAlerts.push({
                        id: `complaint-${c.id}`,
                        type: 'complaint',
                        title: 'شكوى جديدة',
                        message: c.subject,
                        link: '/dashboard/complaints'
                    });
                });
            }

            // 2. Check Low Balance SIMs (Mock Threshold < 500)
            const simsRes = await fetch(`${backendUrl}/gateway/sims`);
            if (simsRes.ok) {
                const sims = await simsRes.json();
                const lowBalance = sims.filter((s: any) => s.balance < 500);
                lowBalance.forEach((s: any) => {
                    newAlerts.push({
                        id: `sim-${s.slot}`,
                        type: 'warning',
                        title: 'رصيد منخفض',
                        message: `شريحة ${s.operator} (مدخل ${s.slot}) رصيدها ${s.balance} دج`,
                        link: '/dashboard/sims'
                    });
                });
            }

            setNotifications(newAlerts);
            setUnreadCount(newAlerts.length);

        } catch (error) {
            console.error("Failed to fetch alerts", error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Poll every 30 seconds for new alerts
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="h-20 border-b bg-card/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-40">
            {/* Center: Search - Moves to Start in flex order */}
            <div className="flex-1 max-w-md hidden md:block">
                <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('search_placeholder')}
                        className="w-full ps-10 bg-background/50 border-0 focus-visible:ring-1"
                    />
                </div>
            </div>

            {/* End: Actions & User Profile */}
            <div className="flex items-center gap-4 ms-auto">
                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="relative-hover">
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative relative-hover">
                                <Bell className="w-5 h-5 text-muted-foreground" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 end-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card animate-pulse" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-0">
                            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                                <h4 className="font-medium text-sm">{t('notifications_title')}</h4>
                                {unreadCount > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{unreadCount} {t('notifications_new')}</Badge>}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">{t('notifications_empty')}</p>
                                    </div>
                                ) : (
                                    notifications.map((note, i) => (
                                        <DropdownMenuItem key={i} className="cursor-pointer p-4 border-b last:border-0 hover:bg-muted/50 focus:bg-muted/50" onClick={() => navigate(note.link)}>
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${note.type === 'warning' ? 'bg-red-500' : 'bg-orange-500'}`} />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{note.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{note.message}</p>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t text-center">
                                    <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => setNotifications([])}>
                                        {t('clear_all')}
                                    </Button>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 border-s ps-4">
                    <div className="hidden md:block text-end">
                        <p className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0] || t('role_user')}</p>
                        <p className="text-xs text-muted-foreground">{getRoleName(role)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
