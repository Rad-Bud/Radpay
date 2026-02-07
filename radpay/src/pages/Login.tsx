import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard");
        }
    }, [user, loading, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation handled by useEffect
            toast.success("Login successful");
        } catch (error: any) {
            toast.error("Login failed: " + error.message);
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
                    <CardTitle className="text-2xl font-bold text-gradient-primary">Tashil Pay</CardTitle>
                    <CardDescription>
                        أدخل بياناتك للدخول إلى لوحة التحكم
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2 text-right">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
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
                        <Button type="submit" className="w-full btn-primary-glow font-bold">
                            تسجيل الدخول
                        </Button>

                        <div className="text-center text-sm pt-2">
                            ليس لديك حساب؟{" "}
                            <Link to="/signup" className="text-primary hover:underline font-semibold">
                                إنشاء حساب جديد
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
