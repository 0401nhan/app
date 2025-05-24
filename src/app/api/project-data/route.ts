import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateTimeRange, buildTimeSeriesQuery, QueryParams, TimeSeriesData, validateTimestamp, buildInsertQuery, buildUpdateQuery, buildDeleteQuery } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const groupBy = searchParams.get('groupBy');
    const sort = searchParams.get('sort');
    const order = searchParams.get('order') as 'asc' | 'desc';

    if (!startDate || !endDate || !projectId) {
      return NextResponse.json(
        { error: 'Missing required parameters: startDate, endDate, projectId' },
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
      'project_id',
      'power_active',
      'power_reactive',
      'energy',
      'pr',
      'ambient_temperature',
      'pvmodule_temperature',
      'irradiation',
      'excess_power',
      'purchased_power',
      'excess_energy',
      'purchased_energy'
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
      'project_data',
      'project_id',
      projectId,
      metrics,
      params
    );

    // Get total count for pagination
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM project_data WHERE project_id = ? AND timestamp BETWEEN ? AND ?',
      [projectId, startDate, endDate]
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
    console.error('Error fetching project data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, data } = body as { projectId: string; data: TimeSeriesData };

    if (!projectId || !data || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, timestamp' },
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
      'project_data',
      'project_id',
      projectId,
      data
    );

    await pool.execute(query, values);

    return NextResponse.json({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error inserting project data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { projectId, timestamp, data } = body as { 
      projectId: string; 
      timestamp: string;
      data: Partial<TimeSeriesData>;
    };

    if (!projectId || !timestamp || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, timestamp, data' },
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
      'project_data',
      'project_id',
      projectId,
      timestamp,
      data
    );

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified projectId and timestamp' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating project data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const timestamp = searchParams.get('timestamp');

    if (!projectId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectId, timestamp' },
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
      'project_data',
      'project_id',
      projectId,
      timestamp
    );

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified projectId and timestamp' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting project data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 