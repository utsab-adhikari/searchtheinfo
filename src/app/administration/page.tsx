"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FilePlus,
  FileText,
  Globe,
  Edit3,
  Loader2,
  Activity,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  Image as ImageIcon,
  AlertTriangle,
  BarChart2,
  LineChart,
  PieChart,
  BarChart3,
  Settings,
} from "lucide-react";

interface ArticleLite {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  category?: { title: string };
  updatedAt: string;
}

interface Stats {
  totalDrafts: number;
  totalPublished: number;
  totalArticles: number;
  monthlyGrowth: number;
  avgEngagement: number;
}

interface ActivityItem {
  id: string;
  type: 'article_published' | 'user_registered' | 'article_edited';
  title: string;
  time: string;
  user?: string;
}

export default function AdministrationHome() {
  const [activeTab, setActiveTab] = useState<"drafts" | "published">("drafts");
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDrafts: 0,
    totalPublished: 0,
    totalArticles: 0,
    monthlyGrowth: 0,
    avgEngagement: 0
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [performanceData, setPerformanceData] = useState({
    views: [120, 180, 160, 220, 280, 300, 340],
    engagement: [45, 60, 55, 70, 85, 90, 95]
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch actual stats and articles data from APIs
      const [statsResponse, articlesResponse, activityResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/articles?status=${activeTab === 'drafts' ? 'draft' : 'published'}&limit=10`),
        fetch('/api/activity?limit=8')
      ]);

      // Process stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
        setPerformanceData(statsData.data.performanceData);
      }

      // Process articles
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData.data);
      }

      // Process activity
      if (activityResponse.ok) {
        const activityDataResponse = await activityResponse.json();
        setActivityData(activityDataResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to mock data if APIs fail
      setArticles([]);
      setStats({
        totalDrafts: 0,
        totalPublished: 0,
        totalArticles: 0,
        monthlyGrowth: 0,
        avgEngagement: 0
      });
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getSparklineColor = (growth: number) => {
    if (growth > 0) return 'text-emerald-400/80';
    if (growth < 0) return 'text-rose-400/80';
    return 'text-zinc-500';
  };

  return (
    <div className="max-w-[1920px] mx-auto space-y-6 pb-8 relative">
      {/* Breadcrumbs */}
      
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-emerald-400">Overview</span>
      </div>

      <div className="space-y-6">
        {/* Header with compact actions */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Monitor system performance and content analytics</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/administration/users"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Users</span>
            </Link>
            <Link 
              href="/editor/new"
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-900/20"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New Article
            </Link>
          </div>
        </header>

        {/* Enhanced Stats Grid - more compact and professional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            icon={<FileText className="w-4 h-4 text-amber-400" />} 
            label="Draft Articles" 
            value={stats.totalDrafts}
            change={2.5}
            bgColor="bg-amber-500/5"
            borderColor="border-amber-500/10"
          />
          <StatCard 
            icon={<Globe className="w-4 h-4 text-emerald-400" />} 
            label="Published Articles" 
            value={stats.totalPublished}
            change={8.3}
            bgColor="bg-emerald-500/5"
            borderColor="border-emerald-500/10"
          />
          <StatCard 
            icon={<TrendingUp className="w-4 h-4 text-blue-400" />} 
            label="Monthly Growth" 
            value={`${stats.monthlyGrowth}%`}
            change={stats.monthlyGrowth}
            bgColor="bg-blue-500/5"
            borderColor="border-blue-500/10"
          />
          <StatCard 
            icon={<Activity className="w-4 h-4 text-violet-400" />} 
            label="Avg. Engagement" 
            value={`${stats.avgEngagement}%`}
            change={3.2}
            bgColor="bg-violet-500/5"
            borderColor="border-violet-500/10"
          />
          <StatCard 
            icon={<Users className="w-4 h-4 text-cyan-400" />} 
            label="Active Users" 
            value="1.2K"
            change={5.1}
            bgColor="bg-cyan-500/5"
            borderColor="border-cyan-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area - Charts and Tables */}
          <div className="lg:col-span-8 space-y-6">
            {/* Performance Charts */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
              <div className="p-4 border-b border-zinc-800/30">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  Content Performance
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="Monthly Views" data={performanceData.views} color="emerald" />
                  <ChartCard title="Engagement Rate" data={performanceData.engagement} color="blue" />
                </div>
              </div>
            </div>

            {/* Articles Management */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/30">
                <h3 className="text-sm font-bold text-zinc-300">Recent {activeTab === 'drafts' ? 'Drafts' : 'Published'} Articles</h3>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setActiveTab("drafts")}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                      activeTab === 'drafts' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'text-zinc-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    Drafts ({stats.totalDrafts})
                  </button>
                  <button 
                    onClick={() => setActiveTab("published")}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                      activeTab === 'published' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-zinc-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    Published ({stats.totalPublished})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-800/30">
                    <tr>
                      <th className="text-left p-3 font-medium text-zinc-400">Title</th>
                      <th className="text-left p-3 font-medium text-zinc-400 hidden sm:table-cell">Category</th>
                      <th className="text-left p-3 font-medium text-zinc-400">Status</th>
                      <th className="text-left p-3 font-medium text-zinc-400 hidden md:table-cell">Last Updated</th>
                      <th className="text-right p-3 font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                          <td colSpan={5} className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-800 rounded animate-pulse"></div>
                              <div className="space-y-2 flex-1">
                                <div className="h-3 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                                <div className="h-2 bg-zinc-800 rounded w-1/2 animate-pulse"></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      articles.map((article) => (
                        <tr 
                          key={article._id} 
                          className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {article.status === 'draft' ? (
                                <Clock className="w-4 h-4 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                              <span className="font-medium text-white hover:text-emerald-400 transition-colors cursor-pointer">
                                {article.title}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-medium text-zinc-300">
                              {article.category?.title || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              article.status === 'draft' 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-3 hidden md:table-cell text-zinc-400">
                            {formatDate(article.updatedAt)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/editor/${article.slug}`}
                                className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Link>
                              <Link
                                href={`/articles/${article.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-zinc-800/30 bg-zinc-900/30 text-center">
                <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  View all articles →
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Activity and Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* System Status */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  System Status
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded">
                  All Systems Operational
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <StatusItem label="Database" value="99.9%" status="healthy" />
                <StatusItem label="API" value="99.8%" status="healthy" />
                <StatusItem label="Cache" value="99.5%" status="healthy" />
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/30">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Uptime</span>
                  <span>32 days, 14 hours</span>
                </div>
                <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.8%' }}></div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Recent Activity
                </h3>
                <Link href="#" className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {activityData.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 hover:bg-zinc-800/30 rounded-lg transition-colors">
                    <div className="mt-1">
                      {item.type === 'article_published' && (
                        <div className="w-1.5 h-6 bg-emerald-500/30 rounded-r-full"></div>
                      )}
                      {item.type === 'user_registered' && (
                        <div className="w-1.5 h-6 bg-blue-500/30 rounded-r-full"></div>
                      )}
                      {item.type === 'article_edited' && (
                        <div className="w-1.5 h-6 bg-amber-500/30 rounded-r-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-zinc-200">
                          {item.title}
                          {item.user && (
                            <span className="ml-1 text-zinc-500">by {item.user}</span>
                          )}
                        </p>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-cyan-400" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { icon: ImageIcon, label: 'Media Library', href: '/administration/media' },
                  { icon: BarChart3, label: 'Analytics', href: '/administration/analytics' },
                  { icon: Users, label: 'User Management', href: '/administration/users' },
                  { icon: Settings, label: 'System Settings', href: '/administration/settings' },
                ].map((action, i) => (
                  <Link 
                    key={i}
                    href={action.href}
                    className="flex items-center gap-2.5 p-2.5 bg-zinc-900/30 hover:bg-zinc-800/50 border border-zinc-800/30 rounded-lg text-[13px] text-zinc-300 hover:text-white transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <action.icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Stat Card with sparkline
function StatCard({ icon, label, value, change, bgColor, borderColor }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: number;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out`}>
      <div className="flex items-start justify-between">
        <div className="p-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
          {icon}
        </div>
        {change !== undefined && (
          <span className={`text-[11px] font-medium flex items-center gap-1 ${
            change >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-zinc-400 mt-1.5">{label}</p>
      <div className="flex items-end justify-between mt-1">
        <h3 className="text-lg font-bold text-white">{value}</h3>
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, data, color }: { title: string; data: number[]; color: string }) {
  const colorClasses = {
    emerald: 'text-emerald-400/80 fill-emerald-400/10',
    blue: 'text-blue-400/80 fill-blue-400/10',
    amber: 'text-amber-400/80 fill-amber-400/10',
    rose: 'text-rose-400/80 fill-rose-400/10'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-zinc-300">{title}</h4>
        <span className="text-[11px] text-emerald-400 font-medium">+12.4%</span>
      </div>
      <div className="h-32 flex items-end gap-1 p-1">
        {data.map((value, index) => (
          <div 
            key={index} 
            className={`flex-1 rounded-t ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-30`}
            style={{ height: `${(value / Math.max(...data)) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
      </div>
    </div>
  );
}

// Status Item Component
function StatusItem({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] text-zinc-400 mb-0.5">{label}</div>
      <div className="flex items-center justify-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
        }`}></div>
        <span className="text-[12px] font-medium text-white">{value}</span>
      </div>
    </div>
  );
}