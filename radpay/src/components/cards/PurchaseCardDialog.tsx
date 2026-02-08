import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Wallet, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseCardDialogProps {
    open: boolean;
    onClose: () => void;
    packageData: any;
    gameId: string;
    gameName: string;
    availableCount: number;

    onSuccess: (purchaseResult: any) => void;
    currentUserBalance?: number;
}

const backendUrl = "http://localhost:3000/api";

export default function PurchaseCardDialog({ open, onClose, packageData, gameId, gameName, availableCount, onSuccess, currentUserBalance }: PurchaseCardDialogProps) {
    const [loading, setLoading] = useState(false);
    const { user, role } = useAuth();

    // Determine price based on role
    const getPrice = () => {
        if (role === 'super_admin') {
            return Number(packageData?.purchasePrice) || Number(packageData?.costPrice) || 0;
        } else if (role === 'super_wholesaler' || role === 'wholesaler') {
            return Number(packageData?.wholesalerPrice) || Number(packageData?.price) || 0;
        } else {
            return Number(packageData?.retailerPrice) || Number(packageData?.price) || 0;
        }
    };

    const price = getPrice();
    const [userBalance, setUserBalance] = React.useState<number>(0);
    const canAfford = userBalance >= price;
    const hasAvailableCards = availableCount > 0;

    // Fetch user balance
    React.useEffect(() => {
        // Always try to use the passed prop first, but if it's 0 (which might be initial state), 
        // we should also try to fetch fresh data to be sure.
        if (currentUserBalance !== undefined && currentUserBalance > 0) {
            setUserBalance(currentUserBalance);
        } else if (open && user) {
            fetch(`http://localhost:3000/api/users/${user.uid}`)
                .then(res => res.json())
                .then(data => setUserBalance(Number(data.balance) || 0))
                .catch(() => setUserBalance(0));
        }
    }, [open, user, currentUserBalance]);

    const handlePurchase = async () => {
        if (!canAfford) {
            alert("رصيد غير كافي");
            return;
        }

        if (!hasAvailableCards) {
            alert("لا توجد بطاقات متوفرة من هذه الباقة");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/cards/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: packageData.id,
                    gameId: gameId,
                    userId: user?.uid
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                onSuccess(data);
                onClose();
            } else {
                alert(data.error || "فشل شراء البطاقة");
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert("خطأ في الاتصال");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] text-right" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        تأكيد الشراء
                    </DialogTitle>
                    <DialogDescription className="text-right">
                        سيتم تعيين بطاقة متوفرة لك تلقائياً
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Package Details */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">اللعبة:</span>
                            <span className="font-semibold">{gameName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">الباقة:</span>
                            <span className="font-semibold">{packageData?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">البطاقات المتوفرة:</span>
                            <span className={`font-semibold ${hasAvailableCards ? 'text-emerald-600' : 'text-red-600'}`}>
                                {availableCount} بطاقة
                            </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">السعر:</span>
                            <span className="font-bold text-lg text-primary">{price.toLocaleString()} د.ج</span>
                        </div>
                    </div>

                    {/* Balance Info */}
                    <div className={`p-4 rounded-lg border ${canAfford ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {canAfford ? (
                                <Wallet className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-semibold">معلومات الرصيد</span>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">رصيدك الحالي:</span>
                                <span className="font-semibold">{userBalance.toLocaleString()} د.ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الرصيد بعد الشراء:</span>
                                <span className={`font-semibold ${canAfford ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {(userBalance - price).toLocaleString()} د.ج
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {!canAfford && (
                        <div className="bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm">
                            رصيدك غير كافٍ لإتمام عملية الشراء. يرجى شحن رصيدك أولاً.
                        </div>
                    )}

                    {!hasAvailableCards && (
                        <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
                            لا توجد بطاقات متوفرة من هذه الباقة حالياً.
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        إلغاء
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        disabled={loading || !canAfford || !hasAvailableCards}
                        className="gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الشراء...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-4 h-4" />
                                تأكيد الشراء
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
