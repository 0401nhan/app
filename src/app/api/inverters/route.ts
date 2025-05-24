import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  InverterData,
  buildInverterQuery,
  buildInverterInsertQuery,
  buildInverterUpdateQuery,
  buildInverterDeleteQuery
} from '@/lib/utils';

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        i.*,
        s.name as station_name,
        s.project_id,
        p.name as project_name
      FROM inverter i
      LEFT JOIN station s ON i.station_id = s.id
      LEFT JOIN project p ON s.project_id = p.id
      ORDER BY i.id ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching inverters:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body as InverterData;

    // Validate required fields
    if (!data.inverter_id_platform) {
      return NextResponse.json(
        { error: 'Missing required field: inverter_id_platform' },
        { status: 400 }
      );
    }

    // Validate station_id if provided
    if (data.station_id) {
      const [station] = await pool.execute(
        'SELECT id FROM station WHERE id = ?',
        [data.station_id]
      );

      if ((station as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Station not found' },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildInverterInsertQuery(data);
    const [result] = await pool.execute(query, values);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      message: 'Inverter created successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating inverter:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body as { id: string; data: Partial<InverterData> };

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Validate station_id if provided
    if (data.station_id) {
      const [station] = await pool.execute(
        'SELECT id FROM station WHERE id = ?',
        [data.station_id]
      );

      if ((station as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Station not found' },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildInverterUpdateQuery(id, data);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No inverter found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Inverter updated successfully' });
  } catch (error) {
    console.error('Error updating inverter:', error);
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

    // Check if inverter has any related records
    const [relatedRecords] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM inverter_data WHERE inverter_id = ?) +
        (SELECT COUNT(*) FROM inverter_realtime WHERE inverter_id = ?) +
        (SELECT COUNT(*) FROM MPPT WHERE inverter_id = ?) as total
    `, [id, id, id]);

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete inverter with associated data' },
        { status: 400 }
      );
    }

    const { query, values } = buildInverterDeleteQuery(id);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No inverter found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Inverter deleted successfully' });
  } catch (error) {
    console.error('Error deleting inverter:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 