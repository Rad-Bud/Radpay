import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { useState, useEffect } from "react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('sidebarCollapsed');
            setIsCollapsed(saved === 'true');
        };

        window.addEventListener('storage', handleStorageChange);

        // Poll for changes (for same-tab updates)
        const interval = setInterval(() => {
            const saved = localStorage.getItem('sidebarCollapsed');
            setIsCollapsed(saved === 'true');
        }, 100);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            {/* Right Sidebar (Fixed) - Hidden on Mobile, Visible on Desktop */}
            <aside className="hidden md:block h-screen fixed right-0 top-0 z-50">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 w-full h-full min-h-screen relative overflow-y-auto bg-background transition-all duration-300 ${isCollapsed ? 'md:mr-20' : 'md:mr-64'
                }`}>
                <DashboardHeader />
                <div className="p-8 pb-20">
                    {children}
                </div>
            </main>

            {/* Mobile Header/Menu (Can be added later) */}
        </div>
    );
};

export default DashboardLayout;
