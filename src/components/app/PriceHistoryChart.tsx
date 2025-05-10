'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { PriceHistory, PriceHistoryPoint } from '@/services/types';
import { useCurrency } from '@/contexts/currency-context';
import { format, parseISO, subDays } from 'date-fns';

interface PriceHistoryChartProps {
  priceHistory: PriceHistory | null;
  isLoading?: boolean;
}

/**
 * Price History Chart Component
 * 
 * Displays a chart of price history for a product
 */
export function PriceHistoryChart({ priceHistory, isLoading = false }: PriceHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [filteredData, setFilteredData] = useState<PriceHistoryPoint[]>([]);
  const { formatPrice, currencySymbol } = useCurrency();

  // Filter data based on selected time range
  useEffect(() => {
    if (!priceHistory) {
      setFilteredData([]);
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case 'all':
      default:
        // Use all data points
        setFilteredData(priceHistory.pricePoints);
        return;
    }

    // Filter data points within the selected time range
    const filtered = priceHistory.pricePoints.filter(point => {
      const pointDate = parseISO(point.date);
      return pointDate >= startDate;
    });

    setFilteredData(filtered);
  }, [timeRange, priceHistory]);

  // Format date for display in chart
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch (error) {
      return dateStr;
    }
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          <p className="text-sm text-primary">
            {currencySymbol}{payload[0].value.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.platform}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Price History</CardTitle>
          <CardDescription>Loading price history data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded-md w-full h-[250px]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!priceHistory || priceHistory.pricePoints.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Price History</CardTitle>
          <CardDescription>No price history data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              We'll start tracking this product's price history now.
              Check back later to see price trends.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine price trend icon and color
  const renderPriceTrend = () => {
    if (priceHistory.priceChangeDirection === 'up') {
      return (
        <Badge variant="destructive" className="ml-2">
          <ArrowUp className="h-3 w-3 mr-1" />
          {Math.abs(priceHistory.priceChange).toFixed(1)}%
        </Badge>
      );
    } else if (priceHistory.priceChangeDirection === 'down') {
      return (
        <Badge variant="success" className="ml-2">
          <ArrowDown className="h-3 w-3 mr-1" />
          {Math.abs(priceHistory.priceChange).toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="ml-2">
          <Minus className="h-3 w-3 mr-1" />
          Stable
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              Price History
              {renderPriceTrend()}
            </CardTitle>
            <CardDescription>
              Track price changes over time
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="30d" value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
          <TabsContent value={timeRange}>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate} 
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis 
                    tickFormatter={(value) => `${currencySymbol}${value}`}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={priceHistory.lowestPrice} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'Lowest', 
                      position: 'insideBottomLeft',
                      fill: '#10b981',
                      fontSize: 12
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Lowest</p>
                <p className="text-lg font-medium text-green-500">
                  {formatPrice(priceHistory.lowestPrice)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-lg font-medium">
                  {formatPrice(priceHistory.averagePrice)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Highest</p>
                <p className="text-lg font-medium text-red-500">
                  {formatPrice(priceHistory.highestPrice)}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
