import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "كيف أبدأ استخدام Rad Pay؟",
        answer: "يمكنك التسجيل مجاناً من خلال الضغط على زر 'ابدأ مجاناً' وإنشاء حساب. بعد التسجيل، يمكنك شحن رصيدك والبدء في استخدام جميع الخدمات فوراً."
    },
    {
        question: "ما هي طرق الدفع المتاحة؟",
        answer: "نوفر عدة طرق للدفع تشمل التحويل البنكي، الدفع عبر البطاقات البنكية، والدفع النقدي من خلال وكلائنا المعتمدين."
    },
    {
        question: "هل يوجد دعم فني متاح؟",
        answer: "نعم، فريق الدعم الفني متاح 24/7 لمساعدتك في أي استفسار أو مشكلة تقنية عبر الهاتف أو البريد الإلكتروني."
    },
    {
        question: "كيف يتم حساب العمولات؟",
        answer: "يتم حساب العمولات تلقائياً بناءً على نوع العملية والنسبة المحددة لكل خدمة. يمكنك متابعة أرباحك لحظياً من لوحة التحكم."
    },
    {
        question: "هل البيانات آمنة؟",
        answer: "نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك المالية والشخصية. جميع العمليات مؤمنة بالكامل."
    },
    {
        question: "هل يمكنني إلغاء الاشتراك في أي وقت؟",
        answer: "نعم، يمكنك إلغاء الاشتراك في أي وقت دون أي رسوم إضافية. رصيدك المتبقي سيكون قابلاً للسحب."
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 relative">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        الأسئلة الشائعة
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        أسئلة <span className="text-primary">والدعم</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="glass-card overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-6 flex items-center justify-between text-right hover:bg-primary/5 transition-colors"
                            >
                                <h3 className="text-lg font-bold flex-1">{faq.question}</h3>
                                <ChevronDown
                                    className={`w-5 h-5 text-primary transition-transform duration-300 flex-shrink-0 mr-4 ${openIndex === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-96" : "max-h-0"
                                    }`}
                            >
                                <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Support */}
                <div className="text-center mt-12">
                    <p className="text-muted-foreground mb-4">
                        لم تجد إجابة لسؤالك؟
                    </p>
                    <a
                        href="mailto:info@radpay.dz"
                        className="text-primary hover:underline font-medium"
                    >
                        تواصل مع فريق الدعم
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
