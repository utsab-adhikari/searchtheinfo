import { BetaAnalyticsDataClient } from "@google-analytics/data";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GA4_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL;
const GA4_PRIVATE_KEY = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!GA4_PROPERTY_ID) {
  console.warn("GA4_PROPERTY_ID is not set; Google Analytics dashboards will be empty.");
}

let analyticsClient: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient | null {
  if (!GA4_PROPERTY_ID || !GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    return null;
  }

  if (!analyticsClient) {
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GA4_CLIENT_EMAIL,
        private_key: GA4_PRIVATE_KEY,
      },
    });
  }

  return analyticsClient;
}

export type GaRealtimeOverview = {
  activeUsers: number;
  topPages: { pagePath: string; activeUsers: number }[];
};

export type GaTrafficOverview = {
  totalUsers: number;
  totalPageViews: number;
  byCountry: { country: string; users: number }[];
  byPage: { pagePath: string; pageViews: number }[];
};

export async function getRealtimeOverview(): Promise<GaRealtimeOverview | null> {
  const client = getClient();
  if (!client || !GA4_PROPERTY_ID) return null;

  const [response] = await client.runRealtimeReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "unifiedScreenName" }],
    limit: 10,
  });

  const rows = response.rows ?? [];
  const topPages = rows.map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value ?? "unknown",
    activeUsers: Number(row.metricValues?.[0]?.value ?? "0"),
  }));

  const activeUsers = topPages.reduce((sum, r) => sum + r.activeUsers, 0);

  return { activeUsers, topPages };
}

export async function getTrafficOverview(): Promise<GaTrafficOverview | null> {
  const client = getClient();
  if (!client || !GA4_PROPERTY_ID) return null;

  const [report] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
  });

  const totalUsers = Number(report.rows?.[0]?.metricValues?.[0]?.value ?? "0");
  const totalPageViews = Number(report.rows?.[0]?.metricValues?.[1]?.value ?? "0");

  const [countryReport] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "totalUsers" }],
    limit: 10,
  });

  const byCountry = (countryReport.rows ?? []).map((row) => ({
    country: row.dimensionValues?.[0]?.value ?? "Unknown",
    users: Number(row.metricValues?.[0]?.value ?? "0"),
  }));

  const [pageReport] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "unifiedScreenName" }],
    metrics: [{ name: "screenPageViews" }],
    limit: 10,
  });

  const byPage = (pageReport.rows ?? []).map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value ?? "unknown",
    pageViews: Number(row.metricValues?.[0]?.value ?? "0"),
  }));

  return { totalUsers, totalPageViews, byCountry, byPage };
}
