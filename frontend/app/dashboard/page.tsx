"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchClient } from "@/lib/api/client";
import { CalendarClock, CheckCircle2, Wallet, Plus, ArrowRight } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { Button } from "@/components/ui/button";

// Types
interface LeaveRequest {
    id: number;
    category_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
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
                if (!token) return;

                const data = await fetchClient("/leaves/", {}, token);
                // Sort by ID desc (newest first)
                data.sort((a: LeaveRequest, b: LeaveRequest) => b.id - a.id);
                setLeaves(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadLeaves();
    }, [isLoaded, isSignedIn, getToken]);

    // Stats
    const pendingCount = leaves.filter(l => l.status === "PENDING").length;
    const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
    // const remainingBalance = 18; // Hardcoded for now as API doesn't support it

    const recentActivity = leaves.slice(0, 5); // Show top 5

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* Stats Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    title="Pending Requests"
                    value={pendingCount}
                    icon={CalendarClock}
                    description="Awaiting approval"
                />
                <StatsCard
                    title="Approved Requests"
                    value={approvedCount}
                    icon={CheckCircle2}
                    description="Total approved leaves"
                />
                <StatsCard
                    title="Remaining Balance"
                    value="18 Days"
                    icon={Wallet}
                    description="Annual leave balance"
                />
            </div>

            {/* Recent Activity Section */}
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6 md:flex-row md:items-center md:justify-between border-b">
                    <h3 className="font-semibold leading-none tracking-tight text-xl">Recent Activity</h3>
                    <Link href="/leaves">
                        <Button variant="outline" className="gap-2">
                            View All
                        </Button>
                    </Link>
                </div>
                <div className="p-6 pt-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading activity...</div>
                    ) : recentActivity.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No recent activity.</div>
                    ) : (
                        recentActivity.map((leave) => (
                            <ActivityItem
                                key={leave.id}
                                date={`${leave.start_date} - ${leave.end_date}`}
                                description={`Leave Request #${leave.id} (${leave.total_days} days)`}
                                status={leave.status}
                            />
                        ))
                    )}
                </div>
                <div className="flex items-center p-6 pt-0 border-t bg-muted/50">
                    <div className="w-full flex justify-end py-4">
                        <Button variant="ghost" className="gap-2">
                            View All <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

