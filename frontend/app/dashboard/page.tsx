"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchClient } from "@/lib/api/client";

// Types (Manually defined since no Orval generation)
interface LeaveRequest {
    id: number;
    category_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    status: "PENDING" | "APPROVED" | "REJECTED"; // Uppercase now
    cached_chargeable_status: boolean;
}

export default function Dashboard() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLeaves() {
            if (!isLoaded || !isSignedIn) return;

            try {
                const token = await getToken();
                if (!token) return; // Should handle this better

                const data = await fetchClient("/leaves/", {}, token);
                setLeaves(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadLeaves();
    }, [isLoaded, isSignedIn, getToken]);

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Leave Dashboard</h1>
                <Link
                    href="/leaves/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Application
                </Link>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Dates
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Type (ID)
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Days
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Chargeable
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                        ) : leaves.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">No leave requests found.</td></tr>
                        ) : (
                            leaves.map((leave) => (
                                <tr key={leave.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {leave.start_date} to {leave.end_date}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {leave.category_id}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {leave.total_days}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {leave.cached_chargeable_status ?
                                            <span className="text-red-500 font-semibold">Yes (Billable)</span> :
                                            <span className="text-green-600">No (Non-Chargeable)</span>
                                        }
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
