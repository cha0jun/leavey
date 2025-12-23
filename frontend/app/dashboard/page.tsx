"use client";

import Link from "next/link";
import { useListLeavesLeavesGet } from "@/lib/api/leaves/leaves";
import { CalendarClock, CheckCircle2, Wallet, ArrowRight, Users } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
    const { isStaff, isLoading: authLoading } = useAuth();
    const { data: leaves = [], isLoading: loading } = useListLeavesLeavesGet({ mine: false });
    const sortedLeaves = [...leaves].sort((a, b) => b.id - a.id);

    // Stats
    const pendingCount = sortedLeaves.filter(l => l.status === "PENDING").length;
    const approvedCount = sortedLeaves.filter(l => l.status === "APPROVED").length;
    const recentActivity = sortedLeaves.slice(0, 5);

    if (authLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <AppLayout>
            <div className="py-10 space-y-8 px-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    {isStaff && (
                        <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            Management View
                        </div>
                    )}
                </div>

                {/* Stats Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard
                        title={isStaff ? "Team Pending" : "My Pending Requests"}
                        value={pendingCount}
                        icon={CalendarClock}
                        description={isStaff ? "Waiting for review" : "Awaiting approval"}
                    />
                    <StatsCard
                        title={isStaff ? "Team Approved" : "My Approved Requests"}
                        value={approvedCount}
                        icon={CheckCircle2}
                        description={isStaff ? "Total team approvals" : "Total approved leaves"}
                    />
                </div>

                {/* Recent Activity Section */}
                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                    <div className="flex flex-col space-y-1.5 p-6 md:flex-row md:items-center md:justify-between border-b">
                        <h3 className="font-semibold leading-none tracking-tight text-xl">
                            {isStaff ? "Recent Team Activity" : "My Recent Activity"}
                        </h3>
                        <Link href={isStaff ? "/manage/leaves" : "/leaves"}>
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
                                    date={`${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`}
                                    description={isStaff ? `${leave.user?.full_name}: Leave Request ` : `Leave Request (${leave.total_days} days)`}
                                    status={leave.status}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

