import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  validateTimeRange, 
  validateTimestamp,
  QueryParams,
  MPPTData,
  buildMPPTQuery,
  buildMPPTInsertQuery,
  buildMPPTUpdateQuery,
  buildMPPTDeleteQuery
} from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const inverterId = searchParams.get('inverterId');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const groupBy = searchParams.get('groupBy') as 'hour' | 'day' | 'month' | null;
    const sort = searchParams.get('sort');
    const order = searchParams.get('order') as 'asc' | 'desc' | null;

    if (!startDate || !endDate || !inverterId) {
      return NextResponse.json(
        { error: 'Missing required parameters: startDate, endDate, inverterId' },
        { status: 400 }
      );
    }

    if (!validateTimeRange(startDate, endDate)) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    const params: QueryParams = {
      startDate,
      endDate,
      page: Number(page),
      limit: Number(limit),
      groupBy,
      sort,
      order
    };

    const { query, values } = buildMPPTQuery(inverterId, params);

    // Get total count for pagination
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM MPPT WHERE inverter_id = ? AND timestamp BETWEEN ? AND ?',
      [inverterId, startDate, endDate]
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
    console.error('Error fetching MPPT data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inverterId, data } = body as { inverterId: string; data: MPPTData };

    if (!inverterId || !data || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: inverterId, timestamp' },
        { status: 400 }
      );
    }

    if (!validateTimestamp(data.timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    const { query, values } = buildMPPTInsertQuery(inverterId, data);

    await pool.execute(query, values);

    return NextResponse.json({ message: 'MPPT data inserted successfully' });
  } catch (error) {
    console.error('Error inserting MPPT data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { inverterId, timestamp, data } = body as { 
      inverterId: string; 
      timestamp: string;
      data: Partial<MPPTData>;
    };

    if (!inverterId || !timestamp || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: inverterId, timestamp, data' },
        { status: 400 }
      );
    }

    if (!validateTimestamp(timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    const { query, values } = buildMPPTUpdateQuery(inverterId, timestamp, data);

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified inverterId and timestamp' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'MPPT data updated successfully' });
  } catch (error) {
    console.error('Error updating MPPT data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inverterId = searchParams.get('inverterId');
    const timestamp = searchParams.get('timestamp');

    if (!inverterId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required parameters: inverterId, timestamp' },
        { status: 400 }
      );
    }

    if (!validateTimestamp(timestamp)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    const { query, values } = buildMPPTDeleteQuery(inverterId, timestamp);

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified inverterId and timestamp' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'MPPT data deleted successfully' });
  } catch (error) {
    console.error('Error deleting MPPT data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 