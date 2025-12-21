"use client";

import { useGetMonthlyReconciliationFinanceReconciliationGet } from "@/lib/api/finance/finance";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Calendar as CalendarIcon, Calculator } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AXIOS_INSTANCE } from "@/lib/api/axios-instance";

export default function FinancePage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [workingDays, setWorkingDays] = useState(22);

    const { data: summary, isLoading: loading, error } = useGetMonthlyReconciliationFinanceReconciliationGet({
        year,
        month,
        working_days: workingDays
    });

    const handleExport = async () => {
        try {
            const res = await AXIOS_INSTANCE.get(`/finance/export`, {
                params: { year, month, working_days: workingDays },
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `billing_recon_${year}_${month.toString().padStart(2, '0')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export error", err);
            alert("Failed to export CSV");
        }
    };

    return (
        <AppLayout>
            <div className="py-10 space-y-8 px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Finance Reconciliation</h1>
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" /> Year
                        </label>
                        <Input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" /> Month
                        </label>
                        <select
                            className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1">
                            <Calculator className="h-3 w-3" /> Working Days
                        </label>
                        <Input
                            type="number"
                            value={workingDays}
                            onChange={(e) => setWorkingDays(Number(e.target.value))}
                            className="border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    <div className="flex items-end text-sm text-zinc-500 italic pb-2">
                        Calculated based on working days minus non-chargeable leave.
                    </div>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Monthly Billing Report - {month.toString().padStart(2, '0')}/{year}</CardTitle>
                            <FileSpreadsheet className="h-5 w-5 text-zinc-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-zinc-500 font-semibold">Name</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold text-center">Vendor ID</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold text-center">Chargeable</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold text-center">Non-Chargeable</TableHead>
                                    <TableHead className="text-right text-zinc-900 dark:text-zinc-50 font-bold">Billable Days</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            Loading reconciliation data...
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-red-500">
                                            Failed to load data. Please ensure you have manager permissions.
                                        </TableCell>
                                    </TableRow>
                                ) : summary?.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No user data found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    summary?.rows.map((row) => (
                                        <TableRow key={row.user_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                            <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                                                {row.full_name}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-zinc-500">
                                                {row.vendor_id || "MISSING"}
                                            </TableCell>
                                            <TableCell className="text-center text-zinc-600 dark:text-zinc-400">
                                                {row.chargeable_leave} d
                                            </TableCell>
                                            <TableCell className="text-center text-zinc-600 dark:text-zinc-400">
                                                {row.non_chargeable_leave} d
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-50">
                                                {row.total_billable_days} Days
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
