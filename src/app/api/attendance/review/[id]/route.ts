import { NextResponse } from 'next/server';
import { db } from '@/db';
import { attendanceLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const logId = resolvedParams.id;

    if (!logId) {
      return NextResponse.json({ error: 'معرف السجل مطلوب' }, { status: 400 });
    }

    const body = await request.json();
    const { status, verificationStatus, notes } = body;

    const newStatus = status || verificationStatus || 'APPROVED';

    const existingLogs = await db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, logId))
      .limit(1);

    if (!existingLogs || existingLogs.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على سجل الحضور' }, { status: 404 });
    }

    const existingLog = existingLogs[0];

    const updatedLogs = await db
      .update(attendanceLogs)
      .set({
        status: String(newStatus),
        verificationStatus: String(newStatus),
        notes: notes !== undefined ? String(notes) : existingLog.notes,
      })
      .where(eq(attendanceLogs.id, logId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'تم مراجعة وتحديث حالة سجل الحضور بنجاح',
      data: updatedLogs[0] || null,
    });
  } catch (error: any) {
    console.error('Error reviewing attendance log:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء مراجعة سجل الحضور' },
      { status: 500 }
    );
  }
}
