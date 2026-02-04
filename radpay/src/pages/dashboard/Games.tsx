import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowRight, Gamepad2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const backendUrl = "http://localhost:3000/api";

const Games = () => {
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddGameOpen, setIsAddGameOpen] = useState(false);
    const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

    // Form Data
    const [gameForm, setGameForm] = useState({ name: "", description: "" });
    const [packageForm, setPackageForm] = useState({ name: "", price: "", costPrice: "" });

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const res = await fetch(`${backendUrl}/games`);
            if (res.ok) {
                const data = await res.json();
                setGames(data);
            }
        } catch (error) {
            console.error("Failed to fetch games", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Game Handlers ---

    const handleAddGame = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${backendUrl}/games`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameForm)
            });
            if (res.ok) {
                setIsAddGameOpen(false);
                setGameForm({ name: "", description: "" });
                fetchGames();
            }
        } catch (error) {
            alert("فشل إضافة اللعبة");
        }
    };

    const handleDeleteGame = async (gameId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm("هل متأكد من حذف اللعبة؟ سيتم حذف جميع الباقات التابعة لها.")) return;
        try {
            await fetch(`${backendUrl}/games/${gameId}`, { method: 'DELETE' });
            fetchGames();
            if (selectedGame?.id === gameId) setSelectedGame(null);
        } catch (error) {
            alert("فشل الحذف");
        }
    };

    // --- Package Handlers ---

    const handleAddPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGame) return;
        try {
            const res = await fetch(`${backendUrl}/games/${selectedGame.id}/packages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(packageForm)
            });
            if (res.ok) {
                setIsAddPackageOpen(false);
                setPackageForm({ name: "", price: "", costPrice: "" });
                fetchGames(); // Refresh whole tree to update state
                // Optimistically update selectedGame or refetch specific game could be better, 
                // but fetchGames is simpler for now as it returns nested packages.

                // Hack: We need to re-select the game after fetchGames updates `games` state. 
                // Since hooks are async, we might lose selection or show stale data.
                // Better approach: locally update state.
                const newPackage = await res.json();
                setGames(prev => prev.map(g => {
                    if (g.id === selectedGame.id) {
                        const updatedGame = { ...g, packages: [...(g.packages || []), newPackage] };
                        setSelectedGame(updatedGame); // Keep view updated
                        return updatedGame;
                    }
                    return g;
                }));
            }
        } catch (error) {
            alert("فشل إضافة الباقة");
        }
    };

    const handleDeletePackage = async (packageId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
        try {
            await fetch(`${backendUrl}/games/${selectedGame.id}/packages/${packageId}`, { method: 'DELETE' });

            // Local Update
            setGames(prev => prev.map(g => {
                if (g.id === selectedGame.id) {
                    const updatedGame = { ...g, packages: g.packages.filter((p: any) => p.id !== packageId) };
                    setSelectedGame(updatedGame);
                    return updatedGame;
                }
                return g;
            }));

        } catch (error) {
            alert("فشل الحذف");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">شحن الألعاب</h1>
                        <p className="text-muted-foreground mt-1">
                            {selectedGame
                                ? `إدارة باقات: ${selectedGame.name}`
                                : 'إدارة أنواع الألعاب وباقات الشحن'
                            }
                        </p>
                    </div>
                </div>

                {!selectedGame ? (
                    // --- Games List View ---
                    <div className="space-y-6">
                        <Dialog open={isAddGameOpen} onOpenChange={setIsAddGameOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" /> إضافة لعبة جديدة
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="text-right" dir="rtl">
                                <DialogHeader className="text-right">
                                    <DialogTitle>إضافة لعبة جديدة</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddGame} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>اسم اللعبة</Label>
                                        <Input
                                            value={gameForm.name}
                                            onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                                            placeholder="مثال: Free Fire"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>وصف (اختياري)</Label>
                                        <Input
                                            value={gameForm.description}
                                            onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                                            placeholder="مثال: جواهر فري فاير شحن فوري"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">حفظ</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {loading ? (
                                <p>جاري التحميل...</p>
                            ) : games.length === 0 ? (
                                <div className="col-span-3 text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                                    <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>لا توجد ألعاب مضافة حالياً</p>
                                </div>
                            ) : (
                                games.map(game => (
                                    <Card
                                        key={game.id}
                                        className="cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden"
                                        onClick={() => setSelectedGame(game)}
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-xl">{game.name}</CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 -mt-2 -ml-2"
                                                    onClick={(e) => handleDeleteGame(game.id, e)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <CardDescription>{game.description || "لا يوجد وصف"}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Package className="w-4 h-4" />
                                                <span>{game.packages?.length || 0} باقات متوفيرة</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    // --- Packages View (Inside Game) ---
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <Button variant="outline" className="gap-2" onClick={() => setSelectedGame(null)}>
                                <ArrowRight className="w-4 h-4" /> رجوع للقائمة
                            </Button>

                            <Dialog open={isAddPackageOpen} onOpenChange={setIsAddPackageOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" /> إضافة باقة شحن
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="text-right" dir="rtl">
                                    <DialogHeader className="text-right">
                                        <DialogTitle>إضافة باقة لـ {selectedGame.name}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddPackage} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>اسم الباقة / الكمية</Label>
                                            <Input
                                                value={packageForm.name}
                                                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                                                placeholder="مثال: 100 + 10 جوهرة"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>سعر البيع (د.ج)</Label>
                                                <Input
                                                    type="number"
                                                    value={packageForm.price}
                                                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                                                    placeholder="مثال: 250"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>سعر التكلفة (اختياري)</Label>
                                                <Input
                                                    type="number"
                                                    value={packageForm.costPrice}
                                                    onChange={(e) => setPackageForm({ ...packageForm, costPrice: e.target.value })}
                                                    placeholder="مثال: 200"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">إضافة الباقة</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="rounded-xl border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">اسم الباقة</TableHead>
                                        <TableHead className="text-right">سعر البيع</TableHead>
                                        <TableHead className="text-right">سعر التكلفة</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedGame.packages?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                لا توجد باقات مضافة لهذه اللعبة
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        selectedGame.packages?.map((pkg: any) => (
                                            <TableRow key={pkg.id}>
                                                <TableCell className="font-medium">{pkg.name}</TableCell>
                                                <TableCell className="font-bold text-emerald-600">
                                                    {Number(pkg.price).toLocaleString()} د.ج
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {pkg.costPrice ? `${Number(pkg.costPrice).toLocaleString()} د.ج` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold">
                                                        نشط
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeletePackage(pkg.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Games;
