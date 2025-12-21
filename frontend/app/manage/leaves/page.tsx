"use client";

import { useListLeavesLeavesGet } from "@/lib/api/leaves/leaves";
import { LeaveStatus } from "@/lib/api/index.schemas";
import { LEAVE_TYPES } from "@/lib/constants";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

export default function ManageLeavesPage() {
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("PENDING");
    const { data: leaves = [], isLoading: loading } = useListLeavesLeavesGet({
        status: statusFilter === "ALL" ? undefined : statusFilter as LeaveStatus
    });

    const sortedLeaves = [...leaves].sort((a, b) => b.id - a.id);

    const getLeaveTypeName = (categoryId: number) => {
        return LEAVE_TYPES.find((t) => t.id === categoryId)?.name || "Unknown";
    };

    return (
        <AppLayout>
            <div className="py-10 space-y-8 px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Review Leave Requests</h1>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search by contractor name..."
                            className="pl-10 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-zinc-500" />
                        <select
                            className="bg-transparent text-sm font-medium focus:outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="PENDING">Pending Approval</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="ALL">All Statuses</option>
                        </select>
                    </div>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-zinc-50 dark:bg-zinc-900/50">
                                    <TableHead className="text-zinc-500 font-semibold">Contractor</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Type</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Dates</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Duration</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Status</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-semibold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full" />
                                                Loading requests...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedLeaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No {statusFilter.toLowerCase()} requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedLeaves.map((leave) => (
                                        <TableRow
                                            key={leave.id}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer group"
                                            onClick={() => window.location.href = `/leaves/${leave.id}`}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                        {leave.user?.full_name?.charAt(0)}
                                                    </div>
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                                        {leave.user?.full_name}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getLeaveTypeName(leave.category_id)}
                                            </TableCell>
                                            <TableCell className="text-zinc-600 dark:text-zinc-400">
                                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                            </TableCell>
                                            <TableCell>{leave.total_days} Days</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        leave.status === "APPROVED"
                                                            ? "bg-green-100 text-green-800 border-green-200"
                                                            : leave.status === "REJECTED"
                                                                ? "bg-red-100 text-red-800 border-red-200"
                                                                : leave.status === "CANCELLED"
                                                                    ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                                                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                    }
                                                >
                                                    {leave.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Review
                                                </Button>
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
