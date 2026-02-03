import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { auth } from "../lib/firebase";

const Dashboard = () => {
    const { user, role } = useAuth();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <Button onClick={() => auth.signOut()} variant="outline">
                    Sign Out
                </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Welcome, {user?.email}</h2>
                <p className="text-gray-600 mb-4">You are logged in as: <span className="font-bold uppercase">{role || 'User'}</span></p>

                {role === 'super_admin' && (
                    <div className="bg-red-50 p-4 border border-red-200 rounded text-red-700">
                        Super Admin Controls
                    </div>
                )}

                {role === 'super_wholesaler' && (
                    <div className="bg-blue-50 p-4 border border-blue-200 rounded text-blue-700">
                        Super Wholesaler Panel
                    </div>
                )}

                {role === 'wholesaler' && (
                    <div className="bg-green-50 p-4 border border-green-200 rounded text-green-700">
                        Wholesaler Panel
                    </div>
                )}

                {role === 'retailer' && (
                    <div className="bg-purple-50 p-4 border border-purple-200 rounded text-purple-700">
                        Retailer POS System
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
