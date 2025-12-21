"use client";

import { useListLeavesLeavesGet } from "@/lib/api/leaves/leaves";
import { LeaveRequestRead } from "@/lib/api/index.schemas";
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
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatDate } from "@/lib/utils";

export default function LeavesPage() {
    const { data: leaves = [], isLoading: loading } = useListLeavesLeavesGet({ mine: true });
    const sortedLeaves = [...leaves].sort((a, b) => b.id - a.id);


    const getLeaveTypeName = (categoryId: number) => {
        return LEAVE_TYPES.find((t) => t.id === categoryId)?.name || "Unknown";
    };

    const getBillingStatus = (leave: LeaveRequestRead) => {
        if (leave.cached_chargeable_status !== undefined) {
            return leave.cached_chargeable_status ? "Chargeable" : "Non-Chargeable";
        }
        const type = LEAVE_TYPES.find((t) => t.id === leave.category_id);
        return type?.default_chargeable ? "Chargeable" : "Non-Chargeable";
    };

    return (
        <AppLayout>
            <div className="py-10 space-y-8 px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">My Leave Requests</h1>
                    <Link href="/leaves/new">
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 dark:bg-zinc-50 dark:text-zinc-900">
                            <Plus className="h-4 w-4" />
                            New Request
                        </Button>
                    </Link>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-zinc-500 font-semibold w-[200px]">Type</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Dates</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Duration</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Status</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-semibold">Billing</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading leaves...
                                        </TableCell>
                                    </TableRow>
                                ) : leaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No leave requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedLeaves.map((leave) => (
                                        <TableRow
                                            key={leave.id}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                                            onClick={() => window.location.href = `/leaves/${leave.id}`}
                                        >
                                            <TableCell className="font-medium">
                                                {getLeaveTypeName(leave.category_id)}
                                            </TableCell>
                                            <TableCell>
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
                                                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                    }
                                                >
                                                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1).toLowerCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={getBillingStatus(leave) === "Chargeable" ? "text-red-600 font-medium" : "text-zinc-600 font-medium"}>
                                                    {getBillingStatus(leave)}
                                                </span>
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
