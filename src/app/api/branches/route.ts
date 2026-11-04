import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branches } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// 1. استرجاع الفروع (الكل أو فرع محدد عبر ?id=...)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('id');

    if (branchId) {
      const singleBranch = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!singleBranch.length) {
        return NextResponse.json({ message: 'الفرع غير موجود' }, { status: 404 });
      }

      return NextResponse.json(singleBranch[0], { status: 200 });
    }

    const allBranches = await db
      .select()
      .from(branches)
      .orderBy(desc(branches.createdAt));

    return NextResponse.json(allBranches, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع بيانات الفروع', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إضافة فرع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name || body.nameAr;
    const nameAr = body.nameAr || body.name;
    const nameEn = body.nameEn || body.name || '';
    const code = body.code || '';
    const phone = body.phone || '';
    const managerName = body.managerName || '';
    const address = body.address || '';
    const googleMapsUrl = body.googleMapsUrl || '';
    const latitude = body.latitude ? String(body.latitude).trim() : null;
    const longitude = body.longitude ? String(body.longitude).trim() : null;
    const radiusMeters = Number(body.radiusMeters || body.geofenceRadius || 100);
    const geofenceRadius = radiusMeters;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name) {
      return NextResponse.json({ message: 'اسم الفرع مطلوب' }, { status: 400 });
    }

    const inserted = await db
      .insert(branches)
      .values({
        name,
        nameAr,
        nameEn,
        code,
        phone,
        managerName,
        address,
        googleMapsUrl,
        latitude,
        longitude,
        radiusMeters,
        geofenceRadius,
        isActive,
      })
      .returning();

    return NextResponse.json(inserted[0] || { message: 'تم إنشاء الفرع بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { message: 'فشل حفظ الفرع في قاعدة البيانات', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. تحديث بيانات الفرع (حل مشكلة فشل التحديث جذرياً)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || new URL(request.url).searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف الفرع مفقود' }, { status: 400 });
    }

    const name = body.name || body.nameAr;
    const nameAr = body.nameAr || body.name;
    const nameEn = body.nameEn || body.name || '';
    const code = body.code || '';
    const phone = body.phone || '';
    const managerName = body.managerName || '';
    const address = body.address || '';
    const googleMapsUrl = body.googleMapsUrl || '';
    const latitude = body.latitude ? String(body.latitude).trim() : null;
    const longitude = body.longitude ? String(body.longitude).trim() : null;
    const radiusMeters = Number(body.radiusMeters || body.geofenceRadius || 100);
    const geofenceRadius = radiusMeters;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    await db
      .update(branches)
      .set({
        name,
        nameAr,
        nameEn,
        code,
        phone,
        managerName,
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

    return NextResponse.json({ message: 'تم تحديث بيانات الفرع بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { message: 'فشل تحديث بيانات الفرع', error: error?.message },
      { status: 500 }
    );
  }
}

// 4. حذف الفرع
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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
