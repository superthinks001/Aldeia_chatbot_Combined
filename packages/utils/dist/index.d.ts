export declare const apiClient: {
    request<T>(endpoint: string, options?: RequestInit): Promise<T>;
    get<T>(endpoint: string): Promise<T>;
    post<T>(endpoint: string, data: any): Promise<T>;
    put<T>(endpoint: string, data: any): Promise<T>;
    delete<T>(endpoint: string): Promise<T>;
};
export declare const stringUtils: {
    truncate(str: string, maxLength: number): string;
    sanitize(str: string): string;
    generateId(): string;
};
export declare const dateUtils: {
    formatRelative(date: Date): string;
    formatDateTime(date: Date): string;
};
export declare const validation: {
    email(email: string): boolean;
    required(value: any): boolean;
    minLength(value: string, min: number): boolean;
};
