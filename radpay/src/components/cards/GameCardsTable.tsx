import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CardDetailsModal from "./CardDetailsModal";
import EditCardStatusDialog from "./EditCardStatusDialog";

interface CardData {
    id: string;
    code: string;
    serialNumber?: string;
    entryDate: string;
    usageDate?: string;
    status: 'available' | 'sold' | 'used' | 'invalid';
    category: string; // This is the Package ID
    operator: string; // Game ID
    soldTo?: string;
    soldAt?: string;
    soldPrice?: number;
}

interface GameCardsTableProps {
    cards: CardData[];
    packages: any[]; // List of packages to resolve names
    loading: boolean;
    gameName: string;
}

const GameCardsTable: React.FC<GameCardsTableProps> = ({ cards, packages, loading, gameName }) => {
    const { role } = useAuth();
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<any>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available': return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">متوفرة</Badge>;
            case 'sold': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">مباعة</Badge>;
            case 'used': return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">مستعملة</Badge>;
            case 'invalid': return <Badge variant="destructive">غير صالحة</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPackageData = (packageId: string) => {
        return packages.find(p => p.id === packageId);
    };

    const getPackageName = (packageId: string) => {
        const pkg = getPackageData(packageId);
        return pkg ? pkg.name : 'باقة محذوفة';
    };

    const getPrice = (packageId: string) => {
        const pkg = getPackageData(packageId);
        if (!pkg) return 0;

        if (role === 'super_admin') {
            return Number(pkg.purchasePrice) || Number(pkg.costPrice) || 0;
        } else if (role === 'super_wholesaler' || role === 'wholesaler') {
            return Number(pkg.wholesalerPrice) || Number(pkg.price) || 0;
        } else {
            return Number(pkg.retailerPrice) || Number(pkg.price) || 0;
        }
    };

    const handleViewDetails = (card: CardData) => {
        setSelectedCard(card);
        setDetailsModalOpen(true);
    };

    const handleEditStatus = (card: CardData) => {
        setSelectedCard(card);
        setEditStatusDialogOpen(true);
    };

    const handleEditSuccess = () => {
        // Refresh the page to show updated status
        window.location.reload();
    };

    const handleDetailsModalClose = () => {
        setDetailsModalOpen(false);
        setSelectedCard(null);
    };

    return (
        <>
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الرقم التسلسلي</TableHead>
                            <TableHead className="text-right">الكود</TableHead>
                            <TableHead className="text-right">الباقة</TableHead>
                            <TableHead className="text-right">السعر</TableHead>
                            <TableHead className="text-right">تاريخ الإدخال</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        جاري التحميل...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : cards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    لا توجد بطاقات مخزنة لهذه اللعبة
                                </TableCell>
                            </TableRow>
                        ) : (
                            cards.map((card) => {
                                const packageData = getPackageData(card.category);
                                const price = getPrice(card.category);

                                return (
                                    <TableRow key={card.id}>
                                        <TableCell className="font-mono">{card.serialNumber || '-'}</TableCell>
                                        <TableCell className="font-mono font-bold tracking-wider">
                                            {card.status === 'sold' ? `****${card.code.slice(-4)}` : card.code}
                                        </TableCell>
                                        <TableCell className="font-medium text-blue-600">{getPackageName(card.category)}</TableCell>
                                        <TableCell className="font-semibold text-emerald-600">
                                            {card.soldPrice ? `${card.soldPrice.toLocaleString()} د.ج` : `${price.toLocaleString()} د.ج`}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(card.entryDate).toLocaleDateString('ar-DZ')}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {/* Admin can edit status */}
                                                {role === 'super_admin' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                        onClick={() => handleEditStatus(card)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        تعديل
                                                    </Button>
                                                )}

                                                {/* View details for sold/used cards */}
                                                {(card.status === 'sold' || card.status === 'used') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                        onClick={() => handleViewDetails(card)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        عرض
                                                    </Button>
                                                )}

                                                {/* Show dash if no actions available */}
                                                {role !== 'super_admin' && card.status !== 'sold' && card.status !== 'used' && (
                                                    <span className="text-xs text-muted-foreground">-</span>
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

            {/* Card Details Modal */}
            {selectedCard && (
                <CardDetailsModal
                    open={detailsModalOpen}
                    onClose={handleDetailsModalClose}
                    card={selectedCard}
                    packageName={getPackageName(selectedCard.category)}
                    gameName={gameName}
                />
            )}

            {/* Edit Card Status Dialog */}
            {selectedCard && (
                <EditCardStatusDialog
                    open={editStatusDialogOpen}
                    onClose={() => setEditStatusDialogOpen(false)}
                    card={selectedCard}
                    packageName={getPackageName(selectedCard.category)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </>
    );
};

export default GameCardsTable;
