"use client";

import { useListUsersUsersGet, useUpdateUserDetailsUsersUserIdPatch } from "@/lib/api/users/users";
import { UserRead, UserRole } from "@/lib/api/index.schemas";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Shield, UserCog, Mail, Hash, X } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface EditUserModalProps {
    user: UserRead;
    onClose: () => void;
}

function EditUserModal({ user, onClose }: EditUserModalProps) {
    const [role, setRole] = useState<UserRole>(user.role);
    const [vendorId, setVendorId] = useState<string>(user.vendor_id?.toString() || "");
    const queryClient = useQueryClient();

    const mutation = useUpdateUserDetailsUsersUserIdPatch();

    const handleSave = async () => {
        try {
            await mutation.mutateAsync({
                userId: user.id,
                data: {
                    role,
                    vendor_id: vendorId ? parseInt(vendorId) : undefined
                }
            });
            queryClient.invalidateQueries({ queryKey: [`/users`] });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to update user");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-zinc-500" />
                        Edit Permissions
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{user.full_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-500">System Role</label>
                        <select
                            className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-zinc-900"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                        >
                            <option value="CONTRACTOR">Contractor</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                        <p className="text-[10px] text-zinc-400">Managers can approve leaves and view finance reports. Admins can also manage users.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-500">Vendor ID (Numerical)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 10045"
                            value={vendorId}
                            onChange={(e) => setVendorId(e.target.value)}
                            className="border-zinc-200 dark:border-zinc-800"
                        />
                        <p className="text-[10px] text-zinc-400">Required for correctly assigning billing in finance exports.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                        <Button className="flex-1 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900" onClick={handleSave} disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function UsersAdminPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const { data: users = [], isLoading: loading } = useListUsersUsersGet();
    const [editingUser, setEditingUser] = useState<UserRead | null>(null);

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="py-10 space-y-8 px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <Shield className="h-8 w-8 text-zinc-400" />
                        Workforce Management
                    </h1>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10 border-zinc-200 dark:border-zinc-800"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <TableHead className="text-zinc-500 font-semibold px-6">User</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Role</TableHead>
                                    <TableHead className="text-zinc-500 font-semibold">Vendor ID</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-semibold px-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            Loading user directory...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            No users matches your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.full_name}</span>
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {user.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        user.role === "ADMIN"
                                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                            : user.role === "MANAGER"
                                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.vendor_id ? (
                                                    <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                                        <Hash className="h-3 w-3" /> {user.vendor_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">Not Assigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                                    >
                                                        Manage
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                                                        onClick={() => setEditingUser(user)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                />
            )}
        </AppLayout>
    );
}
