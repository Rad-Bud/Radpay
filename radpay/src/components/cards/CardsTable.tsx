import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CardData {
    id: string;
    code: string;
    serialNumber?: string;
    entryDate: string;
    usageDate?: string;
    status: 'available' | 'used' | 'invalid';
    category: number;
}

interface CardsTableProps {
    cards: CardData[];
    loading: boolean;
}

const CardsTable: React.FC<CardsTableProps> = ({ cards, loading }) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available': return <Badge variant="secondary" className="bg-green-100 text-green-800">نشطة</Badge>;
            case 'used': return <Badge variant="secondary" className="bg-gray-100 text-gray-800">مستعملة</Badge>;
            case 'invalid': return <Badge variant="destructive">غير صالحة</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">الرقم التسلسلي</TableHead>
                        <TableHead className="text-right">الكود</TableHead>
                        <TableHead className="text-right">القيمة</TableHead>
                        <TableHead className="text-right">تاريخ الإدخال</TableHead>
                        <TableHead className="text-right">تاريخ الاستعمال</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري التحميل...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : cards.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                لا توجد بطاقات في هذه الفئة
                            </TableCell>
                        </TableRow>
                    ) : (
                        cards.map((card) => (
                            <TableRow key={card.id}>
                                <TableCell className="font-mono">{card.serialNumber || '-'}</TableCell>
                                <TableCell className="font-mono font-bold tracking-wider">{card.code}</TableCell>
                                <TableCell>{card.category} د.ج</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(card.entryDate).toLocaleDateString('ar-DZ')}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {card.usageDate ? new Date(card.usageDate).toLocaleDateString('ar-DZ') : '-'}
                                </TableCell>
                                <TableCell>{getStatusBadge(card.status)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default CardsTable;
