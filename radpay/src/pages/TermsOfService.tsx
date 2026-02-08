import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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

                <h1 className="text-4xl md:text-5xl font-bold mb-8">الشروط والأحكام</h1>

                <div className="space-y-8 text-muted-foreground">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">1. القبول بالشروط</h2>
                        <p className="leading-relaxed">
                            باستخدامك لمنصة Rad Pay، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام خدماتنا.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">2. التسجيل والحساب</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>يجب أن تكون فوق 18 عاماً لاستخدام خدماتنا</li>
                            <li>يجب تقديم معلومات دقيقة وصحيحة عند التسجيل</li>
                            <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك</li>
                            <li>أنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك</li>
                            <li>يجب إخطارنا فوراً بأي استخدام غير مصرح به لحسابك</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">3. الخدمات المقدمة</h2>
                        <p className="leading-relaxed mb-3">توفر Rad Pay الخدمات التالية:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>شحن رصيد الاتصالات</li>
                            <li>تفعيل العروض والباقات</li>
                            <li>بيع بطاقات الشحن</li>
                            <li>إدارة المحافظ المالية</li>
                            <li>نظام العمولات والأرباح</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">4. الرسوم والمدفوعات</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>جميع الأسعار معروضة بالدينار الجزائري (DZD)</li>
                            <li>يتم خصم الرصيد تلقائياً عند كل عملية</li>
                            <li>العمولات محددة حسب نوع الخدمة ودور المستخدم</li>
                            <li>لا يمكن استرداد الرصيد إلا في حالات محددة</li>
                            <li>نحتفظ بالحق في تعديل الأسعار مع إشعار مسبق</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">5. الاستخدام المقبول</h2>
                        <p className="leading-relaxed mb-3">يُمنع استخدام المنصة في:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>أي نشاط غير قانوني أو احتيالي</li>
                            <li>محاولة اختراق أو تعطيل النظام</li>
                            <li>استخدام برامج آلية دون إذن</li>
                            <li>انتحال شخصية الآخرين</li>
                            <li>نشر محتوى ضار أو مسيء</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">6. المسؤولية</h2>
                        <p className="leading-relaxed">
                            نبذل قصارى جهدنا لضمان دقة وموثوقية خدماتنا، لكننا لا نضمن أن الخدمة ستكون متاحة دائماً أو خالية من الأخطاء. لا نتحمل المسؤولية عن:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mr-4 mt-3">
                            <li>أي خسائر ناتجة عن انقطاع الخدمة</li>
                            <li>أخطاء في شبكات الاتصالات الخارجية</li>
                            <li>استخدامك غير الصحيح للمنصة</li>
                            <li>فقدان البيانات بسبب قوة قاهرة</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">7. إنهاء الحساب</h2>
                        <p className="leading-relaxed">
                            نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط. يمكنك أيضاً إغلاق حسابك في أي وقت من خلال الإعدادات.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">8. الملكية الفكرية</h2>
                        <p className="leading-relaxed">
                            جميع المحتويات والعلامات التجارية والشعارات الموجودة على المنصة هي ملك لـ Rad Pay. لا يجوز استخدامها دون إذن كتابي مسبق.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">9. التعديلات</h2>
                        <p className="leading-relaxed">
                            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">10. القانون الساري</h2>
                        <p className="leading-relaxed">
                            تخضع هذه الشروط لقوانين الجزائر. أي نزاع ينشأ عن استخدام المنصة سيتم حله وفقاً للقوانين الجزائرية.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">11. الاتصال</h2>
                        <p className="leading-relaxed">
                            لأي استفسارات حول هذه الشروط، يرجى التواصل معنا:
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

export default TermsOfService;
