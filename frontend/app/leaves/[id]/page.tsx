"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/api/client";
import { LeaveRequestRead } from "@/lib/api/index.schemas";
import { LEAVE_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, FileText } from "lucide-react";
import Link from "next/link";

export default function LeaveDetailsPage() {
    const { id } = useParams();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    const [leave, setLeave] = useState<LeaveRequestRead | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !id) return;

        async function loadLeave() {
            try {
                const token = await getToken();
                if (!token) return;
                const data = await fetchClient(`/leaves/${id}`, {}, token);
                setLeave(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load leave details.");
            } finally {
                setLoading(false);
            }
        }
        loadLeave();
    }, [isLoaded, isSignedIn, getToken, id]);

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this request?")) return;

        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            // Using PATCH to update status
            await fetchClient(`/leaves/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: "CANCELLED" })
            }, token);

            // Refetch or update local state
            setLeave(prev => prev ? { ...prev, status: "CANCELLED" } : null);
        } catch (err) {
            console.error("Failed to cancel leave", err);
            alert("Failed to cancel leave request.");
        } finally {
            setActionLoading(false);
        }
    };

    const getLeaveTypeName = (categoryId: number) => {
        return LEAVE_TYPES.find((t) => t.id === categoryId)?.name || "Unknown";
    };

    if (!isLoaded || loading) {
        return <div className="container mx-auto py-10 text-center">Loading details...</div>;
    }

    if (error || !leave) {
        return (
            <div className="container mx-auto py-10">
                <div className="text-red-600 mb-4">{error || "Leave request not found."}</div>
                <Link href="/leaves">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                </Link>
            </div>
        );
    }

    const isPending = leave.status === "PENDING";
    const billingStatus = leave.cached_chargeable_status !== undefined
        ? (leave.cached_chargeable_status ? "Chargeable" : "Non-Chargeable")
        : (LEAVE_TYPES.find((t) => t.id === leave.category_id)?.default_chargeable ? "Chargeable" : "Non-Chargeable");

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <div className="flex items-center mb-6">
                <Link href="/leaves" className="mr-4">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-green-700">View Request</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details Card */}
                <div className="md:col-span-2">
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="text-green-600 flex justify-between items-center">
                                <span>{getLeaveTypeName(leave.category_id)} Request</span>
                                <span className="text-xs text-gray-400 font-normal">ID: LR-{new Date().getFullYear()}-{leave.id.toString().padStart(3, '0')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Leave Type</div>
                                    <div className="font-medium text-green-800">{getLeaveTypeName(leave.category_id)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Request ID</div>
                                    <div className="font-medium">LR-{new Date().getFullYear()}-{leave.id.toString().padStart(3, '0')}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Start Date</div>
                                    <div className="font-medium text-green-700 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {leave.start_date}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">End Date</div>
                                    <div className="font-medium text-green-700 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {leave.end_date}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Duration</div>
                                    <div className="font-medium flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {leave.total_days} days
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Billing Status</div>
                                    <div className={billingStatus === "Chargeable" ? "font-medium text-green-600" : "font-medium text-green-600"}>
                                        {billingStatus}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason</div>
                                <div className="text-gray-900 bg-gray-50 p-3 rounded-md border text-sm">
                                    {leave.reason || "No reason provided."}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Attachments</div>
                                <div className="border border-green-200 rounded p-2 flex items-center gap-2 text-green-700 text-sm">
                                    <FileText className="h-4 w-4" />
                                    {/* Mock attachment since not implemented */}
                                    <span>medical_certificate.pdf</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Status & Actions Sidebar */}
                <div className="space-y-6">
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-600">Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500">Current Status</div>
                                <Badge
                                    variant="outline"
                                    className={`mt-1 text-sm ${leave.status === "APPROVED"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : leave.status === "REJECTED"
                                            ? "bg-red-100 text-red-800 border-red-200"
                                            : leave.status === "CANCELLED" // Handle new status
                                                ? "bg-gray-100 text-gray-800 border-gray-200"
                                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                        }`}
                                >
                                    {leave.status}
                                </Badge>
                            </div>

                            {/* Mock metadata */}
                            <div>
                                <div className="text-xs text-gray-500">Submitted On</div>
                                <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
                            </div>

                            <div className="pt-4 space-y-3">
                                {isPending && (
                                    <>
                                        <Link href={`/leaves/new?id=${leave.id}`} className="w-full block">
                                            <Button variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50">
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
