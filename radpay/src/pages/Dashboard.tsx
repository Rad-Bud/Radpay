import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdvancedDashboard from "./dashboard/AdvancedDashboard";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
    const { user, role } = useAuth();
    const { t } = useLanguage();

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('dashboard_title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('dashboard_welcome')} {user?.displayName || user?.email}</p>
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
