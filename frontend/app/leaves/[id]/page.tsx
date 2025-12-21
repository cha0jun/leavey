"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AXIOS_INSTANCE } from "@/lib/api/axios-instance";
import { useGetLeaveDetailLeavesLeaveIdGet, useProcessLeaveStatusLeavesLeaveIdProcessPost } from "@/lib/api/leaves/leaves";
import { LEAVE_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, FileText, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { LeaveStatus } from "@/lib/api/index.schemas";
import { formatDate } from "@/lib/utils";

export default function LeaveDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isStaff } = useAuth();
    const leaveId = Number(id);

    const { data: leave, isLoading: loading, error: queryError, refetch } = useGetLeaveDetailLeavesLeaveIdGet(leaveId, {
        query: { enabled: !!leaveId }
    });

    const processMutation = useProcessLeaveStatusLeavesLeaveIdProcessPost();

    const [actionLoading, setActionLoading] = useState(false);

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this request?")) return;

        setActionLoading(true);
        try {
            await AXIOS_INSTANCE.patch(`/leaves/${leaveId}`, { status: "CANCELLED" });
            refetch();
        } catch (err) {
            console.error("Failed to cancel leave", err);
            alert("Failed to cancel leave request.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcess = async (status: LeaveStatus) => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;

        try {
            await processMutation.mutateAsync({
                leaveId,
                params: { status }
            });
            refetch();
        } catch (err) {
            console.error(`Failed to ${status} leave`, err);
            alert(`Failed to ${status.toLowerCase()} leave request.`);
        }
    };

    const handleDownload = async (docId: number, filename: string) => {
        try {
            const res = await AXIOS_INSTANCE.get(`/leaves/documents/${docId}/download`, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download error", err);
            alert("Failed to download file");
        }
    };

    const getLeaveTypeName = (categoryId: number) => {
        return LEAVE_TYPES.find((t) => t.id === categoryId)?.name || "Unknown";
    };

    if (loading) {
        return <div className="container mx-auto py-10 text-center">Loading details...</div>;
    }

    if (queryError || !leave) {
        return (
            <AppLayout>
                <div className="py-10 px-6">
                    <div className="text-red-600 mb-4">{"Leave request not found."}</div>
                    <Link href="/leaves">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const isPending = leave.status === "PENDING";
    const billingStatus = leave.cached_chargeable_status !== undefined
        ? (leave.cached_chargeable_status ? "Chargeable" : "Non-Chargeable")
        : (LEAVE_TYPES.find((t) => t.id === leave.category_id)?.default_chargeable ? "Chargeable" : "Non-Chargeable");

    return (
        <AppLayout>
            <div className="py-10 px-6 max-w-4xl mx-auto">
                <div className="flex items-center mb-6">
                    <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">View Request</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Details Card */}
                    <div className="md:col-span-2">
                        <Card className="border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-900 dark:text-zinc-50 flex justify-between items-center">
                                    <span>{getLeaveTypeName(leave.category_id)} Request</span>
                                    <span className="text-xs text-zinc-400 font-normal">ID: LR-{new Date().getFullYear()}-{leave.id.toString().padStart(3, '0')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isStaff && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                {leave.user?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold">{leave.user?.full_name}</div>
                                                <div className="text-xs text-zinc-500">{leave.user?.email}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-blue-100/50 text-blue-700">Contractor</Badge>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase font-semibold">Leave Type</div>
                                        <div className="font-medium text-zinc-800 dark:text-zinc-50">{getLeaveTypeName(leave.category_id)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase font-semibold">Request ID</div>
                                        <div className="font-medium">LR-{new Date().getFullYear()}-{leave.id.toString().padStart(3, '0')}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase font-semibold">Start Date</div>
                                        <div className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {formatDate(leave.start_date)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase font-semibold">End Date</div>
                                        <div className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {formatDate(leave.end_date)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase font-semibold">Duration</div>
                                        <div className="font-medium flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {leave.total_days} days
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase font-semibold">Billing Status</div>
                                        <div className={billingStatus === "Chargeable" ? "font-medium text-zinc-600 dark:text-zinc-400" : "font-medium text-zinc-600 dark:text-zinc-400"}>
                                            {billingStatus}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Reason</div>
                                    <div className="text-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm">
                                        {leave.reason || "No reason provided."}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Attachments</div>
                                    {leave.documents && leave.documents.length > 0 ? (
                                        <div className="space-y-2">
                                            {leave.documents.map((doc: any) => (
                                                <div key={doc.id}
                                                    className="border border-zinc-200 dark:border-zinc-700 rounded p-2 flex items-center justify-between text-zinc-700 dark:text-zinc-300 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                                                    onClick={() => handleDownload(doc.id, doc.filename)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span>{doc.filename}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs">Download</Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-zinc-400 italic">No files attached.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Status & Actions Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-xs text-zinc-500">Current Status</div>
                                    <Badge
                                        variant="outline"
                                        className={`mt-1 text-sm ${leave.status === "APPROVED"
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : leave.status === "REJECTED"
                                                ? "bg-red-100 text-red-800 border-red-200"
                                                : leave.status === "CANCELLED"
                                                    ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            }`}
                                    >
                                        {leave.status}
                                    </Badge>
                                </div>

                                <div>
                                    <div className="text-xs text-zinc-500">Submitted On</div>
                                    <div className="text-sm font-medium">{formatDate(leave.created_at)}</div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    {isPending && !isStaff && (
                                        <>
                                            <Link href={`/leaves/new?id=${leave.id}`} className="w-full block">
                                                <Button variant="outline" className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:text-zinc-300">
                                                    Edit Request
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="outline"
                                                className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-400"
                                                onClick={handleCancel}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? "Cancelling..." : "Cancel Request"}
                                            </Button>
                                        </>
                                    )}

                                    {isPending && isStaff && (
                                        <>
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                                                onClick={() => handleProcess("APPROVED")}
                                                disabled={processMutation.isPending}
                                            >
                                                <CheckCircle className="h-4 w-4" /> Approve
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
                                                onClick={() => handleProcess("REJECTED")}
                                                disabled={processMutation.isPending}
                                            >
                                                <XCircle className="h-4 w-4" /> Reject
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
