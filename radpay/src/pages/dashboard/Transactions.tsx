import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Wallet, History as HistoryIcon, Copy } from "lucide-react";
import { toast } from "sonner";

const backendUrl = "http://localhost:3000/api";

const Transactions = () => {
    const { role, user } = useAuth(); // Get user object
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const url = `${backendUrl}/transactions`;
                console.log('[Transactions] Role:', role, 'UID:', user?.uid);

                // Get auth token
                const token = await user?.getIdToken();
                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(url, { headers });
                if (res.ok) {
                    const data = await res.json();
                    console.log('[Transactions] Received:', data.length, 'transactions');
                    setTransactions(data);
                } else {
                    console.error('[Transactions] Error:', res.status, res.statusText);
                }
            } catch (error) {
                console.error("Failed to fetch transactions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [role, user?.uid]); // Add dependencies

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'game_topup': return 'bg-purple-100 text-purple-700';
            case 'sim_recharge': return 'bg-blue-100 text-blue-700';
            case 'app_credit': return 'bg-orange-100 text-orange-700';
            case 'deposit': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'game_topup': return 'شحن ألعاب';
            case 'sim_recharge': return 'شحن رصيد SIM';
            case 'app_credit': return 'تطبيقات توصيل';
            case 'deposit': return 'إيداع رصيد';
            default: return type;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">سجل العمليات</h1>
                    <p className="text-muted-foreground">تاريخ جميع العمليات المالية والنشاطات</p>
                </div>

                <div className="rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">رقم العملية</TableHead>
                                <TableHead className="text-right">نوع العملية</TableHead>
                                <TableHead className="text-right">الوصف</TableHead>
                                <TableHead className="text-right">المبلغ</TableHead>
                                {((role as string) === 'admin' || (role as string) === 'super_admin' || (role as string) === 'wholesaler') && (
                                    <TableHead className="text-right text-green-600">الربح</TableHead>
                                )}
                                <TableHead className="text-right">المستخدم</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center">تحميل...</TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <HistoryIcon className="w-8 h-8 opacity-50" />
                                            <p>لا توجد عمليات مسجلة حتى الآن</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2 group">
                                                <span title={tx.id}>{tx.id.slice(0, 8)}...</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(tx.id).then(() => toast.success("تم نسخ رقم العملية"))}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                    title="نسخ رقم العملية"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getTypeColor(tx.type)}>
                                                {getTypeLabel(tx.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{tx.description}</TableCell>
                                        <TableCell className={`font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'deposit' ? '+' : '-'}{Number(tx.amount).toLocaleString()} د.ج
                                        </TableCell>

                                        {/* PROFIT COLUMN */}
                                        {((role as string) === 'admin' || (role as string) === 'super_admin') && (
                                            <TableCell className="text-green-600 font-bold">
                                                {tx.financials?.adminProfit ? `+${Number(tx.financials.adminProfit).toFixed(2)}` : '-'}
                                            </TableCell>
                                        )}
                                        {(role as string) === 'wholesaler' && (
                                            <TableCell className="text-green-600 font-bold">
                                                {tx.financials?.wholesalerProfit ? `+${Number(tx.financials.wholesalerProfit).toFixed(2)}` : '-'}
                                            </TableCell>
                                        )}

                                        <TableCell className="text-sm font-medium">{tx.userName || tx.userId}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={tx.status === 'completed' ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}>
                                                {tx.status === 'completed' ? 'ناجحة' : 'فاشلة'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleString('ar-DZ')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Transactions;
