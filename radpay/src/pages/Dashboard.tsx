import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdvancedDashboard from "./dashboard/AdvancedDashboard";

const Dashboard = () => {
    const { user, role } = useAuth();

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
                        <p className="text-muted-foreground mt-1">مرحباً بك، {user?.displayName || user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary capitalize">{role?.replace('_', ' ')}</span>
                    </div>
                </div>

                {/* Advanced Dashboard Content */}
                <AdvancedDashboard />
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
