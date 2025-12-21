import { useGetCurrentUserProfileUsersMeGet } from "@/lib/api/users/users";
import { UserRole } from "@/lib/api/index.schemas";

export const useAuth = () => {
    const { data: user, isLoading, error } = useGetCurrentUserProfileUsersMeGet();

    const role = user?.role;

    return {
        user,
        role,
        isLoading,
        error,
        isAdmin: role === UserRole.ADMIN,
        isManager: role === UserRole.MANAGER,
        isContractor: role === UserRole.CONTRACTOR,
        isStaff: role === UserRole.ADMIN || role === UserRole.MANAGER,
    };
};
