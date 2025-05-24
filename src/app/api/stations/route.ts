import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  StationData,
  buildStationQuery,
  buildStationInsertQuery,
  buildStationUpdateQuery,
  buildStationDeleteQuery
} from '@/lib/utils';

export async function GET() {
  try {
    const { query, values } = buildStationQuery();
    const [rows] = await pool.execute(query, values);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body as StationData;

    // Validate required fields
    if (!data.name || !data.id_station_platform) {
      return NextResponse.json(
        { error: 'Missing required fields: name, id_station_platform' },
        { status: 400 }
      );
    }

    // Check if station platform ID already exists
    const [existingStations] = await pool.execute(
      'SELECT id FROM station WHERE id_station_platform = ?',
      [data.id_station_platform]
    );

    if ((existingStations as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Station platform ID already exists' },
        { status: 400 }
      );
    }

    // Validate project_id if provided
    if (data.project_id) {
      const [project] = await pool.execute(
        'SELECT id FROM project WHERE id = ?',
        [data.project_id]
      );

      if ((project as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildStationInsertQuery(data);
    const [result] = await pool.execute(query, values);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      message: 'Station created successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating station:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body as { id: string; data: Partial<StationData> };

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // If updating id_station_platform, check if it already exists
    if (data.id_station_platform) {
      const [existingStations] = await pool.execute(
        'SELECT id FROM station WHERE id_station_platform = ? AND id != ?',
        [data.id_station_platform, id]
      );

      if ((existingStations as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Station platform ID already exists' },
          { status: 400 }
        );
      }
    }

    // Validate project_id if provided
    if (data.project_id) {
      const [project] = await pool.execute(
        'SELECT id FROM project WHERE id = ?',
        [data.project_id]
      );

      if ((project as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildStationUpdateQuery(id, data);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No station found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Station updated successfully' });
  } catch (error) {
    console.error('Error updating station:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Check if station has any related records
    const [relatedRecords] = await pool.execute(`
      SELECT COUNT(*) as total FROM inverter WHERE station_id = ?
    `, [id]);

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete station with associated inverters' },
        { status: 400 }
      );
    }

    const { query, values } = buildStationDeleteQuery(id);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No station found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 