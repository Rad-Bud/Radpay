import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User, Shield, Building, Bell, Moon, Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Copy, RefreshCw } from "lucide-react";

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { user, role } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [loadingCode, setLoadingCode] = useState(false);

    // Load existing referral code
    useEffect(() => {
        const loadReferralCode = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().referralCode) {
                    setReferralCode(userDoc.data().referralCode);
                }
            } catch (error) {
                console.error("Error loading referral code:", error);
            }
        };
        loadReferralCode();
    }, [user]);

    const generateReferralCode = async () => {
        if (!user) return;
        setLoadingCode(true);
        try {
            // Generate simple 6-char alphanumeric code (uppercase)
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Checks for uniqueness could be added here (query invitations where id == code)
            // For now, assuming low collision probability for MVP or handling error if write fails

            // 1. Save to invitations collection (publicly readable/queryable for signup)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

            await setDoc(doc(db, "invitations", code), {
                wholesalerId: user.uid,
                wholesalerName: user.displayName || "Unknown",
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt,
                status: 'active'
            });

            // 2. Save last generated code to user profile (optional, just for reference)
            await updateDoc(doc(db, "users", user.uid), {
                referralCode: code
            });

            setReferralCode(code);
            toast.success("تم إنشاء رمز الدعوة بنجاح");
        } catch (error) {
            console.error("Error generating code:", error);
            toast.error("حدث خطأ أثناء إنشاء الرمز");
        } finally {
            setLoadingCode(false);
        }
    };

    const copyToClipboard = () => {
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            toast.success("تم نسخ الرمز");
        }
    };

    const handleThemeChange = (t: "light" | "dark" | "system") => {
        setTheme(t);
        toast.success(`تم تغيير المظهر إلى ${t === 'dark' ? 'الوضع الليلي' : t === 'light' ? 'الوضع النهاري' : 'النظام'}`);
    };

    const handleLanguageChange = (l: string) => {
        setLanguage(l as any);
        toast.success(`تم تغيير اللغة إلى ${l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'Français'}`);
    };

    const handleNotificationsChange = (enabled: boolean) => {
        setNotificationsEnabled(enabled);
        toast.success(enabled ? "تم تفعيل الإشعارات" : "تم تعطيل الإشعارات");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('settings_title')}</h1>
                    <p className="text-muted-foreground">{t('settings_desc')}</p>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                        <TabsTrigger value="general">{t('general')}</TabsTrigger>
                        <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
                        <TabsTrigger value="security">{t('security')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-6 space-y-6">
                        {/* Notifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    {t('notifications_title')}
                                </CardTitle>
                                <CardDescription>{t('notifications_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg">
                                    <Label htmlFor="notifications" className="flex flex-col gap-1 text-start">
                                        <span>{t('notifications_enable')}</span>
                                        <span className="font-normal text-xs text-muted-foreground">{t('notifications_subtext')}</span>
                                    </Label>
                                    <Switch
                                        id="notifications"
                                        checked={notificationsEnabled}
                                        onCheckedChange={handleNotificationsChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Referral Code (Only for Wholesalers/Admins) */}
                        {(role === 'wholesaler' || role === 'super_wholesaler' || role === 'super_admin') && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-primary" />
                                        {t('referral_code_title')}
                                    </CardTitle>
                                    <CardDescription>{t('referral_code_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        {referralCode ? (
                                            <>
                                                <div className="flex-1 bg-background p-3 rounded-lg border border-dashed border-primary text-center font-mono text-xl font-bold tracking-widest">
                                                    {referralCode}
                                                </div>
                                                <Button size="icon" variant="outline" onClick={copyToClipboard} title={t('copy_code')}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={generateReferralCode} disabled={loadingCode} title={t('update_code')}>
                                                    <RefreshCw className={`w-4 h-4 ${loadingCode ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button onClick={generateReferralCode} disabled={loadingCode} className="w-full">
                                                {loadingCode ? t('generating_code') : t('generate_code')}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Theme */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Moon className="w-5 h-5 text-primary" />
                                    {t('theme_title')}
                                </CardTitle>
                                <CardDescription>{t('theme_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={theme} onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")} className="grid grid-cols-3 gap-4">
                                    <div>
                                        <RadioGroupItem value="light" id="light" className="peer sr-only" />
                                        <Label
                                            htmlFor="light"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="mb-2 text-xl">☀️</span>
                                            {t('theme_light')}
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                                        <Label
                                            htmlFor="dark"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="mb-2 text-xl">🌙</span>
                                            {t('theme_dark')}
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="system" id="system" className="peer sr-only" />
                                        <Label
                                            htmlFor="system"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <span className="mb-2 text-xl">💻</span>
                                            {t('theme_system')}
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Language */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Languages className="w-5 h-5 text-primary" />
                                    {t('language_title')}
                                </CardTitle>
                                <CardDescription>{t('language_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-[200px]">
                                    <Select value={language} onValueChange={handleLanguageChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('language_select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ar">العربية</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="profile" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profile_title')}</CardTitle>
                                <CardDescription>{t('profile_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl">
                                        <User className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{user?.displayName || "مستخدم"}</h3>
                                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>{t('full_name')}</Label>
                                        <Input defaultValue={user?.displayName || ""} readOnly className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('email')}</Label>
                                        <Input defaultValue={user?.email || ""} readOnly className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('role')}</Label>
                                        <Input defaultValue={role === 'super_admin' ? t('role_super_admin') : role === 'wholesaler' ? t('role_wholesaler') : t('role_retailer')} readOnly className="bg-muted" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('security_title')}</CardTitle>
                                <CardDescription>{t('security_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('current_password')}</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('new_password')}</Label>
                                    <Input type="password" />
                                </div>
                                <Button variant="secondary">{t('update_password')}</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
