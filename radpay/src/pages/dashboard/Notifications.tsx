import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Send, User } from "lucide-react";

const backendUrl = "http://localhost:3000/api";

const Notifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [form, setForm] = useState({
        title: "",
        body: "",
        target: "all",
        userId: ""
    });

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${backendUrl}/notifications`);
            if (res.ok) setNotifications(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await fetch(`${backendUrl}/notifications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert("تم إرسال الإشعار بنجاح");
                setForm({ title: "", body: "", target: "all", userId: "" });
                fetchNotifications();
            } else {
                alert("فشل الإرسال");
            }
        } catch (error) {
            alert("خطأ في الاتصال");
        } finally {
            setSending(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">الإشعارات</h1>
                    <p className="text-muted-foreground">إرسال تنبيهات وإشعارات للمستخدمين</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Compose Card */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> إرسال إشعار جديد</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSend} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>عنوان الإشعار</Label>
                                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="تنبيه هام..." required />
                                </div>
                                <div className="space-y-2">
                                    <Label>نص الإشعار</Label>
                                    <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="يرجى العلم بأنه سيتم..." required />
                                </div>
                                <div className="space-y-2">
                                    <Label>المستلمون</Label>
                                    <Select value={form.target} onValueChange={v => setForm({ ...form, target: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع المستخدمين</SelectItem>
                                            <SelectItem value="specific">مستخدم محدد</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {form.target === 'specific' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label>معرف المستخدم (User ID)</Label>
                                        <Input value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} placeholder="Firebase UID" required />
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={sending}>
                                    {sending ? "جاري الإرسال..." : "إرسال الإشعار"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* History List */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> سجل الإشعارات المرسلة</CardTitle>
                            <CardDescription>آخر الإشعارات التي تم إرسالها عبر النظام</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {loading ? <p>تحميل...</p> : notifications.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">لا يوجد سجل إشعارات</p>
                                ) : notifications.map(note => (
                                    <div key={note.id} className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                                        <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                            <Bell className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold">{note.title}</h4>
                                                <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString('ar-DZ')}</span>
                                            </div>
                                            <p className="text-sm text-foreground/80">{note.body}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${note.target === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {note.target === 'all' ? 'عام' : 'خاص'}
                                                </span>
                                                {note.target === 'specific' && <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{note.userId}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Notifications;
