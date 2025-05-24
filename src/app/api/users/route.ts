import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

const SALT_ROUNDS = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user'
    );
    const total = (countResult as any)[0].total;

    // Get users with pagination
    const [users] = await pool.execute(
      `SELECT id, username, email, role FROM user ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`
    );

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    // Validate required fields
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role enum
    const validRoles = ['admin', 'project_owner', 'station_owner', 'operator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM user WHERE username = ?',
      [username]
    );

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email || null, hashedPassword, role]
    );

    return NextResponse.json({
      message: 'User created successfully',
      id: (result as any).insertId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body;
    const { username, email, password, role } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing user id' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'project_owner', 'station_owner', 'operator'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing user id' },
        { status: 400 }
      );
    }

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