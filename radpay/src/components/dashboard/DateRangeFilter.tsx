
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { arDZ } from "date-fns/locale" // Optional: for Arabic formatting if needed
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useDateFilter } from "@/contexts/DateFilterContext"
import { useLanguage } from "@/contexts/LanguageContext" // Assuming we have this for translation support

export function DateRangeFilter({ className }: { className?: string }) {
    const { period, setPeriod, dateRange, setDateRange } = useDateFilter();
    // const { t } = useLanguage(); // Only if we want to use t() function

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="yesterday">أمس</SelectItem>
                    <SelectItem value="week">الأسبوع السابق</SelectItem>
                    <SelectItem value="month">الشهر السابق</SelectItem>
                    <SelectItem value="custom">تاريخ مخصص</SelectItem>
                </SelectContent>
            </Select>

            {period === 'custom' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            size="sm"
                            className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                        {format(dateRange.to, "dd/MM/yyyy")}
                                    </>
                                ) : (
                                    format(dateRange.from, "dd/MM/yyyy")
                                )
                            ) : (
                                <span>اختر التاريخ</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
