"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/api/index.schemas";
import { ReactNode } from "react";

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: UserRole[];
    fallback?: ReactNode;
}

export const RoleGuard = ({ children, allowedRoles, fallback = null }: RoleGuardProps) => {
    const { role, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (!role || !allowedRoles.includes(role)) {
        return fallback;
    }

    return <>{children}</>;
};
