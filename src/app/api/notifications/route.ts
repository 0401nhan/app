import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  NotificationData,
  buildNotificationQuery,
  buildNotificationInsertQuery,
  buildNotificationUpdateQuery,
  buildNotificationDeleteQuery
} from '@/lib/utils';

export async function GET() {
  try {
    const { query, values } = buildNotificationQuery();
    const [rows] = await pool.execute(query, values);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body as NotificationData;

    // Validate required fields
    if (!data.station_id || !data.user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: station_id, user_id' },
        { status: 400 }
      );
    }

    // Check if station exists
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

    // Check if user exists
    const [user] = await pool.execute(
      'SELECT id FROM user WHERE id = ?',
      [data.user_id]
    );

    if ((user as any[]).length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Check if notification already exists
    const [existingNotification] = await pool.execute(
      'SELECT id FROM station_email_notifications WHERE station_id = ? AND user_id = ?',
      [data.station_id, data.user_id]
    );

    if ((existingNotification as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Notification already exists for this station and user' },
        { status: 400 }
      );
    }

    const { query, values } = buildNotificationInsertQuery(data);
    const [result] = await pool.execute(query, values);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      message: 'Notification created successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body as { id: string; data: Partial<NotificationData> };

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // If updating station_id, check if station exists
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

    // If updating user_id, check if user exists
    if (data.user_id) {
      const [user] = await pool.execute(
        'SELECT id FROM user WHERE id = ?',
        [data.user_id]
      );

      if ((user as any[]).length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildNotificationUpdateQuery(id, data);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No notification found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Notification updated successfully' });
  } catch (error) {
    console.error('Error updating notification:', error);
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

    const { query, values } = buildNotificationDeleteQuery(id);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No notification found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 