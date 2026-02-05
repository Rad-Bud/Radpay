import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Scan, Key, Loader2, Camera } from "lucide-react";

interface AddGameCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    packages: any[];
}

const AddGameCardDialog: React.FC<AddGameCardDialogProps> = ({ open, onOpenChange, onSubmit, packages }) => {
    const [activeTab, setActiveTab] = useState("manual");
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);

    // Form Data
    const [selectedPackage, setSelectedPackage] = useState("");
    const [code, setCode] = useState("");
    const [serialNumber, setSerialNumber] = useState("");

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackage) {
            alert("يرجى اختيار الباقة");
            return;
        }
        setLoading(true);
        try {
            await onSubmit({ type: 'manual', code, serialNumber, category: selectedPackage });
            resetForm();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrLoading(true);
        try {
            // Mock OCR call
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Mock result
            setCode(Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString());
            setSerialNumber(Math.floor(1000000000 + Math.random() * 9000000000).toString());

            // Switch to manual tab
            setActiveTab("manual");
        } catch (error) {
            console.error("OCR Failed", error);
            alert("فشل في قراءة الصورة");
        } finally {
            setOcrLoading(false);
        }
    };

    const resetForm = () => {
        setCode("");
        setSerialNumber("");
        // Keep selected package as users might add multiple cards of same type
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>إضافة بطاقة لعبة</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label>نوع الباقة</Label>
                        <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                            <SelectTrigger className="text-right" dir="rtl">
                                <SelectValue placeholder="اختر الباقة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {packages.map(pkg => (
                                    <SelectItem key={pkg.id} value={pkg.id}>
                                        {pkg.name} ({Number(pkg.price).toLocaleString()} د.ج)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="manual" className="gap-2">
                            <Key className="w-4 h-4" />
                            إدخال يدوي
                        </TabsTrigger>
                        <TabsTrigger value="ocr" className="gap-2">
                            <Scan className="w-4 h-4" />
                            مسح ضوئي (OCR)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">كود البطاقة</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="أدخل كود التعبئة"
                                    className="font-mono text-center tracking-widest text-lg"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="serial">الرقم التسلسلي (اختياري)</Label>
                                <Input
                                    id="serial"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    placeholder="S/N"
                                    className="font-mono"
                                />
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="submit" className="w-full" disabled={loading || !selectedPackage}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                                    إضافة البطاقة
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="ocr">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer relative">
                            <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageUpload}
                                disabled={ocrLoading}
                            />
                            {ocrLoading ? (
                                <div className="text-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-3 mx-auto" />
                                    <p className="text-sm text-muted-foreground">جاري تحليل الصورة...</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Camera className="w-10 h-10 text-muted-foreground mb-3 mx-auto" />
                                    <p className="font-medium">اضغط لرفع صورة البطاقة</p>
                                    <p className="text-xs text-muted-foreground mt-1">سيتم استخراج الكود تلقائياً</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AddGameCardDialog;
