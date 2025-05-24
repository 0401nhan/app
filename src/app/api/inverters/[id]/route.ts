import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    const { 
      inverter_id_platform,
      model,
      station_id,
      max_ac_capacity,
      max_dc_capacity
    } = data;

    // Build update query
    let updateFields = [];
    let values = [];

    if (inverter_id_platform) {
      updateFields.push('inverter_id_platform = ?');
      values.push(inverter_id_platform);
    }
    if (model !== undefined) {
      updateFields.push('model = ?');
      values.push(model);
    }
    if (station_id !== undefined) {
      updateFields.push('station_id = ?');
      values.push(station_id);
    }
    if (max_ac_capacity !== undefined) {
      updateFields.push('max_ac_capacity = ?');
      values.push(max_ac_capacity);
    }
    if (max_dc_capacity !== undefined) {
      updateFields.push('max_dc_capacity = ?');
      values.push(max_dc_capacity);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add id to values array
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE inverter SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Inverter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inverter updated successfully'
    });
  } catch (error) {
    console.error('Error updating inverter:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Check for related records in pv_module
    const [relatedRecords] = await pool.execute(
      'SELECT COUNT(*) as total FROM pv_module WHERE inverter_id = ?',
      [id]
    );

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete inverter with associated PV modules' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM inverter WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Inverter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inverter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inverter:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 