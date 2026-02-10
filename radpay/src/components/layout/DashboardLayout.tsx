import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";


interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { direction } = useLanguage();
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

    // Use logical properties for automatic RTL/LTR handling
    // start-0: Right in RTL, Left in LTR
    // border-e: Border End (Left in RTL, Right in LTR)
    // ms-*: Margin Start (Right in RTL, Left in LTR)

    // Sidebar width
    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

    // Main content margin-start
    const mainMarginStart = isCollapsed ? 'md:ms-20' : 'md:ms-64';

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden" dir={direction}>
            {/* Sidebar (Fixed) - Uses logical 'start-0' to position correctly based on dir="rtl" */}
            <aside className={`hidden md:block h-screen fixed top-0 z-50 start-0 transition-[width] duration-300 ${sidebarWidth}`}>
                <Sidebar />
            </aside>

            {/* Main Content Area - Uses logical 'ms-' for margin-start */}
            <main className={`flex-1 w-full h-full min-h-screen relative overflow-y-auto bg-background transition-[margin] duration-300 ${mainMarginStart}`}>
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
