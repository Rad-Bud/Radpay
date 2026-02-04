import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquareWarning, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const backendUrl = "http://localhost:3000/api";

const Complaints = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchComplaints(); }, []);

    const fetchComplaints = async () => {
        try {
            const res = await fetch(`${backendUrl}/complaints`);
            if (res.ok) setComplaints(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleResolve = async (id: string) => {
        if (!confirm("هل تم حل هذه الشكوى بالفعل؟")) return;
        try {
            const res = await fetch(`${backendUrl}/complaints/${id}/resolve`, { method: 'PUT' });
            if (res.ok) {
                // Local update
                setComplaints(prev => prev.map(c =>
                    c.id === id ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c
                ));
            }
        } catch (error) {
            alert("فشل تحديث الحالة");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">صندوق الشكاوي</h1>
                    <p className="text-muted-foreground">استقبال ومتابعة شكاوي المستخدمين</p>
                </div>

                <div className="rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">الموضوع</TableHead>
                                <TableHead className="text-right">الرسالة</TableHead>
                                <TableHead className="text-right">المستخدم</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center">تحميل...</TableCell></TableRow>
                            ) : complaints.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <MessageSquareWarning className="w-8 h-8 opacity-50" />
                                            <p>لا توجد شكاوي حالياً</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                complaints.map((complaint) => (
                                    <TableRow key={complaint.id}>
                                        <TableCell>
                                            {complaint.status === 'resolved' ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                                                    <CheckCircle className="w-3 h-3" /> تم الحل
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1">
                                                    <Clock className="w-3 h-3" /> قيد الانتظار
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{complaint.subject}</TableCell>
                                        <TableCell className="max-w-md truncate" title={complaint.message}>
                                            {complaint.message}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">{complaint.userId}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(complaint.createdAt).toLocaleDateString('ar-DZ')}
                                        </TableCell>
                                        <TableCell>
                                            {complaint.status !== 'resolved' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleResolve(complaint.id)}
                                                >
                                                    <CheckCircle className="w-4 h-4" /> تحديد كمحلول
                                                </Button>
                                            )}
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

export default Complaints;
