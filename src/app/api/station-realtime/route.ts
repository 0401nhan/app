import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  StationRealtimeData,
  buildStationRealtimeQuery,
  buildStationRealtimeUpsertQuery,
  validateTimestamp
} from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');

    const { query, values } = buildStationRealtimeQuery(stationId);
    const [rows] = await pool.execute(query, values);

    // If querying for a specific station but no data found
    if (stationId && (rows as any[]).length === 0) {
      // Check if station exists
      const [station] = await pool.execute(
        'SELECT id FROM station WHERE id = ?',
        [stationId]
      );

      if ((station as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Station not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching station realtime data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = body as StationRealtimeData;

    // Validate required fields
    if (!data.station_id || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: station_id, timestamp' },
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

    // Check if station exists
    const [station] = await pool.execute(
      'SELECT id FROM station WHERE id = ?',
      [data.station_id]
    );

    if ((station as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      );
    }

    // Validate numeric fields
    const numericFields = [
      'power_active',
      'power_reactive',
      'energy_today',
      'energy_total',
      'pr',
      'temperature',
      'irradiation'
    ];

    for (const field of numericFields) {
      const value = data[field as keyof StationRealtimeData];
      if (value !== undefined && typeof value !== 'number') {
        return NextResponse.json(
          { error: `Invalid ${field}: must be a number` },
          { status: 400 }
        );
      }
    }

    // Additional validation for percentage fields
    if (data.pr !== undefined && (data.pr < 0 || data.pr > 100)) {
      return NextResponse.json(
        { error: 'PR must be between 0 and 100' },
        { status: 400 }
      );
    }

    const { query, values } = buildStationRealtimeUpsertQuery(data);
    await pool.execute(query, values);

    return NextResponse.json({ 
      message: 'Station realtime data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating station realtime data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 