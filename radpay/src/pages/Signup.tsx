import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            navigate("/dashboard");
        }
    }, [user, authLoading, navigate]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Validate Referral Code
            const codeRef = doc(db, "invitations", referralCode.toUpperCase().trim());
            const codeSnap = await getDoc(codeRef);

            if (!codeSnap.exists()) {
                throw new Error("رمز الدعوة غير صالح. يرجى التأكد من الرمز والمحاولة مرة أخرى.");
            }

            const invitationData = codeSnap.data();

            // Check Expiration
            if (invitationData.expiresAt && new Date() > new Date(invitationData.expiresAt)) {
                throw new Error("رمز الدعوة منتهي الصلاحية. يرجى طلب رمز جديد من تاجر الجملة.");
            }

            const wholesalerId = invitationData.wholesalerId;

            // 2. Create Authentication User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            // 3. Update Profile Name
            await updateProfile(newUser, {
                displayName: name
            });

            // 4. Create User Document in Firestore
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                email: newUser.email,
                displayName: name,
                role: 'retailer', // Explicitly set as retailer
                wholesalerId: wholesalerId, // Linked to the wholesaler who created the code
                balance: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                registeredWithCode: referralCode.toUpperCase().trim()
            });

            toast.success("تم إنشاء الحساب بنجاح!");
            navigate("/dashboard");

        } catch (error: any) {
            console.error("Signup error:", error);
            let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
            if (error.message.includes("email-already-in-use")) {
                errorMessage = "البريد الإلكتروني مسجل بالفعل";
            } else if (error.message.includes("weak-password")) {
                errorMessage = "كلمة المرور ضعيفة جداً";
            } else if (error.message.includes("رمز الدعوة")) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-hero-pattern" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-tashil-gold/5 rounded-full blur-3xl" />

            <Card className="w-full max-w-md relative z-10 glass-card border-none shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-gradient-primary">إنشاء حساب جديد</CardTitle>
                    <CardDescription>
                        سجل كتاجر تجزئة باستخدام رمز الدعوة
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2 text-right">
                            <Label htmlFor="referralCode">رمز الدعوة (من تاجر الجملة)</Label>
                            <Input
                                id="referralCode"
                                type="text"
                                placeholder="XXXXXX"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                className="bg-background/50 border-input/50 focus:border-primary text-right font-mono tracking-widest uppercase"
                                required
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <Label htmlFor="name">الاسم الكامل</Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-background/50 border-input/50 focus:border-primary text-right"
                                required
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background/50 border-input/50 focus:border-primary text-right"
                                required
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-background/50 border-input/50 focus:border-primary text-right"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full btn-primary-glow font-bold" disabled={loading}>
                            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
                        </Button>

                        <div className="text-center text-sm">
                            لديك حساب بالفعل؟{" "}
                            <Link to="/login" className="text-primary hover:underline font-semibold">
                                تسجيل الدخول
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Signup;
