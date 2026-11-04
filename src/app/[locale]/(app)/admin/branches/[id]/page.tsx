import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branches } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// 1. استرداد بيانات الفرع بالمعرف
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    const branchList = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    if (!branchList.length) {
      return NextResponse.json({ message: 'الفرع غير موجود' }, { status: 404 });
    }

    return NextResponse.json(branchList[0], { status: 200 });
  } catch (error: any) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { message: 'خطأ داخلي أثناء استرداد بيانات الفرع', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. تحديث بيانات الفرع بالكامل وحل مشكلة فشل التحديث
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الفرع مفقود' }, { status: 400 });
    }

    const body = await request.json();

    const name = body.name || body.nameAr;
    const nameAr = body.nameAr || body.name;
    const nameEn = body.nameEn || body.name || '';
    const code = body.code || '';
    const address = body.address || '';
    const googleMapsUrl = body.googleMapsUrl || '';
    const latitude = body.latitude ? String(body.latitude).trim() : null;
    const longitude = body.longitude ? String(body.longitude).trim() : null;
    const radiusMeters = Number(body.radiusMeters || body.geofenceRadius || 100);
    const geofenceRadius = radiusMeters;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    // تنفيذ التحديث الآمن والمتوافق مع أعمدة PostgreSQL
    await db
      .update(branches)
      .set({
        name,
        nameAr,
        nameEn,
        code,
        address,
        googleMapsUrl,
        latitude,
        longitude,
        radiusMeters,
        geofenceRadius,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, id));

    return NextResponse.json(
      { message: 'تم تحديث بيانات الفرع بنجاح' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating branch in PUT:', error);
    return NextResponse.json(
      { message: 'فشل تحديث بيانات الفرع في قاعدة البيانات', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. حذف الفرع أو تعطيله
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الفرع مفقود' }, { status: 400 });
    }

    await db.delete(branches).where(eq(branches.id, id));

    return NextResponse.json({ message: 'تم حذف الفرع بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { message: 'فشل حذف الفرع', error: error?.message },
      { status: 500 }
    );
  }
}
