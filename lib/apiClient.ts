const API_URL = (import.meta as any).env.VITE_API_URL || ((import.meta as any).env.PROD ? '/api' : 'http://localhost:3005/api');

interface ApiOptions extends RequestInit {
    requiresAuth?: boolean;
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiCall<T = any>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
    };

    // Add auth token if required
    if (requiresAuth) {
        const token = localStorage.getItem('supabase_access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Ensure endpoint starts with slash
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new ApiError(response.status, error.error || error.message || 'Request failed');
    }

    return response.json();
}

// Convenience methods
export const api = {
    get: <T = any>(endpoint: string) =>
        apiCall<T>(endpoint, { method: 'GET' }),

    post: <T = any>(endpoint: string, data: any) =>
        apiCall<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),

    patch: <T = any>(endpoint: string, data: any) =>
        apiCall<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: <T = any>(endpoint: string) =>
        apiCall<T>(endpoint, { method: 'DELETE' }),
};

// Global error handler setup (call this in main.tsx)
export function setupApiInterceptors() {
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason instanceof ApiError && event.reason.status === 401) {
            // Token expired, redirect to login
            localStorage.removeItem('supabase_access_token');
            localStorage.removeItem('cmms_user');
            window.location.href = '/login';
        }
    });
}
