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
    const inverterId = searchParams.get('inverterId');

    if (!inverterId) {
      // Nếu không có inverterId, trả về tất cả MPPTs
      const [rows] = await pool.execute('SELECT * FROM MPPT');
      return NextResponse.json({ data: rows });
    }

    // Nếu có inverterId, trả về MPPTs của inverter đó
    const [rows] = await pool.execute(
      'SELECT * FROM MPPT WHERE inverter_id = ?',
      [inverterId]
    );

    return NextResponse.json({ data: rows });
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
    const { inverter_id, mppt_platform_id, status } = body;

    if (!inverter_id || !mppt_platform_id) {
      return NextResponse.json(
        { error: 'Missing required fields: inverter_id, mppt_platform_id' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO MPPT (inverter_id, mppt_platform_id, status) VALUES (?, ?, ?)',
      [inverter_id, mppt_platform_id, status || null]
    );

    const insertId = (result as any).insertId;

    return NextResponse.json({ 
      message: 'MPPT created successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating MPPT:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, inverter_id, mppt_platform_id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'UPDATE MPPT SET inverter_id = ?, mppt_platform_id = ?, status = ? WHERE id = ?',
      [inverter_id, mppt_platform_id, status, id]
    );

    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'MPPT not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'MPPT updated successfully' });
  } catch (error) {
    console.error('Error updating MPPT:', error);
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

    const [result] = await pool.execute(
      'DELETE FROM MPPT WHERE id = ?',
      [id]
    );

    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'MPPT not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'MPPT deleted successfully' });
  } catch (error) {
    console.error('Error deleting MPPT:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 