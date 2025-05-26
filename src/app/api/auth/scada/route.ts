import { NextResponse } from 'next/server';
import { scadaAuth } from '@/lib/scadaAuth';

export async function POST(request: Request) {
    try {
        // Lấy thông tin đăng nhập từ request body
        const { username, password } = await request.json();

        // Validate input
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username và password là bắt buộc' },
                { status: 400 }
            );
        }

        const loginResult = await scadaAuth.login(username, password);
        
        if (loginResult.success) {
            // Trả về cookies trong response headers
            const response = NextResponse.json(
                { success: true, message: loginResult.message },
                { status: 200 }
            );

            // Thêm cookies vào response
            if (loginResult.cookies) {
                loginResult.cookies.forEach(cookie => {
                    response.headers.append('Set-Cookie', cookie);
                });
            }

            return response;
        } else {
            return NextResponse.json(
                { success: false, message: loginResult.message },
                { status: 401 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
} 