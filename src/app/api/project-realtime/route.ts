import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  ProjectRealtimeData,
  buildProjectRealtimeQuery,
  buildProjectRealtimeUpsertQuery,
  validateTimestamp
} from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const { query, values } = buildProjectRealtimeQuery(projectId);
    const [rows] = await pool.execute(query, values);

    // If querying for a specific project but no data found
    if (projectId && (rows as any[]).length === 0) {
      // Check if project exists
      const [project] = await pool.execute(
        'SELECT id FROM project WHERE id = ?',
        [projectId]
      );

      if ((project as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching project realtime data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = body as ProjectRealtimeData;

    // Validate required fields
    if (!data.project_id || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, timestamp' },
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

    // Check if project exists
    const [project] = await pool.execute(
      'SELECT id FROM project WHERE id = ?',
      [data.project_id]
    );

    if ((project as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
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
      'excess_power',
      'purchased_power',
      'excess_energy',
      'purchased_energy'
    ];

    for (const field of numericFields) {
      const value = data[field as keyof ProjectRealtimeData];
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

    // Additional validation for energy values
    if (data.energy_today !== undefined && data.energy_today < 0) {
      return NextResponse.json(
        { error: 'Energy today cannot be negative' },
        { status: 400 }
      );
    }

    if (data.energy_total !== undefined && data.energy_total < 0) {
      return NextResponse.json(
        { error: 'Energy total cannot be negative' },
        { status: 400 }
      );
    }

    const { query, values } = buildProjectRealtimeUpsertQuery(data);
    await pool.execute(query, values);

    return NextResponse.json({ 
      message: 'Project realtime data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating project realtime data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 