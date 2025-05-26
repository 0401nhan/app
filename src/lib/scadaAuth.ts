import axios from 'axios';
import qs from 'qs';

interface LoginResponse {
    success: boolean;
    message: string;
    cookies?: string[];
    error?: any;
}

class ScadaAuth {
    private LOGIN_URL: string;
    private cookies: string[] | null;

    constructor() {
        this.LOGIN_URL = process.env.NEXT_PUBLIC_SCADA_LOGIN_URL || 'http://sol-scada.com/Home/Login';
        this.cookies = null;
    }

    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            // Bước 1: Lấy CSRF token từ trang login
            const response = await axios.get(this.LOGIN_URL, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0' 
                } 
            });

            // Tìm CSRF token trong HTML response
            const csrfTokenMatch = response.data.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
            if (!csrfTokenMatch) {
                throw new Error('Không tìm thấy token CSRF!');
            }
            const csrfToken = csrfTokenMatch[1];
            const initialCookies = response.headers['set-cookie'] || [];

            // Bước 2: Thực hiện đăng nhập với CSRF token
            const loginData = qs.stringify({
                username,
                password,
                __RequestVerificationToken: csrfToken
            });

            const loginResponse = await axios.post(this.LOGIN_URL, loginData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': this.LOGIN_URL,
                    'Cookie': initialCookies.join('; ')
                },
                maxRedirects: 0,
                validateStatus: status => status < 500
            });

            // Kiểm tra kết quả đăng nhập
            if (loginResponse.status === 302) {
                this.cookies = loginResponse.headers['set-cookie'] || initialCookies;
                return {
                    success: true,
                    message: 'Đăng nhập thành công',
                    cookies: this.cookies
                };
            } else {
                throw new Error("Đăng nhập thất bại!");
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    isLoggedIn(): boolean {
        return this.cookies !== null;
    }

    getCookies(): string[] | null {
        return this.cookies;
    }

    logout(): void {
        this.cookies = null;
    }
}

// Export single instance
export const scadaAuth = new ScadaAuth();

// Export class for testing or custom instantiation
export default ScadaAuth; 