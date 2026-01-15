# Production-Style Observability System

A complete monitoring and observability system for Next.js 14+ with TypeScript, MongoDB, and Vercel deployment.

## Architecture

```
src/
├── app/
│   ├── api/metrics/           # Metric collection API routes
│   │   ├── webvitals/route.ts   # POST /api/metrics/webvitals
│   │   ├── navigation/route.ts  # POST /api/metrics/navigation
│   │   ├── api/route.ts         # POST /api/metrics/api
│   │   ├── db/route.ts          # POST /api/metrics/db
│   │   ├── all/route.ts         # GET  /api/metrics/all (paginated)
│   │   └── example/route.ts     # Example with wrapper
│   ├── dashboard/page.tsx     # Visualization dashboard
│   └── reportWebVitals.ts     # Web Vitals reporter
├── lib/metrics/
│   ├── server.ts              # Server-side utilities (API/DB measurement)
│   └── client.ts              # Client-side utilities (send metrics)
├── hooks/
│   └── useNavigationMetrics.ts # Client-side navigation tracking
└── models/
    └── metricModel.ts         # Mongoose schema for metrics
```

## Features

### 1. Frontend Performance Monitoring
- **Web Vitals**: Automatic tracking of TTFB, FCP, LCP, CLS, FID using Next.js reportWebVitals
- **Navigation Tracking**: Client-side route change duration measurement via Performance API

### 2. Backend API Performance
- **Automatic Instrumentation**: Wrap any API route with `withApiMetrics()` to track execution time, status, and path
- **Zero-overhead**: Metrics recording happens asynchronously

### 3. Database Performance
- **Query Instrumentation**: Use `measureDb()` to wrap any Mongoose operation
- **Collection-level insights**: Track query durations by collection name

### 4. Centralized Storage
- Single MongoDB collection for all metrics
- Schema supports: type, name, duration, path, method, metadata, createdAt

### 5. Dashboard
- Real-time visualization using Recharts
- Charts: API latency, DB latency, Web Vitals, Requests/minute
- Clean, minimal UI with dark theme

## Setup

### 1. Install Dependencies
```bash
npm install recharts
```

### 2. Environment Variables
Ensure `MONGO_URI` is set in `.env.local`:
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/
```

### 3. Enable Navigation Metrics
Already integrated in `src/app/layout.tsx` via `useNavigationMetrics()` hook.

### 4. Enable Web Vitals (Optional)
If using Pages Router, add to `_app.tsx`:
```tsx
export { reportWebVitals } from './reportWebVitals';
```

For App Router (Next.js 13+), Web Vitals must be sent manually from client components if needed.

## Usage

### API Route Example
Wrap your handler with `withApiMetrics()`:

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withApiMetrics } from "@/lib/metrics/server";
import connectDB from "@/database/connectDB";
import User from "@/models/userModel";

async function handler(req: NextRequest) {
  await connectDB();
  const users = await User.find().limit(10);
  return NextResponse.json({ users });
}

export const GET = withApiMetrics(handler);
```

This automatically records:
- Duration
- HTTP method and path
- Status code

### Database Query Example
Wrap your Mongoose queries with `measureDb()`:

```typescript
import { measureDb } from "@/lib/metrics/server";
import Article from "@/models/articleModel";

const articles = await measureDb({
  name: "find-published-articles",
  collection: "articles",
  path: "/api/articles",
  fn: () => Article.find({ status: "published" }).limit(20).lean(),
});
```

This records:
- Query name
- Duration
- Collection name
- Optional metadata

### Frontend Metrics
Navigation metrics are automatically tracked via `useNavigationMetrics()` hook in layout.

To manually send custom metrics:
```typescript
import { sendClientMetric } from "@/lib/metrics/client";

sendClientMetric({
  type: "navigation",
  name: "custom-event",
  duration: 123,
  path: window.location.pathname,
});
```

## API Endpoints

