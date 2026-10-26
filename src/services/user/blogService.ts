import userApiClient from '../userApiClient';
import type { BlogItem } from '../admin/adminBlogService';

export type { BlogItem };

export const blogService = {
    /**
     * Fetches all published/active blogs from the public user endpoint.
     * Hits GET /api/user/blogs
     */
    async getActiveBlogs(): Promise<BlogItem[]> {
        const res = await userApiClient.get('/user/blogs');
        return res.data?.data || [];
    },

    /**
     * Fetches a single published/active blog by ID from the public user endpoint.
     * Hits GET /api/user/blogs/:id
     */
    async getBlogById(id: string): Promise<BlogItem | null> {
        if (!id || typeof id !== 'string') return null;
        const res = await userApiClient.get(`/user/blogs/${id}`);
        return res.data?.data || null;
    }
};
