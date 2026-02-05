import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Scan, Upload, Key, Loader2, Camera } from "lucide-react";

interface AddCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    category: number;
}

const AddCardDialog: React.FC<AddCardDialogProps> = ({ open, onOpenChange, onSubmit, category }) => {
    const [activeTab, setActiveTab] = useState("manual");
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);

    // Form Data
    const [code, setCode] = useState("");
    const [serialNumber, setSerialNumber] = useState("");

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ type: 'manual', code, serialNumber, category });
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
            // Mock OCR call - In real app, send formData with file to backend
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch('http://localhost:3000/api/cards/ocr', {
                method: 'POST',
                // body: formData // In real implementation
            });

            if (res.ok) {
                const data = await res.json();
                setCode(data.code);
                setSerialNumber(data.serialNumber);
                // Switch to manual tab to review/edit
                setActiveTab("manual");
            }
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
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] text-right" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>إضافة بطاقة {category} د.ج</DialogTitle>
                </DialogHeader>

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
                                <Button type="submit" className="w-full" disabled={loading}>
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

export default AddCardDialog;