### POST /api/metrics/webvitals
Record Web Vitals (TTFB, FCP, LCP, CLS, FID)
```json
{
  "name": "LCP",
  "duration": 1200,
  "path": "/articles/some-slug",
  "metadata": { "id": "v3-123" }
}
```

### POST /api/metrics/navigation
Record client-side navigation duration
```json
{
  "name": "route-change",
  "duration": 450,
  "path": "/dashboard"
}
```

### POST /api/metrics/api
Record API execution time (usually auto-recorded via `withApiMetrics`)
```json
{
  "name": "GET /api/users",
  "duration": 85,
  "path": "/api/users",
  "method": "GET",
  "metadata": { "status": 200 }
}
```

### POST /api/metrics/db
Record database query time (usually auto-recorded via `measureDb`)
```json
{
  "name": "find-users",
  "duration": 42,
  "path": "/api/users",
  "metadata": { "collection": "users" }
}
```

### GET /api/metrics/all
Fetch all metrics with pagination and filtering

Query params:
- `page` (default: 1)
- `limit` (default: 50, max: 200)
- `type` (filter by: webvital, navigation, api, db)
- `name` (regex search)
- `path` (regex search)

Response:
```json
{
  "metrics": [...],
  "total": 1234,
  "page": 1,
  "pages": 25
}
```

## Dashboard

Visit `/dashboard` to see:
- Total metrics count
- API latency over time (line chart)
- DB latency over time (area chart)
- Web Vitals over time (line chart)
- Requests per minute (bar chart)

Dashboard auto-refreshes data on mount. Customize polling by adding a `useEffect` interval.

## Mongoose Schema

```typescript
{
  type: "webvital" | "navigation" | "api" | "db",
  name: string,              // e.g., "LCP", "route-change", "GET /api/users"
  duration: number,          // milliseconds
  path: string,              // e.g., "/articles/some-slug"
  method: string,            // e.g., "GET", "POST"
  metadata: object,          // flexible: { status, collection, id, ... }
  createdAt: Date            // auto timestamp
}
```

## Production Considerations

### Performance
- Metrics are recorded asynchronously (fire-and-forget)
- Client-side uses `keepalive: true` to ensure delivery on navigation
- No impact on user-facing latency

### Security
- Add authentication middleware to `/api/metrics/all` and `/dashboard` in production
- Consider rate limiting on metric ingestion endpoints

### Data Retention
- Implement TTL indexes in MongoDB to auto-delete old metrics:
```typescript
MetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
```

### Sampling
For high-traffic apps, consider sampling (e.g., record 10% of requests):
```typescript
if (Math.random() < 0.1) {
  await recordMetric({ ... });
}
```

### Aggregation
For large datasets, pre-aggregate metrics (e.g., avg/p95 per hour) using MongoDB aggregation pipelines or cron jobs.

## Troubleshooting

### Metrics not appearing in dashboard
- Check MongoDB connection (`MONGO_URI` in `.env.local`)
- Verify API routes are being called (check Network tab in DevTools)
- Ensure `connectDB()` is awaited in API routes

### Navigation metrics not working
- Ensure `useNavigationMetrics()` is called in layout
- Check client-side console for errors
- Verify `/api/metrics/navigation` endpoint is reachable

### Web Vitals not captured
- Web Vitals require user interaction (e.g., click, scroll) to trigger
- Check browser console for errors in `sendClientMetric()`

## Extending

### Add custom metric types
1. Update `MetricType` union in `src/models/metricModel.ts`
2. Create corresponding API route in `src/app/api/metrics/[type]/route.ts`
3. Send metrics from client/server using `recordMetric()` or `sendClientMetric()`

### Add new charts
1. Import desired chart from `recharts`
2. Filter/transform metrics in `useMemo`
3. Add to dashboard grid

Example:
```tsx
const errorRate = useMemo(() => {
  const errors = metrics.filter(m => m.metadata?.status >= 400);
  return (errors.length / metrics.length) * 100;
}, [metrics]);
```

## License
MIT

---

Built with Next.js 14, TypeScript, MongoDB, Mongoose, and Recharts.
