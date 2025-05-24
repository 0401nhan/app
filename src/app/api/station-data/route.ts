import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateTimeRange, buildTimeSeriesQuery, QueryParams, TimeSeriesData, validateTimestamp, buildInsertQuery, buildUpdateQuery, buildDeleteQuery } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const stationId = searchParams.get('stationId');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const groupBy = searchParams.get('groupBy');
    const sort = searchParams.get('sort');
    const order = searchParams.get('order') as 'asc' | 'desc';

    if (!startDate || !endDate || !stationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: startDate, endDate, stationId' },
        { status: 400 }
      );
    }

    if (!validateTimeRange(startDate, endDate)) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    const metrics = [
      'id',
      'station_id',
      'power_active',
      'power_reactive',
      'energy',
      'pr',
      'ambient_temperature',
      'pvmodule_temperature1',
      'pvmodule_temperature2',
      'irradiation',
      'excess_power',
      'purchased_power',
      'excess_energy',
      'purchased_energy',
      'acb_status'
    ];

    const params: QueryParams = {
      startDate,
      endDate,
      page: Number(page),
      limit: Number(limit),
      groupBy: groupBy as 'hour' | 'day' | 'month',
      sort,
      order
    };

    const { query, values } = buildTimeSeriesQuery(
      'station_data',
      'station_id',
      stationId,
      metrics,
      params
    );

    // Get total count for pagination
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM station_data WHERE station_id = ? AND timestamp BETWEEN ? AND ?',
      [stationId, startDate, endDate]
    );
    const total = (countResult as any)[0].total;

    const [rows] = await pool.execute(query, values);

    return NextResponse.json({
      data: rows,
      pagination: {
        total,
        page: params.page || 1,
        limit: params.limit || 20
      }
    });
  } catch (error) {
    console.error('Error fetching station data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stationId, data } = body as { stationId: string; data: TimeSeriesData };

    if (!stationId || !data || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: stationId, timestamp' },
        { status: 400 }
      );
    }

    if (!validateTimestamp(data.timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    const { query, values } = buildInsertQuery(
      'station_data',
      'station_id',
      stationId,
      data
    );

    await pool.execute(query, values);

    return NextResponse.json({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error inserting station data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { stationId, timestamp, data } = body as { 
      stationId: string; 
      timestamp: string;
      data: Partial<TimeSeriesData>;
    };

    if (!stationId || !timestamp || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: stationId, timestamp, data' },
        { status: 400 }
      );
    }

    if (!validateTimestamp(timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    const { query, values } = buildUpdateQuery(
      'station_data',
      'station_id',
      stationId,
      timestamp,
      data
    );

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified stationId and timestamp' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating station data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');
    const timestamp = searchParams.get('timestamp');

    if (!stationId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required parameters: stationId, timestamp' },
        { status: 400 }
      );
    }

    if (!validateTimestamp(timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    const { query, values } = buildDeleteQuery(
      'station_data',
      'station_id',
      stationId,
      timestamp
    );

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified stationId and timestamp' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting station data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 