# Observability System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Verify Installation (1 minute)
```bash
# Check if recharts is installed
npm list recharts

# If not installed, run:
npm install
```

### Step 2: Start Dev Server (30 seconds)
```bash
npm run dev
```

### Step 3: View Dashboard (30 seconds)
Open your browser and go to:
```
http://localhost:3000/dashboard
```

**That's it!** The system is already collecting metrics from:
- ✅ Client-side navigation (route changes)
- ✅ Example API endpoint (`/api/metrics/example`)

---

## 📊 What You'll See

### Initial Dashboard
When you first visit `/dashboard`, you may see:
- 0-5 metrics (from page loads and navigation)
- Empty or sparse charts

### Generate More Data
1. **Navigate between pages** → Generates navigation metrics
2. **Visit the example endpoint** → http://localhost:3000/api/metrics/example
3. **Refresh dashboard** → See new metrics appear

---

## 🔧 Integrate with Your Existing Code

### Wrap an API Route (2 minutes)

**Before:**
```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import User from "@/models/userModel";

export async function GET(req: NextRequest) {
  await connectDB();
  const users = await User.find().limit(10);
  return NextResponse.json({ users });
}
```

**After:**
```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import User from "@/models/userModel";
import { withApiMetrics } from "@/lib/metrics/server";  // ← Add this

async function handler(req: NextRequest) {  // ← Rename to handler
  await connectDB();
  const users = await User.find().limit(10);
  return NextResponse.json({ users });
}

export const GET = withApiMetrics(handler);  // ← Wrap handler
```

**Result:** API execution time is now tracked automatically! 🎉

---

### Measure a Database Query (2 minutes)

**Before:**
```typescript
const articles = await Article.find({ status: "published" }).limit(20).lean();
```

**After:**
```typescript
import { measureDb } from "@/lib/metrics/server";  // ← Add this

const articles = await measureDb({
  name: "find-published-articles",
  collection: "articles",
  path: req.nextUrl.pathname,
  fn: () => Article.find({ status: "published" }).limit(20).lean(),
});
```

**Result:** Database query time is now tracked! 🎉

---

## 🎯 Common Use Cases

### 1. Track API Performance
```typescript
import { withApiMetrics } from "@/lib/metrics/server";

async function handler(req: NextRequest) {
  // Your logic here
  return NextResponse.json({ data: "..." });
}

export const GET = withApiMetrics(handler);
export const POST = withApiMetrics(handler);
```

### 2. Track Database Queries
```typescript
import { measureDb } from "@/lib/metrics/server";

// Find query
const users = await measureDb({
  name: "find-active-users",
  collection: "users",
  path: "/api/users",
  fn: () => User.find({ active: true }),
});

// Aggregate query
const stats = await measureDb({
  name: "user-stats-aggregate",
  collection: "users",
  path: "/api/stats",
  fn: () => User.aggregate([...pipeline]),
});

// Save operation
const newUser = await measureDb({
  name: "create-user",
  collection: "users",
  path: "/api/users",
  fn: async () => {
    const user = new User({ ... });
    return user.save();
  },
});
```

### 3. Send Custom Client Metrics
```typescript
"use client";
import { sendClientMetric } from "@/lib/metrics/client";

function handleClick() {
  const start = performance.now();
  
  // Do something
  doExpensiveOperation();
  
  const duration = performance.now() - start;
  sendClientMetric({
    type: "navigation",
    name: "expensive-operation",
    duration,
    path: window.location.pathname,
  });
}
```

---

## 📈 Dashboard Features

### Charts Available
1. **API Latency** - Line chart showing API response times
2. **DB Latency** - Area chart showing database query durations
3. **Web Vitals** - Line chart tracking page performance
4. **Requests/Minute** - Bar chart showing traffic patterns

### Summary Cards
- Total metrics collected
- API samples count
- DB samples count
- Web Vitals count

### Real-time Updates
Currently loads on mount. To add auto-refresh:
```typescript
// In src/app/dashboard/page.tsx
useEffect(() => {
  const interval = setInterval(() => {
    // Refetch metrics
  }, 30000); // Every 30 seconds
  return () => clearInterval(interval);
}, []);
```

---

## 🔒 Production Checklist

Before deploying to production:

### Security
- [ ] Add authentication to `/dashboard`
- [ ] Protect `/api/metrics/all` endpoint
- [ ] Add rate limiting to metric endpoints

### Performance
- [ ] Implement sampling (track 10-20% of requests)
- [ ] Add TTL indexes for auto-cleanup
- [ ] Pre-aggregate hourly/daily metrics

### Monitoring
- [ ] Set up alerts for high latency
- [ ] Monitor metric collection failures
- [ ] Track dashboard usage

---

## 📝 Example: Complete Integration

Here's a complete example of a well-instrumented API route:

```typescript
// src/app/api/articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2";
import { withApiMetrics, measureDb } from "@/lib/metrics/server";

async function handler(req: NextRequest) {
  await connectDB();

  // Measure the main query
  const articles = await measureDb({
    name: "find-all-articles",
    collection: "articles",
    path: req.nextUrl.pathname,
    metadata: { limit: 50 },
    fn: () => Article.find().limit(50).lean(),
  });

  // Measure a count query
  const total = await measureDb({
    name: "count-articles",
    collection: "articles",
    path: req.nextUrl.pathname,
    fn: () => Article.countDocuments(),
  });

  return NextResponse.json({ articles, total });
}

// Wrap the handler to track overall API performance
export const GET = withApiMetrics(handler);
```

This tracks:
1. ✅ Total API execution time
2. ✅ Database query time for finding articles
3. ✅ Database query time for counting articles
4. ✅ HTTP status code
5. ✅ Request path and method

---

## 🆘 Troubleshooting

### Dashboard shows no data
```bash
# Check MongoDB connection
# Verify MONGO_URI in .env.local

# Test example endpoint
curl http://localhost:3000/api/metrics/example

# Check metrics collection
# Should create metrics in MongoDB after hitting endpoints
```

### Metrics not appearing
1. Ensure `withApiMetrics()` is used correctly
2. Check that `recordMetric()` doesn't throw errors
3. Verify MongoDB connection is working
4. Check browser console for client-side errors

### TypeScript errors
```bash
# Rebuild
npm run build

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

---

## 📚 Documentation

For more details, see:
- **`docs/OBSERVABILITY.md`** - Complete documentation
- **`docs/OBSERVABILITY_SUMMARY.md`** - Implementation summary
- **`docs/OBSERVABILITY_ARCHITECTURE.md`** - Architecture diagrams
- **`docs/OBSERVABILITY_EXAMPLES.ts`** - Code examples
- **`docs/OBSERVABILITY_FILES.md`** - File structure

---

## ✅ Success Checklist

- [x] Dependencies installed (recharts)
- [x] Dev server running
- [x] Dashboard accessible at `/dashboard`
- [ ] At least one API route wrapped with `withApiMetrics()`
- [ ] At least one DB query wrapped with `measureDb()`
- [ ] Metrics visible in dashboard
- [ ] Understanding how to add more instrumentation

---

**You're ready to monitor your application!** 🎉

Start by wrapping your most important API routes and database queries, then watch the metrics flow into your dashboard.

For questions or issues, check the troubleshooting section or review the detailed documentation.
