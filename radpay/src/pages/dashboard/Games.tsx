import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowRight, Gamepad2, Package, Layers, Archive, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameCardsTable from "@/components/cards/GameCardsTable";
import AddGameCardDialog from "@/components/cards/AddGameCardDialog";
import PurchaseCardDialog from "@/components/cards/PurchaseCardDialog";
import CardDetailsModal from "@/components/cards/CardDetailsModal";
import { useAuth } from "@/contexts/AuthContext";

const backendUrl = "http://localhost:3000/api";

const Games = () => {
    const { role } = useAuth();
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddGameOpen, setIsAddGameOpen] = useState(false);
    const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [selectedPackageForAddCard, setSelectedPackageForAddCard] = useState<any | null>(null);

    // Active Tab State
    const [activeTab, setActiveTab] = useState('packages');

    // Form Data
    const [gameForm, setGameForm] = useState({ name: "", description: "" });
    const [packageForm, setPackageForm] = useState({
        name: "",
        purchasePrice: "",
        wholesalerPrice: "",
        retailerPrice: "",
        customerPrice: ""
    });

    // Inventory State
    const [gameCards, setGameCards] = useState<any[]>([]);
    const [cardsLoading, setCardsLoading] = useState(false);

    // Purchase Dialog State
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [selectedPackageForPurchase, setSelectedPackageForPurchase] = useState<any | null>(null);
    const [availableCardCounts, setAvailableCardCounts] = useState<Record<string, number>>({});

    // Post-Purchase State
    const [purchasedCard, setPurchasedCard] = useState<any | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

    // Fetch Cards for selected game
    const fetchGameCards = async (gameId: string) => {
        setCardsLoading(true);
        try {
            const res = await fetch(`${backendUrl}/cards?operator=${gameId}`);
            if (res.ok) {
                const data = await res.json();
                setGameCards(data);
            }
        } catch (error) {
            console.error("Failed to fetch game cards", error);
        } finally {
            setCardsLoading(false);
        }
    };

    // Fetch available card counts
    const fetchAvailableCardCounts = async (gameId: string) => {
        try {
            const res = await fetch(`${backendUrl}/cards/available-count?gameId=${gameId}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableCardCounts(data);
            }
        } catch (error) {
            console.error("Failed to fetch available counts", error);
        }
    };

    useEffect(() => {
        if (selectedGame) {
            fetchGameCards(selectedGame.id);
            fetchAvailableCardCounts(selectedGame.id);
        }
    }, [selectedGame]);


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
                setPackageForm({ name: "", purchasePrice: "", wholesalerPrice: "", retailerPrice: "", customerPrice: "" });
                // Refresh games to update the packages list in state
                const updatedGamesRes = await fetch(`${backendUrl}/games`);
                const updatedGames = await updatedGamesRes.json();
                setGames(updatedGames);

                // Update selected game reference
                const updatedSelectedGame = updatedGames.find((g: any) => g.id === selectedGame.id);
                if (updatedSelectedGame) setSelectedGame(updatedSelectedGame);
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

    // --- Card Handlers ---
    const handleAddCardSubmit = async (data: any) => {
        try {
            const res = await fetch(`${backendUrl}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operator: selectedGame.id, // Store GameID as Operator
                    ...data
                })
            });

            if (res.ok) {
                alert("تم إضافة البطاقة بنجاح");
                fetchGameCards(selectedGame.id);
            } else {
                alert("فشل إضافة البطاقة");
            }
        } catch (error) {
            console.error(error);
            alert("خطأ في الاتصال");
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
                                ? `إدارة: ${selectedGame.name}`
                                : 'إدارة أنواع الألعاب وباقات الشحن والمخزون'
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
                    // --- Game Detailed View (Tabs: Packages / Inventory) ---
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Gamepad2 className="w-6 h-6" />
                                {selectedGame.name}
                            </h2>
                            <Button variant="outline" className="gap-2" onClick={() => setSelectedGame(null)}>
                                <ArrowRight className="w-4 h-4" /> رجوع للقائمة
                            </Button>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                                <TabsTrigger
                                    value="packages"
                                    className="data-[state=active]:bg-transparent data-[state=active]:box-content data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        باقات اللعبة
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="inventory"
                                    className="data-[state=active]:bg-transparent data-[state=active]:box-content data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <Archive className="w-4 h-4" />
                                        المخزون والبطاقات
                                    </div>
                                </TabsTrigger>
                            </TabsList>

                            {/* --- TAB: PACKAGES --- */}
                            <TabsContent value="packages" className="pt-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">قائمة الباقات</h3>
                                    <Dialog open={isAddPackageOpen} onOpenChange={setIsAddPackageOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2">
                                                <Plus className="w-4 h-4" /> إضافة باقة
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
                                                        <Label>سعر الشراء (Admin)</Label>
                                                        <Input
                                                            type="number"
                                                            value={packageForm.purchasePrice}
                                                            onChange={(e) => setPackageForm({ ...packageForm, purchasePrice: e.target.value })}
                                                            placeholder="200"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>سعر الجملة (Wholesaler)</Label>
                                                        <Input
                                                            type="number"
                                                            value={packageForm.wholesalerPrice}
                                                            onChange={(e) => setPackageForm({ ...packageForm, wholesalerPrice: e.target.value })}
                                                            placeholder="210"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>سعر التجزئة (Retailer)</Label>
                                                        <Input
                                                            type="number"
                                                            value={packageForm.retailerPrice}
                                                            onChange={(e) => setPackageForm({ ...packageForm, retailerPrice: e.target.value })}
                                                            placeholder="220"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>سعر الزبون (Customer)</Label>
                                                        <Input
                                                            type="number"
                                                            value={packageForm.customerPrice}
                                                            onChange={(e) => setPackageForm({ ...packageForm, customerPrice: e.target.value })}
                                                            placeholder="250"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Profit Calculation */}
                                                {packageForm.purchasePrice && packageForm.wholesalerPrice && packageForm.retailerPrice && packageForm.customerPrice && (
                                                    <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                        <p className="text-sm font-semibold mb-2">الأرباح المتوقعة:</p>
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-muted-foreground">Admin:</span>
                                                                <span className="font-bold text-emerald-600 mr-1">
                                                                    {(Number(packageForm.wholesalerPrice) - Number(packageForm.purchasePrice)).toLocaleString()} دج
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Wholesaler:</span>
                                                                <span className="font-bold text-emerald-600 mr-1">
                                                                    {(Number(packageForm.retailerPrice) - Number(packageForm.wholesalerPrice)).toLocaleString()} دج
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Retailer:</span>
                                                                <span className="font-bold text-emerald-600 mr-1">
                                                                    {(Number(packageForm.customerPrice) - Number(packageForm.retailerPrice)).toLocaleString()} دج
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

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
                                                <TableHead className="text-right">البطاقات المتوفرة</TableHead>
                                                <TableHead className="text-right">سعر البيع</TableHead>
                                                <TableHead className="text-right">سعر التكلفة</TableHead>
                                                <TableHead className="text-right">الحالة</TableHead>
                                                <TableHead className="text-right">إجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedGame.packages?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        لا توجد باقات مضافة لهذه اللعبة
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                selectedGame.packages?.map((pkg: any) => {
                                                    const availableCount = availableCardCounts[pkg.id] || 0;
                                                    return (
                                                        <TableRow key={pkg.id}>
                                                            <TableCell className="font-medium">{pkg.name}</TableCell>
                                                            <TableCell>
                                                                <span className={`font-semibold ${availableCount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    {availableCount} بطاقة
                                                                </span>
                                                            </TableCell>
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
                                                                <div className="flex gap-2">
                                                                    {/* Show purchase button only for wholesalers/retailers, not admin */}
                                                                    {(role === 'super_wholesaler' || role === 'wholesaler' || role === 'retailer') && (
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            className="gap-1"
                                                                            onClick={() => {
                                                                                setSelectedPackageForPurchase(pkg);
                                                                                setIsPurchaseDialogOpen(true);
                                                                            }}
                                                                            disabled={availableCount === 0}
                                                                        >
                                                                            <ShoppingCart className="w-3 h-3" />
                                                                            شراء
                                                                        </Button>
                                                                    )}

                                                                    {/* Admin can delete packages and add cards */}
                                                                    {(role === 'super_admin') && (
                                                                        <>
                                                                            <Button
                                                                                variant="default"
                                                                                size="sm"
                                                                                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                                                onClick={() => {
                                                                                    setSelectedPackageForAddCard(pkg);
                                                                                    setActiveTab('inventory');
                                                                                    // Open dialog after a short delay to ensure tab switch completes
                                                                                    setTimeout(() => setIsAddCardOpen(true), 100);
                                                                                }}
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                                إضافة بطاقة
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                onClick={() => handleDeletePackage(pkg.id)}
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* --- TAB: INVENTORY --- */}
                            <TabsContent value="inventory" className="pt-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">سجل البطاقات (المخزون)</h3>
                                    <Button className="gap-2" onClick={() => setIsAddCardOpen(true)} disabled={!selectedGame.packages?.length}>
                                        <Plus className="w-4 h-4" /> إضافة بطاقة
                                    </Button>
                                </div>

                                {!selectedGame.packages?.length && (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-2 mb-4">
                                        يجب إضافة باقات أولاً قبل التمكّن من إضافة بطاقات للمخزون.
                                    </div>
                                )}

                                <GameCardsTable
                                    cards={gameCards}
                                    packages={selectedGame.packages || []}
                                    loading={cardsLoading}
                                    gameName={selectedGame.name}
                                />

                                <AddGameCardDialog
                                    open={isAddCardOpen}
                                    onOpenChange={setIsAddCardOpen}
                                    onSubmit={handleAddCardSubmit}
                                    packages={selectedGame.packages || []}
                                    preSelectedPackage={selectedPackageForAddCard}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            {/* Purchase Dialog */}
            {selectedPackageForPurchase && (
                <PurchaseCardDialog
                    open={isPurchaseDialogOpen}
                    onClose={() => {
                        setIsPurchaseDialogOpen(false);
                        setSelectedPackageForPurchase(null);
                    }}
                    packageData={selectedPackageForPurchase}
                    gameId={selectedGame?.id || ''}
                    gameName={selectedGame?.name || ''}
                    availableCount={availableCardCounts[selectedPackageForPurchase.id] || 0}
                    onSuccess={(result) => {
                        // Refresh counts after purchase
                        if (selectedGame) {
                            fetchAvailableCardCounts(selectedGame.id);
                            fetchGameCards(selectedGame.id);
                        }

                        // Switch to inventory tab
                        setActiveTab('inventory');

                        // Show card details modal
                        setPurchasedCard({
                            ...result.card,
                            packageData: selectedPackageForPurchase // Pass package data for details
                        });
                        setIsDetailsModalOpen(true);
                    }}
                />
            )}

            {/* Post-Purchase Details Modal */}
            {purchasedCard && (
                <CardDetailsModal
                    open={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setPurchasedCard(null);
                    }}
                    card={purchasedCard}
                    packageName={selectedPackageForPurchase?.name || ''}
                    gameName={selectedGame?.name || ''}
                />
            )}
        </DashboardLayout>
    );
};

export default Games;
