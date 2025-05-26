import { startScadaScheduler } from './scadaScheduler';

class ScadaInitializer {
    private static instance: ScadaInitializer;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): ScadaInitializer {
        if (!ScadaInitializer.instance) {
            ScadaInitializer.instance = new ScadaInitializer();
        }
        return ScadaInitializer.instance;
    }

    public initializeService() {
        // Kiểm tra xem có đang ở môi trường server không
        if (typeof window === 'undefined' && !this.isInitialized) {
            console.log('🚀 Khởi tạo SCADA service...');
            try {
                startScadaScheduler();
                this.isInitialized = true;
                console.log('✅ SCADA service đã được khởi tạo thành công');
            } catch (error) {
                console.error('❌ Lỗi khi khởi tạo SCADA service:', error);
            }
        }
    }

    public isServiceInitialized(): boolean {
        return this.isInitialized;
    }
}

export const scadaInitializer = ScadaInitializer.getInstance(); 