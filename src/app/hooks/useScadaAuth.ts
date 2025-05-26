import { useState } from 'react';
import axios from 'axios';
import qs from 'qs';

interface LoginResponse {
    success: boolean;
    message: string;
    cookies?: string[];
    error?: any;
}

export function useScadaAuth(): {
    isLoading: boolean;
    error: string | null;
    login: () => Promise<void>;
    logout: () => void;
} {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Bước 1: Lấy CSRF token
            const response = await axios.get('http://sol-scada.com/Home/Login', {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            // Tìm CSRF token
            const csrfTokenMatch = response.data.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
            if (!csrfTokenMatch) {
                throw new Error('Không tìm thấy token CSRF!');
            }
            const csrfToken = csrfTokenMatch[1];
            const initialCookies = response.headers['set-cookie'] || [];

            // Bước 2: Thực hiện đăng nhập
            const loginData = qs.stringify({
                username: 'O&M',
                password: 'O&M',
                __RequestVerificationToken: csrfToken
            });

            const loginResponse = await axios.post('http://sol-scada.com/Home/Login', loginData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'http://sol-scada.com/Home/Login',
                    'Cookie': initialCookies.join('; ')
                },
                maxRedirects: 0,
                validateStatus: status => status < 500
            });

            if (loginResponse.status !== 302) {
                throw new Error('Đăng nhập thất bại!');
            }

            // Lưu cookies
            const cookies = loginResponse.headers['set-cookie'] || initialCookies;
            // Có thể lưu cookies vào localStorage hoặc state management nếu cần
            
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        // Implement logout logic if needed
        // Ví dụ: xóa cookies, clear state, etc.
    };

    return {
        isLoading,
        error,
        login,
        logout
    };
} 