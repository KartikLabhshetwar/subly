'use client'

import { useState, useEffect } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, BarChart3, FileText, ArrowUpRight, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Subscription } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch subscriptions to calculate stats
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // Fetch subscriptions from Supabase
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }
        
        setSubscriptions(data || []);
        
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
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

  // Calculate total monthly cost
  const totalMonthlyCost = subscriptions.reduce(
    (total, subscription) => total + calculateMonthlyCost(subscription),
    0
  ).toFixed(2);

  // Calculate yearly cost
  const yearlyTotal = (parseFloat(totalMonthlyCost) * 12).toFixed(2);

  // Calculate subscriptions due this week
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const dueThisWeek = subscriptions.filter(sub => {
    const dueDate = new Date(sub.next_due_date);
    return dueDate >= today && dueDate <= nextWeek;
  }).length;

  // Get most expensive subscriptions
  const sortedSubscriptions = [...subscriptions].sort((a, b) => 
    calculateMonthlyCost(b) - calculateMonthlyCost(a)
  );
  
  const topSubscriptions = sortedSubscriptions.slice(0, 3);

  return (
    <div className="container mx-auto py-6 px-4 md:py-8 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex space-x-3">
            <Button 
              onClick={() => router.push('/dashboard/subscriptions')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-300">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Monthly Spend"
                value={`$${totalMonthlyCost}`}
                icon={<BarChart3 className="h-5 w-5 text-purple-400" />}
              />
              <StatCard
                title="Active Subscriptions"
                value={subscriptions.length.toString()}
                icon={<FileText className="h-5 w-5 text-blue-400" />}
              />
              <StatCard
                title="Yearly Spend"
                value={`$${yearlyTotal}`}
                icon={<BarChart3 className="h-5 w-5 text-indigo-400" />}
              />
              <StatCard
                title="Due This Week"
                value={dueThisWeek.toString()}
                icon={<FileText className="h-5 w-5 text-teal-400" />}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Subscription Overview */}
              <Card className="lg:col-span-2 bg-gray-800/80 border border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle>Subscription Overview</CardTitle>
                      <CardDescription>Your top 3 monthly expenses</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/dashboard/subscriptions')}
                      className="border-purple-500 text-purple-400 hover:bg-purple-900/50"
                    >
                      View All
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {topSubscriptions.length > 0 ? (
                    <div className="space-y-3">
                      {topSubscriptions.map((subscription) => (
                        <div 
                          key={subscription.id} 
                          className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg"
                        >
                          <div className="flex-1 overflow-hidden mr-2">
                            <h3 className="font-medium text-white truncate">{subscription.service_name}</h3>
                            <p className="text-sm text-gray-400">
                              Next due: {new Date(subscription.next_due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-white">${calculateMonthlyCost(subscription).toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{subscription.billing_cycle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No subscriptions found</p>
                      <Button 
                        onClick={() => router.push('/dashboard/subscriptions')}
                        variant="link" 
                        className="text-purple-400 hover:text-purple-300 mt-2"
                      >
                        Add your first subscription
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links & Reports */}
              <Card className="bg-gray-800/80 border border-gray-700">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your subscriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => router.push('/dashboard/subscriptions')}
                    variant="outline" 
                    className="w-full justify-start text-left border-blue-400 text-blue-400 hover:bg-blue-500/10"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Subscriptions
                  </Button>
                  <Button 
                    onClick={() => router.push('/dashboard/reports')}
                    variant="outline" 
                    className="w-full justify-start text-left border-purple-400 text-purple-400 hover:bg-purple-500/10"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                  <Button 
                    onClick={() => router.push('/dashboard/settings')}
                    variant="outline" 
                    className="w-full justify-start text-left border-teal-400 text-teal-400 hover:bg-teal-500/10"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 