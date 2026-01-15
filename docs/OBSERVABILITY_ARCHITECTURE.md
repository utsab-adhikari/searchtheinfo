# Observability System Data Flow

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌────────────────────────────┐   │
│  │  Web Vitals      │────────▶│  sendClientMetric()        │   │
│  │  (TTFB, FCP,     │         │  (lib/metrics/client.ts)   │   │
│  │   LCP, CLS, FID) │         └────────────┬───────────────┘   │
│  └──────────────────┘                      │                    │
│                                             │ POST               │
│  ┌──────────────────┐                      │                    │
│  │  Navigation      │────────────────────▶ │                    │
│  │  (Route Changes) │                      │                    │
│  │  useNavigation   │                      │                    │
│  │  Metrics()       │                      │                    │
│  └──────────────────┘                      │                    │
│                                             │                    │
└─────────────────────────────────────────────┼────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NEXT.JS API ROUTES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /api/metrics/webvitals    ┐                               │
│  POST /api/metrics/navigation   │──▶ recordMetric()             │
│  POST /api/metrics/api          │    (lib/metrics/server.ts)    │
│  POST /api/metrics/db           ┘                               │
│                                      │                           │
│  ┌───────────────────────────┐      │                           │
│  │  API Route Handler        │      │                           │
│  │  withApiMetrics(handler)  │──────┤                           │
│  └───────────────────────────┘      │                           │
│         │                            │                           │
│         ├─ Measures duration         │                           │
│         ├─ Captures status           │                           │
│         └─ Records path/method       │                           │
│                                      │                           │
│  ┌───────────────────────────┐      │                           │
│  │  DB Query                 │      │                           │
│  │  measureDb({              │──────┘                           │
│  │    fn: () => Model.find() │                                  │
│  │  })                       │                                  │
│  └───────────────────────────┘                                  │
│         │                                                        │
│         ├─ Measures query time                                  │
│         ├─ Captures collection                                  │
│         └─ Records metadata                                     │
│                                                                  │
└─────────────────────────────────────────┬───────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB ATLAS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Collection: metrics                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  {                                                      │    │
│  │    type: "webvital" | "navigation" | "api" | "db",    │    │
│  │    name: "LCP",                                        │    │
│  │    duration: 1200,                                     │    │
│  │    path: "/articles/some-slug",                        │    │
│  │    method: "GET",                                      │    │
│  │    metadata: { status: 200, collection: "users" },    │    │
│  │    createdAt: ISODate("2026-01-15T...")               │    │
│  │  }                                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────┬───────────────────────┘
                                          │
                                          │ GET /api/metrics/all
                                          │ (pagination + filtering)
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD (/dashboard)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │  API Latency Chart      │  │  DB Latency Chart       │      │
│  │  (Line Chart)           │  │  (Area Chart)           │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │  Web Vitals Chart       │  │  Requests/Min Chart     │      │
│  │  (Line Chart)           │  │  (Bar Chart)            │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                  │
│  Built with Recharts - Real-time visualization                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Metric Types & Data Flow

### 1. Web Vitals (Frontend → API → DB)
```
Browser Performance API
   └─▶ reportWebVitals (app/reportWebVitals.ts)
       └─▶ sendClientMetric (lib/metrics/client.ts)
           └─▶ POST /api/metrics/webvitals
               └─▶ recordMetric (lib/metrics/server.ts)
                   └─▶ MongoDB (metrics collection)
```

### 2. Navigation (Frontend → API → DB)
```
useNavigationMetrics hook (hooks/useNavigationMetrics.ts)
   └─▶ Performance.now() timing
       └─▶ sendClientMetric (lib/metrics/client.ts)
           └─▶ POST /api/metrics/navigation
               └─▶ recordMetric (lib/metrics/server.ts)
                   └─▶ MongoDB (metrics collection)
```

### 3. API Performance (Server → DB)
```
API Route with withApiMetrics wrapper
   ├─▶ Start timer (performance.now())
   ├─▶ Execute handler
   ├─▶ Capture status code
   └─▶ recordMetric (lib/metrics/server.ts)
       └─▶ MongoDB (metrics collection)
```

### 4. Database Performance (Server → DB)
```
measureDb wrapper
   ├─▶ Start timer (performance.now())
   ├─▶ Execute Mongoose query
   ├─▶ Calculate duration
   └─▶ recordMetric (lib/metrics/server.ts)
       └─▶ MongoDB (metrics collection)
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MetricModel` | `src/models/metricModel.ts` | Mongoose schema for metrics |
| `recordMetric()` | `src/lib/metrics/server.ts` | Save metric to MongoDB |
| `withApiMetrics()` | `src/lib/metrics/server.ts` | Wrap API routes |
| `measureDb()` | `src/lib/metrics/server.ts` | Wrap DB queries |
| `sendClientMetric()` | `src/lib/metrics/client.ts` | Send from browser |
| `useNavigationMetrics()` | `src/hooks/useNavigationMetrics.ts` | Track route changes |
| Dashboard | `src/app/dashboard/page.tsx` | Visualize metrics |
| API Endpoints | `src/app/api/metrics/*` | Metric ingestion |

## Metric Schema

```typescript
{
  type: "webvital" | "navigation" | "api" | "db",
  name: string,              // e.g., "LCP", "GET /api/users"
  duration: number,          // milliseconds
  path: string,              // URL path
  method?: string,           // HTTP method
  metadata?: {               // Flexible object
    status?: number,         // HTTP status
    collection?: string,     // MongoDB collection
    id?: string,            // Custom identifier
    [key: string]: any
  },
  createdAt: Date            // Auto-generated timestamp
}
```

## Performance Considerations

- **Async Recording**: All metrics are recorded asynchronously (fire-and-forget)
- **No Blocking**: User requests are never blocked by metric collection
- **Keepalive**: Client-side uses `keepalive: true` for navigation metrics
- **Error Handling**: Metric failures are swallowed to avoid impacting UX
- **Lean Queries**: Dashboard uses `.lean()` for optimal MongoDB performance

## Production Tips

1. **Authentication**: Protect `/dashboard` and `/api/metrics/all` with middleware
2. **Sampling**: For high traffic, sample 10-20% of requests
3. **TTL Indexes**: Auto-delete metrics after 30 days
4. **Aggregation**: Pre-aggregate hourly/daily metrics for faster dashboards
5. **Rate Limiting**: Prevent metric endpoint abuse
6. **Monitoring**: Alert on metric collection failures

---

**Implementation Complete!** ✅

The system is production-ready and follows Next.js 14 App Router best practices.
