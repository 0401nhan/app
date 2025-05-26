import cron, { ScheduledTask } from 'node-cron';
import { scadaService } from './scadaService';

let scheduledTask: ScheduledTask | null = null;
let intervalId: NodeJS.Timeout | null = null;

// Chạy cập nhật dữ liệu mỗi 5 giây
export function startScadaScheduler() {
    console.log('🚀 Khởi động SCADA data scheduler');
    
    // Chạy lần đầu ngay lập tức
    scadaService.updateAllScadaData().catch(error => {
        console.error(`[${new Date().toISOString()}] ❌ Lỗi khi cập nhật dữ liệu SCADA:`, error);
    });

    // Sau đó chạy mỗi 5 giây
    intervalId = setInterval(async () => {
        console.log(`\n[${new Date().toISOString()}] 🔄 Bắt đầu cập nhật dữ liệu SCADA`);
        
        try {
            await scadaService.updateAllScadaData();
            console.log(`[${new Date().toISOString()}] ✅ Hoàn thành cập nhật dữ liệu SCADA`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Lỗi khi cập nhật dữ liệu SCADA:`, error);
        }
    }, 5000); // 5 seconds
}

// Export hàm dừng scheduler
export function stopScadaScheduler() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('⏹️ Đã dừng SCADA data scheduler');
    }
} 