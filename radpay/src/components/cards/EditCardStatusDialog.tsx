import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface EditCardStatusDialogProps {
    open: boolean;
    onClose: () => void;
    card: any;
    packageName: string;
    onSuccess: () => void;
}

const EditCardStatusDialog: React.FC<EditCardStatusDialogProps> = ({
    open,
    onClose,
    card,
    packageName,
    onSuccess
}) => {
    const [newStatus, setNewStatus] = useState(card?.status || 'available');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (card) {
            setNewStatus(card.status);
        }
    }, [card]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'متوفرة';
            case 'used': return 'مستعملة';
            case 'sold': return 'مباعة';
            case 'invalid': return 'غير صالحة';
            default: return status;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">متوفرة</Badge>;
            case 'sold':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">مباعة</Badge>;
            case 'used':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">مستعملة</Badge>;
            case 'invalid':
                return <Badge variant="destructive">غير صالحة</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleSave = async () => {
        if (!card || newStatus === card.status) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
            const response = await fetch(`${backendUrl}/cards/${card.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update status');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating card status:', error);
            alert('فشل تحديث حالة البطاقة');
        } finally {
            setLoading(false);
        }
    };

    if (!card) return null;

    const maskedCode = card.code ? `****${card.code.slice(-4)}` : '****';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل حالة البطاقة</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Card Info */}
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">الكود:</span>
                            <span className="font-mono font-medium">{maskedCode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">الباقة:</span>
                            <span className="font-medium">{packageName}</span>
                        </div>
                    </div>

                    {/* Current Status */}
                    <div className="space-y-2">
                        <Label className="text-right">الحالة الحالية</Label>
                        <div className="flex justify-end">
                            {getStatusBadge(card.status)}
                        </div>
                    </div>

                    {/* New Status Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-right">الحالة الجديدة</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger id="status" className="text-right">
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="available">متوفرة</SelectItem>
                                <SelectItem value="used">مستعملة</SelectItem>
                                <SelectItem value="sold">مباعة</SelectItem>
                                <SelectItem value="invalid">غير صالحة</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || newStatus === card.status}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            'حفظ'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditCardStatusDialog;
