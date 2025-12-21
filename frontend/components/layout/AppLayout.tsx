"use client";

import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";

export const AppLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Sidebar />
            <main className="flex-1 lg:pl-64">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
