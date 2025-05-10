'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Search,
  ShoppingBag,
  Users,
  Trash2,
} from 'lucide-react';
import { getSearchAnalytics, getStoredEvents, clearStoredEvents } from '@/services/analytics';

export function AnalyticsDashboard() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState({
    totalSearches: 0,
    topSearches: [] as { query: string; count: number }[],
    averageResultCount: 0,
  });
  const [events, setEvents] = useState<any[]>([]);

  // Load analytics data when the dialog is opened
  useEffect(() => {
    if (open) {
      const searchAnalytics = getSearchAnalytics();
      setAnalytics(searchAnalytics);
      setEvents(getStoredEvents());
    }
  }, [open]);

  // Handle clearing analytics data
  const handleClearAnalytics = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearStoredEvents();
      setAnalytics({
        totalSearches: 0,
        topSearches: [],
        averageResultCount: 0,
      });
      setEvents([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md text-pink-400 hover:text-pink-300 hover:bg-purple-800/50">
          <Activity className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto bg-indigo-950 border border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-pink-400">Analytics Dashboard</DialogTitle>
          <DialogDescription className="text-purple-200">
            View analytics data for your ShopSavvy usage.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-indigo-900/50 border border-purple-500/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-pink-300">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="searches" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-pink-300">
              <Search className="h-4 w-4 mr-2" />
              Searches
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-pink-300">
              <Activity className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-pink-400">Total Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalSearches}</div>
                </CardContent>
              </Card>
              <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-pink-400">Avg. Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageResultCount.toFixed(0)}</div>
                </CardContent>
              </Card>
              <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-pink-400">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
              <CardHeader>
                <CardTitle className="text-pink-400">Recent Activity</CardTitle>
                <CardDescription className="text-purple-200">Your recent searches and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-center py-4 text-purple-300">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {events.slice(-5).reverse().map((event, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        {event.type === 'search' && <Search className="h-5 w-5 text-pink-400" />}
                        {event.type === 'product_view' && <ShoppingBag className="h-5 w-5 text-pink-400" />}
                        {event.type === 'page_view' && <Users className="h-5 w-5 text-pink-400" />}
                        {event.type === 'error' && <Activity className="h-5 w-5 text-red-400" />}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">{event.type.replace('_', ' ')}</p>
                          <p className="text-xs text-purple-300">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.type === 'search' && (
                            <p className="text-xs text-purple-200">
                              Query: "{event.data.query}" - {event.data.resultCount} results
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Searches Tab */}
          <TabsContent value="searches" className="space-y-4">
            <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
              <CardHeader>
                <CardTitle className="text-pink-400">Top Searches</CardTitle>
                <CardDescription className="text-purple-200">Your most frequent search queries</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topSearches.length === 0 ? (
                  <p className="text-center py-4 text-purple-300">No searches recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.topSearches.map((search, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-pink-400">{index + 1}.</span>
                          <span className="text-sm text-white">"{search.query}"</span>
                        </div>
                        <span className="text-sm text-purple-300">{search.count} searches</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
              <CardHeader>
                <CardTitle className="text-pink-400">Search Timeline</CardTitle>
                <CardDescription className="text-purple-200">Your search activity over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                <p className="text-purple-300">
                  Search timeline visualization would appear here in a full implementation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="bg-indigo-900/50 border border-purple-500/30 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-pink-400">All Events</CardTitle>
                  <CardDescription className="text-purple-200">Raw event data for debugging</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAnalytics}
                  className="h-8 bg-red-500 hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-center py-4 text-purple-300">No events recorded yet.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto border border-purple-500/30 rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-purple-500/30 bg-indigo-950/80">
                          <th className="py-2 px-4 text-left text-pink-400">Type</th>
                          <th className="py-2 px-4 text-left text-pink-400">Timestamp</th>
                          <th className="py-2 px-4 text-left text-pink-400">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.slice().reverse().map((event, index) => (
                          <tr key={index} className="border-b border-purple-500/30 hover:bg-indigo-900/30">
                            <td className="py-2 px-4 text-white">{event.type}</td>
                            <td className="py-2 px-4 text-purple-200">{new Date(event.timestamp).toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <pre className="text-xs overflow-x-auto max-w-[300px] text-purple-300">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
