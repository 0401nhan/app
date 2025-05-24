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
      project_id,
      station_id,
      inverter_id,
      alpha,
      pv_module_name,
      pv_module_type,
      pv_module_capacity,
      pv_module_number
    } = data;

    // Build update query
    let updateFields = [];
    let values = [];

    if (project_id !== undefined) {
      updateFields.push('project_id = ?');
      values.push(project_id);
    }
    if (station_id !== undefined) {
      updateFields.push('station_id = ?');
      values.push(station_id);
    }
    if (inverter_id !== undefined) {
      updateFields.push('inverter_id = ?');
      values.push(inverter_id);
    }
    if (alpha !== undefined) {
      updateFields.push('alpha = ?');
      values.push(alpha);
    }
    if (pv_module_name !== undefined) {
      updateFields.push('pv_module_name = ?');
      values.push(pv_module_name);
    }
    if (pv_module_type !== undefined) {
      updateFields.push('pv_module_type = ?');
      values.push(pv_module_type);
    }
    if (pv_module_capacity !== undefined) {
      updateFields.push('pv_module_capacity = ?');
      values.push(pv_module_capacity);
    }
    if (pv_module_number !== undefined) {
      updateFields.push('pv_module_number = ?');
      values.push(pv_module_number);
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
      `UPDATE pv_module SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'PV Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'PV Module updated successfully'
    });
  } catch (error) {
    console.error('Error updating PV Module:', error);
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

    const [result] = await pool.execute(
      'DELETE FROM pv_module WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'PV Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'PV Module deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting PV Module:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 