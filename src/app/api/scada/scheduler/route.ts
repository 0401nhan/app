import { NextResponse } from 'next/server';
import { startScadaScheduler, stopScadaScheduler } from '@/lib/scadaScheduler';

let isSchedulerRunning = false;

// Tự động khởi động scheduler khi server start
if (process.env.NODE_ENV === 'production' && !isSchedulerRunning) {
    console.log('🚀 Tự động khởi động SCADA scheduler khi server start...');
    startScadaScheduler();
    isSchedulerRunning = true;
}

export async function POST(request: Request) {
    try {
        const { action } = await request.json();

        if (action === 'start') {
            if (!isSchedulerRunning) {
                startScadaScheduler();
                isSchedulerRunning = true;
                return NextResponse.json({ 
                    success: true, 
                    message: 'SCADA scheduler started successfully' 
                });
            } else {
                return NextResponse.json({ 
                    success: false, 
                    message: 'SCADA scheduler is already running' 
                });
            }
        } else if (action === 'stop') {
            if (isSchedulerRunning) {
                stopScadaScheduler();
                isSchedulerRunning = false;
                return NextResponse.json({ 
                    success: true, 
                    message: 'SCADA scheduler stopped successfully' 
                });
            } else {
                return NextResponse.json({ 
                    success: false, 
                    message: 'SCADA scheduler is not running' 
                });
            }
        } else {
            return NextResponse.json({ 
                success: false, 
                message: 'Invalid action. Use "start" or "stop".' 
            }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
} 