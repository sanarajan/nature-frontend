import apiClient from '../adminApiClient';

export interface BlogItem {
    _id: string;
    title: string;
    content?: string;
    description: string; // Rich Text HTML content
    imageUrl: string;
    image?: string;
    imagePublicId?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export const adminBlogService = {
    async getBlogs(): Promise<BlogItem[]> {
        const res = await apiClient.get('/admin/blogs');
        return res.data.data || [];
    },

    async getBlogById(id: string): Promise<BlogItem | null> {
        const res = await apiClient.get(`/admin/blogs/${id}`);
        return res.data.data || null;
    },

    async createBlog(payload: {
        title: string;
        description: string;
        imageUrl?: string;
        image?: string;
        fileData?: string;
        status?: 'active' | 'inactive';
    }): Promise<BlogItem> {
        const body: any = {
            title: payload.title.trim(),
            content: payload.description,
            status: payload.status || 'active'
        };

        if (payload.fileData) {
            body.fileData = payload.fileData;
        } else if (payload.imageUrl?.startsWith('data:')) {
            body.fileData = payload.imageUrl;
        } else if (payload.imageUrl) {
            body.imageUrl = payload.imageUrl;
        } else if (payload.image) {
            body.imageUrl = payload.image;
        }

        const res = await apiClient.post('/admin/blogs', body);
        return res.data.data;
    },

    async updateBlog(
        id: string,
        payload: {
            title?: string;
            description?: string;
            imageUrl?: string;
            image?: string;
            fileData?: string;
            status?: 'active' | 'inactive';
        }
    ): Promise<BlogItem> {
        const body: any = {};
        if (payload.title !== undefined) body.title = payload.title.trim();
        if (payload.description !== undefined) body.content = payload.description;
        if (payload.status !== undefined) body.status = payload.status;

        if (payload.fileData) {
            body.fileData = payload.fileData;
        } else if (payload.imageUrl?.startsWith('data:')) {
            body.fileData = payload.imageUrl;
        } else if (payload.imageUrl) {
            body.imageUrl = payload.imageUrl;
        } else if (payload.image) {
            body.imageUrl = payload.image;
        }

        const res = await apiClient.put(`/admin/blogs/${id}`, body);
        return res.data.data;
    },

    async deleteBlog(id: string): Promise<boolean> {
        const res = await apiClient.delete(`/admin/blogs/${id}`);
        return res.data.success;
    },

    async toggleStatus(id: string, newStatus?: 'active' | 'inactive'): Promise<BlogItem> {
        const res = await apiClient.patch(`/admin/blogs/${id}/toggle-status`, { status: newStatus });
        return res.data.data;
    }
};
