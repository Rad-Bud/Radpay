import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "تم إرسال رسالتك بنجاح",
            description: "سنتواصل معك في أقرب وقت ممكن",
        });
        setFormData({ name: "", email: "", phone: "", message: "" });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-6"
                >
                    <ArrowRight className="w-4 h-4 ml-2" />
                    العودة للصفحة الرئيسية
                </Button>

                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">تواصل معنا</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        فريقنا جاهز للإجابة على استفساراتك ومساعدتك في بدء رحلتك مع Rad Pay
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>أرسل لنا رسالة</CardTitle>
                            <CardDescription>املأ النموذج وسنتواصل معك قريباً</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium mb-2 block">
                                        الاسم الكامل
                                    </label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="أدخل اسمك الكامل"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="text-sm font-medium mb-2 block">
                                        البريد الإلكتروني
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="example@email.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="text-sm font-medium mb-2 block">
                                        رقم الهاتف
                                    </label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+213 XX XXX XXXX"
                                        dir="ltr"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="text-sm font-medium mb-2 block">
                                        رسالتك
                                    </label>
                                    <Textarea
                                        id="message"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="اكتب رسالتك هنا..."
                                        rows={5}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    إرسال الرسالة
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>معلومات التواصل</CardTitle>
                                <CardDescription>تواصل معنا مباشرة عبر القنوات التالية</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">البريد الإلكتروني</h3>
                                        <a href="mailto:info@radpay.dz" className="text-muted-foreground hover:text-primary transition-colors">
                                            info@radpay.dz
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">الهاتف</h3>
                                        <p className="text-muted-foreground" dir="ltr">+213 XX XXX XXXX</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">العنوان</h3>
                                        <p className="text-muted-foreground">الجزائر</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>ساعات العمل</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">السبت - الخميس</span>
                                    <span className="font-medium">9:00 - 18:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">الجمعة</span>
                                    <span className="font-medium">مغلق</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
