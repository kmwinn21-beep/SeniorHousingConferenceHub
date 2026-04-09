import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db, dbReady } from '@/lib/db';

// DELETE /api/conferences/[id]/attendees
// Body: { attendee_ids: number[] }
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await dbReady;
    const body = await request.json();
    const { attendee_ids } = body as { attendee_ids: number[] };

    if (!Array.isArray(attendee_ids) || attendee_ids.length === 0) {
      return NextResponse.json({ error: 'attendee_ids required' }, { status: 400 });
    }

    const placeholders = attendee_ids.map(() => '?').join(', ');
    await db.execute({
      sql: `DELETE FROM conference_attendees WHERE conference_id = ? AND attendee_id IN (${placeholders})`,
      args: [params.id, ...attendee_ids],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/conferences/[id]/attendees error:', error);
    return NextResponse.json({ error: 'Failed to remove attendees' }, { status: 500 });
  }
}
