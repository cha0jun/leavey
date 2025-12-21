"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AXIOS_INSTANCE } from "@/lib/api/axios-instance";
import {
    useCreateLeaveRequestLeavesPost,
    useUpdateLeaveRequestLeavesLeaveIdPatch,
    useGetLeaveDetailLeavesLeaveIdGet
} from "@/lib/api/leaves/leaves";
import { LEAVE_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

function LeaveForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const leaveId = editId ? Number(editId) : 0;

    const { data: existingLeave, isFetching: isFetchingLeave } = useGetLeaveDetailLeavesLeaveIdGet(leaveId, {
        query: { enabled: !!editId }
    });

    const createMutation = useCreateLeaveRequestLeavesPost();
    const updateMutation = useUpdateLeaveRequestLeavesLeaveIdPatch();

    const [formData, setFormData] = useState({
        category_id: "",
        start_date: "",
        end_date: "",
        reason: "",
    });
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState("");

    // Populate form if editing
    useEffect(() => {
        if (existingLeave) {
            // Helper to format ISO string to YYYY-MM-DD
            const formatDate = (dateString: string) => {
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            setFormData({
                category_id: existingLeave.category_id.toString(),
                start_date: formatDate(existingLeave.start_date),
                end_date: formatDate(existingLeave.end_date),
                reason: existingLeave.reason || "",
            });
        }
    }, [existingLeave]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            if (!formData.category_id || !formData.start_date || !formData.end_date || !formData.reason) {
                throw new Error("Please fill in all required fields.");
            }

            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays <= 0 || isNaN(diffDays)) {
                throw new Error("Invalid date range.");
            }

            let submittedLeaveId: number;

            if (editId) {
                // UPDATE
                await updateMutation.mutateAsync({
                    leaveId: Number(editId),
                    data: {
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        total_days: diffDays,
                        reason: formData.reason,
                        category_id: Number(formData.category_id)
                    }
                });
                submittedLeaveId = Number(editId);
            } else {
                // CREATE
                const res = await createMutation.mutateAsync({
                    data: {
                        category_id: Number(formData.category_id),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        total_days: diffDays,
                        reason: formData.reason,
                    }
                });
                submittedLeaveId = res.id;
            }

            // Upload Files
            if (files.length > 0) {
                const uploadPromises = files.map(async (file) => {
                    const uploadData = new FormData();
                    uploadData.append("file", file);

                    await AXIOS_INSTANCE.post(`/leaves/${submittedLeaveId}/upload`, uploadData, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                });

                await Promise.all(uploadPromises);
            }

            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to submit leave");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const loading = createMutation.isPending || updateMutation.isPending;

    if (isFetchingLeave) {
        return <div className="text-center py-10">Loading form...</div>;
    }

    return (
        <AppLayout>
            <div className="py-10 px-6">
                <h1 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">
                    {editId ? "Edit Leave Request" : "New Leave Request"}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Section */}
                    <div className="lg:col-span-2">
                        <Card className="border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-900 dark:text-zinc-50">
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
                                            <SelectTrigger className="border-zinc-200 dark:border-zinc-700">
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
                                                className="border-zinc-200 dark:border-zinc-700"
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
                                                className="border-zinc-200 dark:border-zinc-700"
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
                                            className="min-h-[100px] border-zinc-200 dark:border-zinc-700"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Supporting Documents *</Label>
                                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-8 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer relative">
                                            <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                <UploadCloud className="h-8 w-8" />
                                                <div className="text-sm font-medium">
                                                    {files.length > 0
                                                        ? `${files.length} file(s) selected`
                                                        : "Drag and Drop files, or click to browse"}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                    {files.length > 0 ? (
                                                        <ul className="text-zinc-600 dark:text-zinc-300 mt-2">
                                                            {files.map((f, i) => <li key={i}>{f.name}</li>)}
                                                        </ul>
                                                    ) : (
                                                        <>Choose files<br />Maximum file size: 3MB. Supported formats: PDF, JPG</>
                                                    )}
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                            onClick={() => router.back()}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
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
                        <Card className="border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-900 dark:text-zinc-50 text-lg">Important Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-gray-600">
                                <p>- Leaves require documents</p>
                                <p>- Annual leaves must be applied 2 weeks in advance</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default function NewLeavePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeaveForm />
        </Suspense>
    );
}

