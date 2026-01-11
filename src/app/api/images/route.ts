import { NextResponse } from 'next/server';
import connectDB from '@/database/connectDB';
import Image from '@/models/imageModel';

export async function GET(req: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const images = await Image.find({}).sort({ uploadedAt: -1 }).limit(limit);
    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const image = await Image.create(body);
    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Storage error" }, { status: 400 });
  }
}