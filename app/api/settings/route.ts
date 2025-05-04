import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne() || await Settings.create({});
    return NextResponse.json(settings);
  } catch  {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    
    const settings = await Settings.findOneAndUpdate(
      {},
      { ...data, lastUpdatedBy: session.user.id },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch  {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}