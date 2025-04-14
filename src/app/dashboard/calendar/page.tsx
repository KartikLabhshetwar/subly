'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isToday, isSameMonth, isSameWeek } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, AlertCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('You must be logged in to view your calendar');
          return;
        }
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setSubscriptions(data || []);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setError('Failed to load subscription data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Group subscriptions
  const dueTodaySubscriptions = subscriptions.filter(sub => 
    isToday(new Date(sub.next_due_date))
  );
  
  const dueThisWeekSubscriptions = subscriptions.filter(sub => {
    const dueDate = new Date(sub.next_due_date);
    const today = new Date();
    const isThisWeek = isSameWeek(dueDate, today);
    return isThisWeek && !isToday(dueDate);
  });
  
  const dueThisMonthSubscriptions = subscriptions.filter(sub => {
    const dueDate = new Date(sub.next_due_date);
    const today = new Date();
    const isThisMonth = isSameMonth(dueDate, today);
    return isThisMonth && !isSameWeek(dueDate, today);
  });
  
  const upcomingSubscriptions = subscriptions.filter(sub => {
    const dueDate = new Date(sub.next_due_date);
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const isNextMonth = dueDate >= nextMonth;
    return isNextMonth;
  }).slice(0, 10); // Limit to 10 future subscriptions

  // Total due calculations
  const totalDueToday = dueTodaySubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const totalDueThisWeek = dueThisWeekSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const totalDueThisMonth = dueThisMonthSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  // Show loader while fetching data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading your subscription calendar...</p>
        </div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="bg-red-500/20 text-red-400 border border-red-500/50 p-6 rounded-lg">
          <AlertCircle className="w-8 h-8 mb-2" />
          <h4 className="font-medium text-lg mb-2">Error Loading Calendar</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Payment Calendar</h1>
        <p className="text-gray-400">
          {subscriptions.length} Active Subscription{subscriptions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalDueToday.toFixed(2)}</div>
            <p className="text-sm text-gray-400">{dueTodaySubscriptions.length} payment{dueTodaySubscriptions.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalDueThisWeek.toFixed(2)}</div>
            <p className="text-sm text-gray-400">{dueThisWeekSubscriptions.length} payment{dueThisWeekSubscriptions.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${(totalDueToday + totalDueThisWeek + totalDueThisMonth).toFixed(2)}</div>
            <p className="text-sm text-gray-400">Total monthly payments</p>
          </CardContent>
        </Card>
      </div>
      
      {subscriptions.length === 0 ? (
        <div className="bg-gray-800/80 rounded-lg p-8 border border-gray-700 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">No subscription data available yet.</p>
          <p className="text-gray-400 text-sm">Add some subscriptions to see your payment calendar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Due Today */}
          <Card className={cn(
            dueTodaySubscriptions.length > 0 
              ? "bg-orange-500/20 border-orange-500/30" 
              : "bg-gray-800/80 border-gray-700"
          )}>
            <CardHeader>
              <CardTitle className={dueTodaySubscriptions.length > 0 ? "text-orange-400" : ""}>
                Due Today
              </CardTitle>
              <CardDescription>
                {dueTodaySubscriptions.length > 0 
                  ? `${dueTodaySubscriptions.length} payment${dueTodaySubscriptions.length > 1 ? 's' : ''} due today`
                  : "No payments due today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dueTodaySubscriptions.map((subscription, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-orange-500/30 bg-orange-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{subscription.service_name}</h4>
                        <p className="text-sm text-gray-400">
                          {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${subscription.amount.toFixed(2)}</p>
                      <p className="text-sm text-orange-400">Due today</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Due This Week */}
          <Card className={cn(
            dueThisWeekSubscriptions.length > 0 
              ? "bg-blue-500/20 border-blue-500/30" 
              : "bg-gray-800/80 border-gray-700"
          )}>
            <CardHeader>
              <CardTitle className={dueThisWeekSubscriptions.length > 0 ? "text-blue-400" : ""}>
                Due This Week
              </CardTitle>
              <CardDescription>
                {dueThisWeekSubscriptions.length > 0 
                  ? `${dueThisWeekSubscriptions.length} payment${dueThisWeekSubscriptions.length > 1 ? 's' : ''} due this week`
                  : "No payments due this week"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dueThisWeekSubscriptions.map((subscription, index) => (
                  <div key={index} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border bg-blue-500/10 border-blue-500/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{subscription.service_name}</h4>
                        <p className="text-sm text-gray-400">
                          {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${subscription.amount.toFixed(2)}</p>
                      <p className="text-sm text-blue-400">Due {format(new Date(subscription.next_due_date), 'EEE, MMM d')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Due Later This Month */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardHeader>
              <CardTitle>
                Due Later This Month
              </CardTitle>
              <CardDescription>
                {dueThisMonthSubscriptions.length > 0 
                  ? `${dueThisMonthSubscriptions.length} upcoming payment${dueThisMonthSubscriptions.length > 1 ? 's' : ''} this month`
                  : "No other payments due this month"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dueThisMonthSubscriptions.map((subscription, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{subscription.service_name}</h4>
                        <p className="text-sm text-gray-400">
                          {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${subscription.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">Due {format(new Date(subscription.next_due_date), 'EEE, MMM d')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Next Month */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardHeader>
              <CardTitle>
                Upcoming Payments
              </CardTitle>
              <CardDescription>
                Future payments in the coming months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSubscriptions.length > 0 ? (
                  upcomingSubscriptions.map((subscription, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">{subscription.service_name}</h4>
                          <p className="text-sm text-gray-400">
                            {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${subscription.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">Due {format(new Date(subscription.next_due_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400">No upcoming payments scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 