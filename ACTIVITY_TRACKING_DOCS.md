# Dashboard & Activity Tracking System

## Overview
This document outlines the new dashboard real data system, activity tracking, and Google Analytics integration.

## Features Added

### 1. Real Data Dashboard
**Location:** `/administration`

The dashboard now fetches actual data from your database:
- **Total Drafts**: Real count from database
- **Published Articles**: Real count from database
- **Monthly Growth**: Calculated from articles published in last 30 days vs previous 30 days
- **Average Engagement**: Based on view counts
- **Performance Charts**: 7-day view and engagement trends

**API Endpoint:** `GET /api/dashboard/stats`

```typescript
// Response format
{
  data: {
    totalDrafts: number,
    totalPublished: number,
    totalArticles: number,
    monthlyGrowth: number,
    avgEngagement: number,
    performanceData: {
      views: number[],
      engagement: number[]
    }
  }
}
```

### 2. Activity Tracking System
**Location:** `/api/activity`

Non-intrusive activity tracking that doesn't affect current code:

#### Fetch Recent Activity
```typescript
// GET /api/activity?limit=8
const response = await fetch('/api/activity?limit=8');
const data = await response.json();
// Returns array of activity items with type, title, time, user
```

#### Track New Activity
```typescript
// POST /api/activity
const response = await fetch('/api/activity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'article_published', // article_published | user_registered | article_edited | custom
    title: 'Article Title',
    userId: 'user_id' // optional
  })
});
```

#### Using the Activity Tracking Hook
```typescript
import { useActivityTracking } from '@/hooks/useActivityTracking';

export function MyComponent() {
  const { trackActivity } = useActivityTracking();

  const handlePublishArticle = async () => {
    // ... publish logic
    await trackActivity({
      type: 'article_published',
      title: 'My New Article published',
      silent: false // Log to console (default)
    });
  };

  return <button onClick={handlePublishArticle}>Publish</button>;
}
```

### 3. Google Analytics Integration
**Location:** `src/app/layout.tsx`

Google Analytics (GA4) is now integrated globally with ID: `G-KLM0C5BJF8`

- Tracks page views automatically
- Tracks user interactions
- Monitors performance metrics
- Access dashboard at: https://analytics.google.com

**Configuration:**
- Tracking ID: `G-KLM0C5BJF8`
- Loads asynchronously (doesn't block page)
- Integrated via Next.js Script component

## Implementation Details

### Dashboard Modifications
- **Before:** Mock data with hardcoded values
- **After:** Fetches from real database via `/api/dashboard/stats`
- **Fallback:** Graceful fallback to empty state if API fails
- **No Breaking Changes:** Existing UI/UX remains the same

### Activity Tracking
- **Non-intrusive:** Runs independently, doesn't affect other systems
- **Passive:** Activities are logged based on database changes
- **Extensible:** Easy to add new activity types
- **Optional Hook:** Use `useActivityTracking` when you want to explicitly track actions

### Activity Data Sources
- Article status changes (draft → published)
- Article edits (updated timestamp)
- User registration (when available)
- Custom events (via explicit hook calls)

## Usage Examples

### Track Article Publishing
```typescript
const { trackActivity } = useActivityTracking();

await publishArticle(articleData);
await trackActivity({
  type: 'article_published',
  title: `${articleData.title} published`
});
```

### Track Article Edits
```typescript
const { trackActivity } = useActivityTracking();

await saveArticleChanges(articleData);
await trackActivity({
  type: 'article_edited',
  title: `${articleData.title} edited`
});
```

### Track Custom Events
```typescript
const { trackActivity } = useActivityTracking();

await trackActivity({
  type: 'custom',
  title: 'User downloaded report',
  silent: true // Don't log to console
});
```

## Dashboard Stats Calculation

### Monthly Growth
```
growthRate = ((currentMonth - previousMonth) / previousMonth) * 100
```
- Current Month: Articles published in last 30 days
- Previous Month: Articles published 60-30 days ago

### Average Engagement
```
avgEngagement = totalViews / articlesWithViews
```
- Only includes articles with view count > 0
- Provides realistic engagement metric

## Google Analytics Features

Available metrics tracked:
- Page views
- Session duration
- User demographics
- Device information
- Traffic sources
- Conversion events (can be configured)

View analytics at: https://analytics.google.com (sign in with your Google account)

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activity/
│   │   │   └── route.ts          # Activity tracking API
│   │   └── dashboard/
│   │       └── stats/
│   │           └── route.ts      # Dashboard stats API
│   ├── administration/
│   │   └── page.tsx              # Updated to fetch real data
│   └── layout.tsx                # Added Google Analytics
└── hooks/
    └── useActivityTracking.ts    # Activity tracking hook
```

## No Breaking Changes

✅ Existing dashboard UI/UX unchanged  
✅ Current API routes still work  
✅ All other features unaffected  
✅ Activity tracking is optional  
✅ Graceful fallback for API failures  

## Next Steps (Optional)

1. Create dedicated Activity model in MongoDB for persistent storage
2. Add more granular analytics (by category, by author, etc.)
3. Set up Google Analytics custom events
4. Create analytics dashboard for public metrics
5. Add real-time activity notifications
