import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-6"
                >
                    <ArrowRight className="w-4 h-4 ml-2" />
                    العودة للصفحة الرئيسية
                </Button>

                <h1 className="text-4xl md:text-5xl font-bold mb-8">سياسة الخصوصية</h1>

                <div className="space-y-8 text-muted-foreground">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">1. المقدمة</h2>
                        <p className="leading-relaxed">
                            نحن في Rad Pay نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام خدماتنا.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">2. المعلومات التي نجمعها</h2>
                        <p className="leading-relaxed mb-3">نقوم بجمع المعلومات التالية:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>معلومات التسجيل: الاسم، البريد الإلكتروني، رقم الهاتف</li>
                            <li>معلومات العمليات المالية: تفاصيل المعاملات والأرصدة</li>
                            <li>معلومات تقنية: عنوان IP، نوع المتصفح، نظام التشغيل</li>
                            <li>بيانات الاستخدام: كيفية تفاعلك مع منصتنا</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">3. استخدام المعلومات</h2>
                        <p className="leading-relaxed mb-3">نستخدم معلوماتك للأغراض التالية:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>تقديم وتحسين خدماتنا</li>
                            <li>معالجة العمليات المالية</li>
                            <li>التواصل معك بخصوص حسابك والخدمات</li>
                            <li>منع الاحتيال وضمان الأمان</li>
                            <li>الامتثال للمتطلبات القانونية</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">4. حماية البيانات</h2>
                        <p className="leading-relaxed">
                            نستخدم تقنيات تشفير متقدمة وإجراءات أمنية صارمة لحماية بياناتك من الوصول غير المصرح به أو الإفصاح أو التعديل أو الإتلاف. جميع المعاملات المالية مشفرة بالكامل.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">5. مشاركة المعلومات</h2>
                        <p className="leading-relaxed mb-3">لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>مع مزودي الخدمات الموثوقين لتشغيل منصتنا</li>
                            <li>عند الامتثال للمتطلبات القانونية</li>
                            <li>لحماية حقوقنا وسلامة مستخدمينا</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">6. حقوقك</h2>
                        <p className="leading-relaxed mb-3">لديك الحق في:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>الوصول إلى بياناتك الشخصية</li>
                            <li>تصحيح أو تحديث معلوماتك</li>
                            <li>حذف حسابك وبياناتك</li>
                            <li>الاعتراض على معالجة بياناتك</li>
                            <li>طلب نسخة من بياناتك</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">7. ملفات تعريف الارتباط (Cookies)</h2>
                        <p className="leading-relaxed">
                            نستخدم ملفات تعريف الارتباط لتحسين تجربتك على منصتنا، وتذكر تفضيلاتك، وتحليل استخدام الموقع. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">8. التحديثات على السياسة</h2>
                        <p className="leading-relaxed">
                            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنقوم بإخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">9. الاتصال بنا</h2>
                        <p className="leading-relaxed">
                            إذا كان لديك أي أسئلة حول سياسة الخصوصية أو كيفية معالجة بياناتك، يرجى التواصل معنا:
                        </p>
                        <div className="mt-4 space-y-2">
                            <p>البريد الإلكتروني: <a href="mailto:info@radpay.dz" className="text-primary hover:underline">info@radpay.dz</a></p>
                            <p>الهاتف: <span dir="ltr">+213 XX XXX XXXX</span></p>
                            <p>العنوان: الجزائر</p>
                        </div>
                    </section>

                    <section className="pt-8 border-t border-border">
                        <p className="text-sm">
                            آخر تحديث: فبراير 2024
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
