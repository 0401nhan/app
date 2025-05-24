import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

const SALT_ROUNDS = 10;

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    const { username, email, password, role, is_active } = data;

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'project_owner', 'station_owner', 'operator'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Role must be one of: admin, project_owner, station_owner, operator' },
          { status: 400 }
        );
      }
    }

    // Build update query
    let updateFields = [];
    let values = [];

    if (username) {
      updateFields.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email || null);
    }
    if (password) {
      updateFields.push('password = ?');
      values.push(await bcrypt.hash(password, SALT_ROUNDS));
    }
    if (role) {
      updateFields.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(is_active);
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
      `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
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
    const [relatedRecords] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM project WHERE project_owner_id = ?) +
        (SELECT COUNT(*) FROM station WHERE station_owner_id = ?) as total
    `, [id, id]);

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with associated projects or stations' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM user WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 