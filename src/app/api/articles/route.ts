import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/database/connectDB';
import { Article, ScratchPad } from '@/models';
import { Types } from 'mongoose';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);

  const query: Record<string, any> = {};
  if (status) {
    query.status = status;
  } else if (!session?.user || (session.user as any).role !== 'admin') {
    query.status = 'published';
  }

  const articles = await Article.find(query)
    .populate('category', 'name title')
    .populate('researchedBy', 'name email')
    .populate('featuredImage', 'url title')
    .sort({ publishedAt: -1, updatedAt: -1 })
    .limit(limit)
    .select('title slug status category excerpt tags featuredImage readingTime publishedAt createdAt updatedAt');

  return NextResponse.json({ data: articles });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user?.isVerified === false) {
    return NextResponse.json({ message: 'Verification required' }, { status: 403 });
  }

  await connectDB();

  const { title, slug, category, excerpt, tags } = await req.json();
  if (!title || !slug || !category) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const existing = await Article.findOne({ slug });
  if (existing) {
    return NextResponse.json({ message: 'Slug already in use' }, { status: 409 });
  }

  const article = await Article.create({
    title,
    slug,
    category: new Types.ObjectId(category),
    excerpt,
    tags,
    status: 'draft',
    researchedBy: user?.id,
  });

  await ScratchPad.create({ article: article._id, text: '' });

  return NextResponse.json({ data: article }, { status: 201 });
}
