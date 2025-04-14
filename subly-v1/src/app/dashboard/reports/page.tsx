'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Clock } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface CategoryData {
  name: string;
  value: number;
  count: number;
}

interface CycleData {
  name: string;
  value: number;
  count: number;
}

interface TrendData {
  date: string;
  amount: number;
}

interface InsightData {
  type: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function ReportsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [cycleData, setCycleData] = useState<CycleData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);

  const COLORS = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16'  // Lime
  ];

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('You must be logged in to view reports');
          return;
        }
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setSubscriptions(data || []);
        
        // Process data for visualizations
        const categories = processCategories(data || []);
        const cycles = processBillingCycles(data || []);
        const trends = generateTrendData(data || []);
        
        setCategoryData(categories);
        setCycleData(cycles);
        setTrendData(trends);
        setInsights(generateInsights(data || [], categories, trends));
        
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setError('Failed to load subscription data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Calculate monthly cost based on billing cycle
  const calculateMonthlyCost = (subscription: Subscription) => {
    switch (subscription.billing_cycle) {
      case 'weekly':
        return subscription.amount * 4.33; // Average weeks in a month
      case 'yearly':
        return subscription.amount / 12;
      case 'quarterly':
        return subscription.amount / 3;
      default:
        return subscription.amount;
    }
  };

  const generateTrendData = (subscriptions: Subscription[]) => {
    const today = new Date();
    const sixMonthsAgo = addMonths(today, -6);
    const trendData: TrendData[] = [];

    // Generate data points for each month
    for (let i = 0; i <= 6; i++) {
      const monthDate = addMonths(sixMonthsAgo, i);
      const monthTotal = subscriptions.reduce((total, sub) => {
        const subStartDate = sub.created_at ? new Date(sub.created_at) : null;
        if (!subStartDate || subStartDate <= monthDate) {
          return total + calculateMonthlyCost(sub);
        }
        return total;
      }, 0);

      trendData.push({
        date: format(monthDate, 'MMM yyyy'),
        amount: parseFloat(monthTotal.toFixed(2))
      });
    }

    return trendData;
  };

  const generateInsights = (subscriptions: Subscription[], categoryData: CategoryData[], trendData: TrendData[]) => {
    const insights: InsightData[] = [];
    
    // Most expensive category
    if (categoryData.length > 0) {
      const mostExpensive = categoryData.reduce((prev, current) => 
        prev.value > current.value ? prev : current
      );
      const totalMonthlySpending = categoryData.reduce((total, cat) => total + cat.value, 0);
      
      if (totalMonthlySpending > 0) {
        insights.push({
          type: 'neutral',
          icon: <DollarSign className="w-5 h-5 text-purple-400" />,
          title: 'Highest Spending Category',
          description: `${mostExpensive.name} accounts for ${((mostExpensive.value / totalMonthlySpending) * 100).toFixed(0)}% of your monthly spending`
        });
      }
    }

    // Spending trend
    if (trendData.length >= 2) {
      const lastMonth = trendData[trendData.length - 1].amount;
      const previousMonth = trendData[trendData.length - 2].amount;
      
      if (previousMonth > 0) {
        const change = ((lastMonth - previousMonth) / previousMonth) * 100;
        
        if (Math.abs(change) > 0) {
          insights.push({
            type: change > 0 ? 'negative' : 'positive',
            icon: change > 0 ? 
              <TrendingUp className="w-5 h-5 text-red-400" /> : 
              <TrendingDown className="w-5 h-5 text-green-400" />,
            title: 'Monthly Spending Trend',
            description: `Your spending has ${change > 0 ? 'increased' : 'decreased'} by ${Math.min(Math.abs(change), 999).toFixed(1)}% compared to last month`
          });
        }
      } else if (lastMonth > 0) {
        insights.push({
          type: 'neutral',
          icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
          title: 'Monthly Spending Trend',
          description: 'First month of subscription tracking'
        });
      }
    }

    // Renewal clustering
    const upcomingRenewals = subscriptions.filter(sub => {
      const dueDate = new Date(sub.next_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0;
    });

    if (upcomingRenewals.length > 0) {
      insights.push({
        type: 'neutral',
        icon: <Calendar className="w-5 h-5 text-blue-400" />,
        title: 'Upcoming Renewals',
        description: `You have ${upcomingRenewals.length} subscription${upcomingRenewals.length > 1 ? 's' : ''} renewing in the next 7 days`
      });
    }

    return insights;
  };

  const processCategories = (subscriptions: Subscription[]): CategoryData[] => {
    const categories = new Map<string, { value: number; count: number }>();
    
    const categorizeSubscription = (serviceName: string): string => {
      serviceName = serviceName.toLowerCase();
      if (serviceName.match(/(netflix|spotify|hulu|disney|youtube|prime video|hbo|apple tv|paramount|peacock|crunchyroll|twitch)/)) {
        return 'Entertainment';
      } else if (serviceName.match(/(office|adobe|notion|atlassian|slack|zoom|asana|trello|monday|figma|canva|miro)/)) {
        return 'Productivity';
      } else if (serviceName.match(/(aws|cloud|hosting|domain|server|azure|google cloud|digitalocean|heroku|vercel|netlify)/)) {
        return 'Infrastructure';
      } else if (serviceName.match(/(gym|fitness|health|wellness|meditation|yoga|peloton|strava|myfitnesspal)/)) {
        return 'Health & Wellness';
      } else if (serviceName.match(/(phone|internet|utility|electricity|water|gas|mobile|broadband)/)) {
        return 'Utilities';
      } else if (serviceName.match(/(grammarly|duolingo|coursera|udemy|skillshare|masterclass|pluralsight|linkedin learning)/)) {
        return 'Education';
      } else if (serviceName.match(/(github|gitlab|jetbrains|unity|unreal|visual studio|intellij|webstorm)/)) {
        return 'Development';
      } else if (serviceName.match(/(norton|mcafee|avast|kaspersky|bitdefender|vpn|password|security)/)) {
        return 'Security';
      }
      return 'Other';
    };

    subscriptions.forEach(sub => {
      const category = categorizeSubscription(sub.service_name || '');
      const monthlyCost = calculateMonthlyCost(sub);
      const current = categories.get(category) || { value: 0, count: 0 };
      categories.set(category, {
        value: current.value + monthlyCost,
        count: current.count + 1
      });
    });

    return Array.from(categories).map(([name, data]) => ({
      name,
      value: parseFloat(data.value.toFixed(2)),
      count: data.count
    })).filter(cat => cat.value > 0);
  };

  const processBillingCycles = (subscriptions: Subscription[]): CycleData[] => {
    const cycles = new Map<string, { value: number; count: number }>();
    
    subscriptions.forEach(sub => {
      const cycle = (sub.billing_cycle || 'monthly').charAt(0).toUpperCase() + 
                   (sub.billing_cycle || 'monthly').slice(1);
      const monthlyCost = calculateMonthlyCost(sub);
      const current = cycles.get(cycle) || { value: 0, count: 0 };
      cycles.set(cycle, {
        value: current.value + monthlyCost,
        count: current.count + 1
      });
    });

    return Array.from(cycles).map(([name, data]) => ({
      name,
      value: parseFloat(data.value.toFixed(2)),
      count: data.count
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-300">Analyzing your subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="bg-red-500/20 text-red-400 border border-red-500/50 p-6 rounded-lg">
          <AlertCircle className="w-8 h-8 mb-2" />
          <h4 className="font-medium text-lg mb-2">Error Loading Reports</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const totalMonthlyCost = subscriptions.reduce(
    (total, subscription) => total + calculateMonthlyCost(subscription),
    0
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Subscription Analytics</h1>
        <p className="text-gray-400">
          {subscriptions.length} Active Subscription{subscriptions.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {subscriptions.length === 0 ? (
        <div className="bg-gray-800/80 rounded-lg p-8 border border-gray-700 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">No subscription data available yet.</p>
          <p className="text-gray-400 text-sm">Add some subscriptions to see detailed analytics and insights.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Monthly Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${totalMonthlyCost.toFixed(2)}</div>
                <p className="text-sm text-gray-400">Total monthly spending</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${(totalMonthlyCost / subscriptions.length).toFixed(2)}
                </div>
                <p className="text-sm text-gray-400">Per subscription</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Most Common</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {cycleData.reduce((a, b) => a.count > b.count ? a : b).name}
                </div>
                <p className="text-sm text-gray-400">Billing cycle</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Largest Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {categoryData.reduce((a, b) => a.value > b.value ? a : b).name}
                </div>
                <p className="text-sm text-gray-400">By spending</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary Section */}
          <Card className="bg-gray-800/80 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Breakdown of what you&apos;re paying for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.sort((a, b) => 
                  calculateMonthlyCost(b) - calculateMonthlyCost(a)
                ).map((subscription, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <div>
                        <h4 className="text-sm font-medium">{subscription.service_name}</h4>
                        <p className="text-xs text-gray-400">
                          {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)} · 
                          Next payment on {format(new Date(subscription.next_due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${calculateMonthlyCost(subscription).toFixed(2)}/mo</p>
                      <p className="text-xs text-gray-400">
                        ${subscription.amount.toFixed(2)}/{subscription.billing_cycle === 'monthly' ? 'mo' : 
                          subscription.billing_cycle === 'yearly' ? 'yr' : 
                          subscription.billing_cycle === 'quarterly' ? 'qtr' : 'wk'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {insights.map((insight, index) => (
              <Card 
                key={index} 
                className={cn(
                  "bg-gray-800/80 border-gray-700",
                  insight.type === 'positive' && "bg-green-900/20",
                  insight.type === 'negative' && "bg-red-900/20",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {insight.icon}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Spending Trend */}
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>Monthly spending over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        formatter={(value) => [`$${value}`, 'Amount']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ fill: '#8B5CF6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="bg-gray-800/80 border-gray-700">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        formatter={(value) => [`$${value}`, 'Amount']}
                      />
                      <Legend 
                        formatter={(value) => {
                          const item = categoryData.find(d => d.name === value);
                          return `${value} (${item?.count} subscription${item?.count !== 1 ? 's' : ''})`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Billing Cycle Distribution */}
            <Card className="bg-gray-800/80 border-gray-700 lg:col-span-2">
              <CardHeader>
                <CardTitle>Billing Cycle Analysis</CardTitle>
                <CardDescription>Distribution of subscriptions by billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cycleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        formatter={(value) => [`$${value}`, 'Amount']}
                      />
                      <Bar dataKey="value" fill="#8B5CF6">
                        {cycleData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 