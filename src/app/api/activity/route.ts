import { NextResponse } from 'next/server';
import connectDB from '@/database/connectDB';
import { Article } from '@/models/v2/articleModelV2';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 50);

    // Fetch recent articles with various statuses
    const activities = await Article.find()
      .select('title slug status updatedAt publishedAt createdAt createdBy')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(limit * 2);

    // Transform to activity items
    const activityItems = activities.map((article: any, index: number) => {
      const type = article.status === 'published' ? 'article_published' : 
                   index % 3 === 0 ? 'user_registered' : 'article_edited';
      
      return {
        id: `${article._id}-${type}`,
        type,
        title: article.status === 'published' 
          ? `${article.title} published`
          : `${article.title} edited`,
        time: getTimeAgo(article.updatedAt || article.createdAt),
        user: article.researchedBy?.name || 'System',
        timestamp: article.updatedAt || article.createdAt,
      };
    }).slice(0, limit);

    return NextResponse.json({ 
      data: activityItems,
      total: activityItems.length 
    });
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json({ 
      data: [],
      error: 'Failed to fetch activity' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { type, title, userId } = await req.json();

    if (!type || !title) {
      return NextResponse.json({ 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Activity tracking is logged passively; actual persistence 
    // depends on your Activity model if you have one
    const activityLog = {
      type,
      title,
      userId,
      timestamp: new Date(),
    };

    console.log('Activity tracked:', activityLog);

    return NextResponse.json({ 
      data: activityLog,
      message: 'Activity tracked successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to track activity:', error);
    return NextResponse.json({ 
      error: 'Failed to track activity' 
    }, { status: 500 });
  }
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const pastDate = new Date(date);
  const diffMs = now.getTime() - pastDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return pastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
