import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Copy, CheckCircle, Gamepad2 } from "lucide-react";
import { useReactToPrint } from 'react-to-print';

interface CardDetailsModalProps {
    open: boolean;
    onClose: () => void;
    card: any;
    packageName: string;
    gameName: string;
}

export default function CardDetailsModal({ open, onClose, card, packageName, gameName }: CardDetailsModalProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = React.useState(false);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `${gameName} - ${packageName}`,
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(card.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        تم الشراء بنجاح!
                    </DialogTitle>
                </DialogHeader>

                {/* Printable Area */}
                <div ref={printRef} className="print-area">
                    <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 rounded-lg border-2 border-primary/20 space-y-4">
                        {/* Header */}
                        <div className="text-center border-b pb-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Gamepad2 className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-bold">{gameName}</h2>
                            </div>
                            <p className="text-lg text-muted-foreground">{packageName}</p>
                        </div>

                        {/* Code */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-dashed border-primary">
                            <p className="text-xs text-muted-foreground text-center mb-2">كود التعبئة</p>
                            <p className="text-2xl font-mono font-bold text-center tracking-wider select-all">
                                {card.code}
                            </p>
                        </div>

                        {/* Serial Number */}
                        {card.serialNumber && (
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">الرقم التسلسلي</p>
                                <p className="font-mono text-sm">{card.serialNumber}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="text-center text-xs text-muted-foreground pt-4 border-t print:block hidden">
                            <p>احتفظ بهذا الكود في مكان آمن</p>
                            <p>RadPay - نظام إدارة الشحن</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 print:hidden">
                    <Button variant="outline" onClick={handleCopy} className="gap-2">
                        {copied ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                تم النسخ
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                نسخ الكود
                            </>
                        )}
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" />
                        طباعة
                    </Button>
                </DialogFooter>

                {/* Print Styles */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-area, .print-area * {
                            visibility: visible;
                        }
                        .print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
