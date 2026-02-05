import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <ShieldAlert className="w-24 h-24 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">غير مصرح</h1>
                        <p className="text-muted-foreground mt-2">
                            ليس لديك صلاحية للوصول إلى هذه الصفحة
                        </p>
                    </div>
                    <Button onClick={() => navigate('/dashboard')} className="gap-2">
                        العودة للوحة التحكم
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Unauthorized;
