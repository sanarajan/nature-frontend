import { getRoleFromPath } from "./RoleHelper";

export const getRedirectPathFromCurrentRoute = (): string => {
    const role = getRoleFromPath();
    if (role === 'admin') {
        return '/admin';
    }
    return '/login';
};
