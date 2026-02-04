import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Building } from "lucide-react";

const Settings = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">الإعدادات</h1>
                    <p className="text-muted-foreground">تخصيص النظام وإعدادات الحساب</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                        <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                        <TabsTrigger value="general">عام</TabsTrigger>
                        <TabsTrigger value="security">الأمان</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>بيانات المدير</CardTitle>
                                <CardDescription>تحديث بيانات حسابك الشخصي</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>الاسم الكامل</Label>
                                    <Input defaultValue="Admin User" />
                                </div>
                                <div className="space-y-2">
                                    <Label>البريد الإلكتروني</Label>
                                    <Input defaultValue="admin@radpay.com" disabled />
                                </div>
                                <Button>حفظ التغييرات</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="general" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>بيانات المنصة</CardTitle>
                                <CardDescription>إعدادات عامة للنظام</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>اسم المنصة</Label>
                                    <Input defaultValue="Rad Pay" />
                                </div>
                                <div className="space-y-2">
                                    <Label>رقم الدعم الفني</Label>
                                    <Input placeholder="0550..." />
                                </div>
                                <Button>حفظ الإعدادات</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>كلمة المرور والأمان</CardTitle>
                                <CardDescription>تغيير كلمة المرور الخاصة بك</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>كلمة المرور الحالية</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>كلمة المرور الجديدة</Label>
                                    <Input type="password" />
                                </div>
                                <Button variant="secondary">تحديث كلمة المرور</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
