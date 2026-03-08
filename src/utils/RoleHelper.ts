export const getRoleFromPath = (): string | null => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
        return 'admin';
    }
    // Default to null or 'user' based on your requirement. 
    // Let's return 'admin' for admin paths and 'user' for others if authenticated as user.
    if (path === '/login' || path === '/register' || path === '/' || path.startsWith('/shop')) {
        return 'user';
    }
    return null;
};
