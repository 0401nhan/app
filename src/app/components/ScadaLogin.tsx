import { useScadaAuth } from '../hooks/useScadaAuth';

export default function ScadaLogin() {
    const { isLoading, error, login } = useScadaAuth();

    const handleLogin = async () => {
        try {
            await login();
            // Redirect hoặc xử lý sau khi đăng nhập thành công
        } catch (err) {
            // Error đã được xử lý trong hook
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">SOL SCADA Login</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className={`w-full py-2 px-4 rounded ${
                        isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-semibold`}
                >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </div>
        </div>
    );
} 