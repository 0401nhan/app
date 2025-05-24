import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  PVModuleData,
  validatePVModuleData,
  buildPVModuleQuery,
  buildPVModuleInsertQuery,
  buildPVModuleUpdateQuery,
  buildPVModuleDeleteQuery
} from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const stationId = searchParams.get('stationId');
    const inverterId = searchParams.get('inverterId');

    const { query, values } = buildPVModuleQuery({
      projectId,
      stationId,
      inverterId
    });

    const [rows] = await pool.execute(query, values);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching PV module data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body as PVModuleData;

    // Validate data
    const validation = validatePVModuleData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if at least one parent ID is provided
    if (!data.project_id && !data.station_id && !data.inverter_id) {
      return NextResponse.json(
        { error: 'At least one of project_id, station_id, or inverter_id must be provided' },
        { status: 400 }
      );
    }

    const { query, values } = buildPVModuleInsertQuery(data);

    const [result] = await pool.execute(query, values);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      message: 'PV module created successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating PV module:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body as { id: string; data: Partial<PVModuleData> };

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Validate data
    const validation = validatePVModuleData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { query, values } = buildPVModuleUpdateQuery(id, data);

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No PV module found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'PV module updated successfully' });
  } catch (error) {
    console.error('Error updating PV module:', error);
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

    const { query, values } = buildPVModuleDeleteQuery(id);

    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No PV module found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'PV module deleted successfully' });
  } catch (error) {
    console.error('Error deleting PV module:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 