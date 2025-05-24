import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
  ProjectData,
  buildProjectQuery,
  buildProjectInsertQuery,
  buildProjectUpdateQuery,
  buildProjectDeleteQuery
} from '@/lib/utils';

export async function GET() {
  try {
    const { query, values } = buildProjectQuery();
    const [rows] = await pool.execute(query, values);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body as ProjectData;

    // Validate required fields
    if (!data.name || !data.id_project_platform) {
      return NextResponse.json(
        { error: 'Missing required fields: name, id_project_platform' },
        { status: 400 }
      );
    }

    // Check if project platform ID already exists
    const [existingProjects] = await pool.execute(
      'SELECT id FROM project WHERE id_project_platform = ?',
      [data.id_project_platform]
    );

    if ((existingProjects as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Project platform ID already exists' },
        { status: 400 }
      );
    }

    const { query, values } = buildProjectInsertQuery(data);
    const [result] = await pool.execute(query, values);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      message: 'Project created successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body as { id: string; data: Partial<ProjectData> };

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // If updating id_project_platform, check if it already exists
    if (data.id_project_platform) {
      const [existingProjects] = await pool.execute(
        'SELECT id FROM project WHERE id_project_platform = ? AND id != ?',
        [data.id_project_platform, id]
      );

      if ((existingProjects as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Project platform ID already exists' },
          { status: 400 }
        );
      }
    }

    const { query, values } = buildProjectUpdateQuery(id, data);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No project found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
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

    // Check if project has any related records
    const [relatedRecords] = await pool.execute(`
      SELECT COUNT(*) as total FROM station WHERE project_id = ?
    `, [id]);

    if ((relatedRecords as any)[0].total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with associated stations' },
        { status: 400 }
      );
    }

    const { query, values } = buildProjectDeleteQuery(id);
    const [result] = await pool.execute(query, values);
    const rowsAffected = (result as any).affectedRows;

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'No project found with the specified id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 