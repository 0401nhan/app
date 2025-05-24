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
      id_project_platform, 
      platform_type,
      acc_platform,
      pass_platform,
      location,
      description,
      project_owner_id,
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
    if (id_project_platform) {
      updateFields.push('id_project_platform = ?');
      values.push(id_project_platform);
    }
    if (platform_type !== undefined) {
      updateFields.push('platform_type = ?');
      values.push(platform_type);
    }
    if (acc_platform !== undefined) {
      updateFields.push('acc_platform = ?');
      values.push(acc_platform);
    }
    if (pass_platform !== undefined) {
      updateFields.push('pass_platform = ?');
      values.push(pass_platform);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      values.push(location);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (project_owner_id !== undefined) {
      updateFields.push('project_owner_id = ?');
      values.push(project_owner_id);
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
      `UPDATE project SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
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
      'SELECT COUNT(*) as total FROM station WHERE project_id = ?',
      [id]
    );

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with associated stations' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM project WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 