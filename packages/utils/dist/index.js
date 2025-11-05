// API utilities
export const apiClient = {
    async request(endpoint, options = {}) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return response.json();
    },
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};
// String utilities
export const stringUtils = {
    truncate(str, maxLength) {
        return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
    },
    sanitize(str) {
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },
    generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },
};
// Date utilities
export const dateUtils = {
    formatRelative(date) {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        if (diffInMinutes < 1)
            return 'just now';
        if (diffInMinutes < 60)
            return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24)
            return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    },
    formatDateTime(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
};
// Validation utilities
export const validation = {
    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    required(value) {
        return value !== null && value !== undefined && value !== '';
    },
    minLength(value, min) {
        return value.length >= min;
    },
};
