"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarDays,
    ClipboardList,
    Users,
    BarChart3,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const SidebarItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
            active
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        )}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </Link>
);

export const Sidebar = () => {
    const pathname = usePathname();
    const { isStaff, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/leaves", icon: CalendarDays, label: "My Leaves" },
    ];

    if (isStaff) {
        menuItems.push({ href: "/manage/leaves", icon: ClipboardList, label: "Review Leaves" });
        menuItems.push({ href: "/finance", icon: BarChart3, label: "Reports" });
    }

    if (isAdmin) {
        menuItems.push({ href: "/admin/users", icon: Users, label: "Users & Roles" });
    }

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between px-6 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-50">
                <div className="font-bold text-xl tracking-tight">Leavey</div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </header>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-full w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-50 transition-transform lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="p-6">
                        <div className="font-bold text-2xl tracking-tight mb-8">Leavey</div>

                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    active={pathname === item.href}
                                />
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-6 border-t border-zinc-200 dark:border-zinc-800">
                        <SignOutButton>
                            <button className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </aside>
        </>
    );
};
