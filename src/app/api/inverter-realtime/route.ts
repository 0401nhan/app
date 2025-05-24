import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  InverterRealtimeData,
  buildInverterRealtimeQuery,
  buildInverterRealtimeUpsertQuery,
  validateTimestamp
} from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inverterId = searchParams.get('inverterId');

    const { query, values } = buildInverterRealtimeQuery(inverterId);
    const [rows] = await pool.execute(query, values);

    // If querying for a specific inverter but no data found
    if (inverterId && (rows as any[]).length === 0) {
      // Check if inverter exists
      const [inverter] = await pool.execute(
        'SELECT id FROM inverter WHERE id = ?',
        [inverterId]
      );

      if ((inverter as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Inverter not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching inverter realtime data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = body as InverterRealtimeData;

    // Validate required fields
    if (!data.inverter_id || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: inverter_id, timestamp' },
        { status: 400 }
      );
    }

    // Validate timestamp format
    if (!validateTimestamp(data.timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    // Check if inverter exists
    const [inverter] = await pool.execute(
      'SELECT id FROM inverter WHERE id = ?',
      [data.inverter_id]
    );

    if ((inverter as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Inverter not found' },
        { status: 404 }
      );
    }

    // Validate numeric fields
    const numericFields = [
      'power_active',
      'power_reactive',
      'voltage',
      'current',
      'frequency',
      'power_factor',
      'temperature'
    ];

    for (const field of numericFields) {
      const value = data[field as keyof InverterRealtimeData];
      if (value !== undefined && typeof value !== 'number') {
        return NextResponse.json(
          { error: `Invalid ${field}: must be a number` },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildInverterRealtimeUpsertQuery(data);
    await pool.execute(query, values);

    return NextResponse.json({ 
      message: 'Inverter realtime data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating inverter realtime data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 