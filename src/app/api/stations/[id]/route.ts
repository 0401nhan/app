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
      name,
      id_station_platform,
      id_station_platform1,
      location_longitude,
      location_latitude,
      description,
      project_id,
      station_owner_id,
      max_ac_capacity,
      max_dc_capacity
    } = data;

    // Build update query
    let updateFields = [];
    let values = [];

    if (name) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (id_station_platform) {
      updateFields.push('id_station_platform = ?');
      values.push(id_station_platform);
    }
    if (id_station_platform1 !== undefined) {
      updateFields.push('id_station_platform1 = ?');
      values.push(id_station_platform1);
    }
    if (location_longitude !== undefined) {
      updateFields.push('location_longitude = ?');
      values.push(location_longitude);
    }
    if (location_latitude !== undefined) {
      updateFields.push('location_latitude = ?');
      values.push(location_latitude);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (project_id !== undefined) {
      updateFields.push('project_id = ?');
      values.push(project_id);
    }
    if (station_owner_id !== undefined) {
      updateFields.push('station_owner_id = ?');
      values.push(station_owner_id);
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
      `UPDATE station SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Station updated successfully'
    });
  } catch (error) {
    console.error('Error updating station:', error);
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

    // Check for related records
    const [relatedRecords] = await pool.execute(
      'SELECT COUNT(*) as total FROM inverter WHERE station_id = ?',
      [id]
    );

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete station with associated inverters' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM station WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Station deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting station:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 