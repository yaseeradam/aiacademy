import { NextResponse } from 'next/server';
import { getAllStaff, addOrUpdateStaff, deleteStaff, getStaffById } from '@/lib/db';
import { adminCreateStaffAction, adminUpdateStaffAction, adminDeleteStaffAction } from '@/app/actions';
import { Staff } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await getAllStaff();
    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error('Failed to get staff records:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await adminCreateStaffAction(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, staff: result.staff });
  } catch (error: any) {
    console.error('Failed to create staff record:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create staff' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }
    const result = await adminUpdateStaffAction(id, data);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, staff: result.staff });
  } catch (error: any) {
    console.error('Failed to update staff record:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }
    const result = await adminDeleteStaffAction(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to delete' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete staff record:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete staff' }, { status: 500 });
  }
}
