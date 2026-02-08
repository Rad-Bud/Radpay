import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, User } from "lucide-react";

interface SpendingUser {
    userId: string;
    userName: string;
    role: string;
    totalSpent: number;
}

interface SpendingDetailsModalProps {
    open: boolean;
    onClose: () => void;
    spendingData: SpendingUser[];
    totalSpent: number;
}

export default function SpendingDetailsModal({ open, onClose, spendingData, totalSpent }: SpendingDetailsModalProps) {
    const getRoleName = (role: string) => {
        const roleMap: Record<string, string> = {
            'super_admin': 'مدير عام',
            'admin': 'مدير',
            'super_wholesaler': 'تاجر جملة رئيسي',
            'wholesaler': 'تاجر جملة',
            'retailer': 'تاجر تجزئة'
        };
        return roleMap[role] || role;
    };

    const getRoleBadgeColor = (role: string) => {
        const colorMap: Record<string, string> = {
            'super_admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'admin': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'super_wholesaler': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            'wholesaler': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'retailer': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        };
        return colorMap[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <TrendingDown className="w-6 h-6 text-red-500" />
                        تفاصيل المصروفات
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {totalSpent.toLocaleString()} د.ج
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">عدد الحسابات</p>
                                <p className="text-2xl font-semibold">{spendingData.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">#</TableHead>
                                    <TableHead className="text-right">اسم الحساب</TableHead>
                                    <TableHead className="text-right">الدور</TableHead>
                                    <TableHead className="text-right">إجمالي المصروفات</TableHead>
                                    <TableHead className="text-right">النسبة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {spendingData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            لا توجد بيانات
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    spendingData.map((user, index) => {
                                        const percentage = totalSpent > 0 ? (user.totalSpent / totalSpent * 100).toFixed(1) : '0';
                                        return (
                                            <TableRow key={user.userId}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium">{user.userName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                        {getRoleName(user.role)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-semibold text-red-600 dark:text-red-400">
                                                    {user.totalSpent.toLocaleString()} د.ج
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-red-500 h-full rounded-full transition-all"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium min-w-[3rem] text-right">
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
