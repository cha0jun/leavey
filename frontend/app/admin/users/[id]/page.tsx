"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetUserByIdUsersUserIdGet, useUpdateUserDetailsUsersUserIdPatch } from "@/lib/api/users/users";
import { useListLeavesLeavesGet } from "@/lib/api/leaves/leaves";
import { UserRole } from "@/lib/api/index.schemas";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    ChevronLeft,
    User,
    Mail,
    Shield,
    Building2,
    Users,
    CalendarDays,
    History,
    MoreVertical
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LEAVE_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = parseInt(params.id as string);
    const queryClient = useQueryClient();

    const { data: user, isLoading: userLoading } = useGetUserByIdUsersUserIdGet(userId);
    const { data: leaves = [], isLoading: leavesLoading } = useListLeavesLeavesGet({ user_id: userId });

    const updateMutation = useUpdateUserDetailsUsersUserIdPatch();

    const handleRoleChange = async (newRole: UserRole) => {
        try {
            await updateMutation.mutateAsync({
                userId,
                data: { role: newRole }
            });
            queryClient.invalidateQueries({ queryKey: [`/users/${userId}`] });
            queryClient.invalidateQueries({ queryKey: [`/users/`] });
        } catch (err) {
            console.error(err);
        }
    };

    if (userLoading) {
        return (
            <AppLayout>
                <div className="p-10 flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" />
                    <p className="text-zinc-500 font-medium">Loading user profile...</p>
                </div>
            </AppLayout>
        );
    }

    if (!user) {
        return (
            <AppLayout>
                <div className="p-10 text-center">
                    <h2 className="text-xl font-bold">User not found</h2>
                    <Button variant="link" onClick={() => router.push("/admin/users")}>
                        Back to Directory
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="py-10 space-y-8 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit -ml-2 text-zinc-500 hover:text-zinc-900"
                        onClick={() => router.push("/admin/users")}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Directory
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
                                {user.full_name?.charAt(0)}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{user.full_name}</h1>
                                <p className="text-zinc-500 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Badge
                                variant="secondary"
                                className={
                                    user.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-700 h-7"
                                        : user.role === "MANAGER"
                                            ? "bg-blue-100 text-blue-700 h-7"
                                            : "bg-zinc-100 text-zinc-700 h-7"
                                }
                            >
                                {user.role}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Profile */}
                    <div className="lg:col-span-1 space-y-8">
                        <Card className="border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-zinc-400" />
                                    Access Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Modify Role</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(["CONTRACTOR", "MANAGER", "ADMIN"] as UserRole[]).map((r) => (
                                            <Button
                                                key={r}
                                                variant={user.role === r ? "default" : "outline"}
                                                size="sm"
                                                className="justify-start font-medium"
                                                onClick={() => handleRoleChange(r)}
                                                disabled={updateMutation.isPending}
                                            >
                                                {r}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <Building2 className="h-4 w-4" />
                                            <span>Vendor ID</span>
                                        </div>
                                        <span className="font-mono text-sm font-bold">#{user.vendor_id || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <Users className="h-4 w-4" />
                                            <span>Department</span>
                                        </div>
                                        <span className="text-sm font-bold">{user.department || "General"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-zinc-500">History</p>
                                        <p className="text-2xl font-bold">{leaves.length}</p>
                                    </div>
                                    <History className="h-8 w-8 text-zinc-200 dark:text-zinc-800" />
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Total leave requests submitted by this user since account creation.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Leave History */}
                    <div className="lg:col-span-2">
                        <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden h-full">
                            <CardHeader className="border-b pb-4 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-zinc-400" />
                                    Leave History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-zinc-50/30 dark:bg-zinc-900/30">
                                            <TableHead className="px-6">Type</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right px-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leavesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-zinc-400">
                                                    Loading history...
                                                </TableCell>
                                            </TableRow>
                                        ) : leaves.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-zinc-400 italic">
                                                    No leave requests found for this user.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            leaves.map((leave) => (
                                                <TableRow
                                                    key={leave.id}
                                                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/leaves/${leave.id}`)}
                                                >
                                                    <TableCell className="px-6 py-4 font-medium">
                                                        {LEAVE_TYPES.find(t => t.id === leave.category_id)?.name || "Leave"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                leave.status === "APPROVED"
                                                                    ? "bg-green-50 text-green-700 border-green-100"
                                                                    : leave.status === "REJECTED"
                                                                        ? "bg-red-50 text-red-700 border-red-100"
                                                                        : "bg-yellow-50 text-yellow-700 border-yellow-100"
                                                            }
                                                        >
                                                            {leave.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right px-6">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
