import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Zap,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
} from 'lucide-react';
import { UsageChart } from '@/components/analytics/usage-chart';
import { CostChart } from '@/components/analytics/cost-chart';
import { ActivityFeed } from '@/components/analytics/activity-feed';

// Mock data - would come from database in production
const kpiData = {
  totalChats: 1247,
  chatsTrend: '+12.5%',
  tokensUsed: 3456789,
  tokensTrend: '+8.2%',
  totalCost: 234.56,
  costTrend: '-3.1%',
  avgResponseTime: 1.8,
  responseTrend: '-15.3%',
  activeUsers: 42,
  usersTrend: '+23.1%',
  successRate: 98.5,
  rateTrend: '+1.2%',
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Track your AI usage, costs, and performance metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalChats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{kpiData.chatsTrend}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.tokensUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{kpiData.tokensTrend}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpiData.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{kpiData.costTrend}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{kpiData.responseTrend}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{kpiData.usersTrend}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{kpiData.rateTrend}</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat & Token Usage</CardTitle>
              <CardDescription>
                Daily chat sessions and token consumption over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>
                Daily costs by provider and model over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest chat sessions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
