"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { fetchClient } from "@/lib/api/client";
import { LEAVE_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

function LeaveForm() {
    const { getToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");

    const [formData, setFormData] = useState({
        category_id: "",
        start_date: "",
        end_date: "",
        reason: "",
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    // Fetch existing data if editing
    useEffect(() => {
        if (!editId) return;

        async function loadLeave() {
            setFetching(true);
            try {
                const token = await getToken();
                if (!token) return;
                const data = await fetchClient(`/leaves/${editId}`, {}, token);
                setFormData({
                    category_id: data.category_id.toString(),
                    start_date: data.start_date,
                    end_date: data.end_date,
                    reason: data.reason || "",
                });
            } catch (err) {
                console.error("Failed to load leave", err);
                setError("Failed to load leave details.");
            } finally {
                setFetching(false);
            }
        }
        loadLeave();
    }, [editId, getToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!formData.category_id || !formData.start_date || !formData.end_date || !formData.reason) {
                throw new Error("Please fill in all required fields.");
            }

            // Calculate days diff (simple approx for logic)
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays <= 0 || isNaN(diffDays)) {
                throw new Error("Invalid date range.");
            }

            const token = await getToken();
            if (!token) throw new Error("Not authenticated");

            if (editId) {
                // UPDATE
                await fetchClient(`/leaves/${editId}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        category_id: Number(formData.category_id),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        total_days: diffDays,
                        reason: formData.reason
                    }),
                }, token);
            } else {
                // CREATE
                await fetchClient("/leaves/", {
                    method: "POST",
                    body: JSON.stringify({
                        category_id: Number(formData.category_id),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        total_days: diffDays,
                        status: "PENDING",
                        cached_chargeable_status: false,
                        reason: formData.reason
                    }),
                }, token);
            }

            router.push("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to submit leave");
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="text-center py-10">Loading form...</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8 text-green-600">
                {editId ? "Edit Leave Request" : "New Leave Request"}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Section */}
                <div className="lg:col-span-2">
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="text-green-600">
                                {editId ? "Edit Request Details" : "New Leave Request"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="leave-type">Leave Type *</Label>
                                    <Select
                                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                        value={formData.category_id}
                                    >
                                        <SelectTrigger className="border-green-500">
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEAVE_TYPES.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-date">Start Date *</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            className="border-green-500"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-date">End Date *</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            className="border-green-500"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason *</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Provide details about your leave request"
                                        className="min-h-[100px] border-green-500"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Supporting Documents *</Label>
                                    <div className="border-2 border-dashed border-green-500 rounded-lg p-8 text-center hover:bg-green-50 transition-colors cursor-pointer">
                                        <div className="flex flex-col items-center gap-2 text-green-700">
                                            <UploadCloud className="h-8 w-8" />
                                            <div className="text-sm font-medium">
                                                Drag and Drop files, or click to browse
                                            </div>
                                            <div className="text-xs text-green-600">
                                                Choose files
                                                <br />
                                                Maximum file size: 3MB. Supported formats: PDF, JPG
                                            </div>
                                        </div>
                                        <input type="file" className="hidden" />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-green-500 text-green-700 hover:bg-green-50"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        disabled={loading}
                                    >
                                        {loading ? "Saving..." : (editId ? "Update Request" : "Submit Request")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-6">
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="text-green-600 text-lg">Leave Balance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Annual Leave</span>
                                <span className="text-sm font-bold text-green-700">12 Days</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Medical Leave</span>
                                <span className="text-sm font-bold text-green-700">8 Days</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Compassionate Leave</span>
                                <span className="text-sm font-bold text-green-700">20 Days</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="text-green-600 text-lg">Important Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-gray-600">
                            <p>- Leaves require documents</p>
                            <p>- Annual leaves must be applied 2 weeks in advance</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function NewLeavePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeaveForm />
        </Suspense>
    );
}

