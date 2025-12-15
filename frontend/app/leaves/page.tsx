"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/api/client";
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

export default function LeavesPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [leaves, setLeaves] = useState<LeaveRequestRead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLeaves() {
            if (!isLoaded || !isSignedIn) return;

            try {
                const token = await getToken();
                if (!token) return;

                const data = await fetchClient("/leaves/", {}, token);
                // Sort by ID desc (newest first)
                data.sort((a: LeaveRequestRead, b: LeaveRequestRead) => b.id - a.id);
                setLeaves(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadLeaves();
    }, [isLoaded, isSignedIn, getToken]);

    const getLeaveTypeName = (categoryId: number) => {
        return LEAVE_TYPES.find((t) => t.id === categoryId)?.name || "Unknown";
    };

    const getBillingStatus = (leave: LeaveRequestRead) => {
        // Prioritize cached status if available (though type definition might allow null, logic suggests it's boolean)
        // If not, fallback to leave type default
        if (leave.cached_chargeable_status !== undefined) {
            return leave.cached_chargeable_status ? "Chargeable" : "Non-Chargeable";
        }
        const type = LEAVE_TYPES.find((t) => t.id === leave.category_id);
        return type?.default_chargeable ? "Chargeable" : "Non-Chargeable";
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-green-600">My Leave Request</h1>
                <Link href="/leaves/new">
                    <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        New Request
                    </Button>
                </Link>
            </div>

            <Card className="border-green-500 border-2">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-green-700 font-semibold w-[200px]">Type</TableHead>
                                <TableHead className="text-green-700 font-semibold">Dates</TableHead>
                                <TableHead className="text-green-700 font-semibold">Duration</TableHead>
                                <TableHead className="text-green-700 font-semibold">Status</TableHead>
                                <TableHead className="text-right text-green-700 font-semibold">Billing</TableHead>
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
                                leaves.map((leave) => (
                                    <TableRow key={leave.id} className="hover:bg-green-50/50 cursor-pointer" onClick={() => window.location.href = `/leaves/${leave.id}`}>
                                        <TableCell className="font-medium">
                                            {getLeaveTypeName(leave.category_id)}
                                        </TableCell>
                                        <TableCell>
                                            {leave.start_date} - {leave.end_date}
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
                                            <span className={getBillingStatus(leave) === "Chargeable" ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
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
    );
}
