import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CategoryProps {
    onSelect: (value: number) => void;
}

const InternetCardCategories: React.FC<CategoryProps> = ({ onSelect }) => {
    const categories = [
        { value: 500, label: 'بطاقة 500 دج', color: 'bg-blue-500' },
        { value: 1000, label: 'بطاقة 1000 دج', color: 'bg-indigo-500' },
        { value: 2000, label: 'بطاقة 2000 دج', color: 'bg-purple-500' },
        { value: 3000, label: 'بطاقة 3000 دج', color: 'bg-pink-500' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
                <Card
                    key={cat.value}
                    className="cursor-pointer hover:shadow-lg transition-all border-t-4 group relative overflow-hidden"
                    style={{ borderTopColor: cat.color.replace('bg-', 'text-') }} // Approximate color usage
                    onClick={() => onSelect(cat.value)}
                >
                    <div className={`absolute top-0 left-0 w-full h-1 ${cat.color}`} />
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">{cat.label}</CardTitle>
                        <CardDescription>IDOOM ADSL/Fiber</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center py-6">
                        <div className={`w-24 h-16 rounded-lg ${cat.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold shadow-md`}>
                            {cat.value} DA
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default InternetCardCategories;
