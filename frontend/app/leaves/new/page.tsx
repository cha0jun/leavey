"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchClient } from "@/lib/api/client";
import { LEAVE_TYPES } from "@/lib/constants";

export default function NewLeavePage() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        category_id: 1,
        start_date: "",
        end_date: "",
        reason: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedType = LEAVE_TYPES.find(t => t.id === Number(formData.category_id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Calculate days diff (simple approx for logic)
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const token = await getToken();
            if (!token) throw new Error("Not authenticated");

            await fetchClient("/leaves/", {
                method: "POST",
                body: JSON.stringify({
                    // user_id removed, backend infers from token
                    category_id: formData.category_id,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    total_days: diffDays,
                    status: "PENDING",
                    cached_chargeable_status: false,
                    reason: formData.reason
                }),
            }, token);

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to submit leave");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Submit Leave Application</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    >
                        {LEAVE_TYPES.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                    {selectedType && (
                        <p className="text-xs mt-1 text-gray-500">
                            Policy: {selectedType.default_chargeable ?
                                <span className="text-red-600 font-bold">Chargeable</span> :
                                <span className="text-green-600 font-bold">Non-Chargeable</span>
                            }
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        rows={3}
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
}
