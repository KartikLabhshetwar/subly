'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, isToday, isPast } from 'date-fns';
import { Loader2, AlertCircle, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

type SubscriptionListProps = {
  className?: string;
  onEdit?: (subscription: Subscription) => void;
};

export function SubscriptionList({ className, onEdit }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  );

  // Calculate when the subscription is due (relative to today)
  const getDueStatus = (nextDueDate: string | Date) => {
    try {
      const dueDate = new Date(nextDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
      dueDate.setHours(0, 0, 0, 0); // Normalize due date to the start of the day

      const diffDays = differenceInDays(dueDate, today);
      
      if (isPast(dueDate) && !isToday(dueDate)) { // Explicitly check if past and not today
        return { status: 'overdue', text: 'Overdue' };
      } else if (isToday(dueDate)) {
        return { status: 'due-today', text: 'Due today' };
      } else if (diffDays > 0 && diffDays <= 7) {
        return { status: 'due-soon', text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}` };
      } else if (diffDays > 7) {
        return { status: 'upcoming', text: `Due ${format(dueDate, 'MMM d, yyyy')}` };
      } else {
         // Should ideally not happen with normalized dates, but catchall
        return { status: 'unknown', text: 'Unknown date' };
      }
    } catch (e) {
      console.error("Error parsing date:", nextDueDate, e);
      return { status: 'error', text: 'Invalid date' };
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Set loading false but don't show an error, maybe a message
        setIsLoading(false);
        // setError('You must be logged in to view subscriptions');
        setSubscriptions([]); // Clear subscriptions if logged out
        return;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true }); // Keep ordering
      
      if (error) throw error;
      
      setSubscriptions(data || []);
      
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to load subscriptions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a subscription
  const handleDelete = async (id: string) => {
    // Use window.confirm for simplicity, consider a modal for better UX
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }
    
    try {
      // Optionally add a loading state for the specific item being deleted
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the list by filtering out the deleted item locally first for faster UI update
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      // Optionally call fetchSubscriptions() again if local update isn't sufficient
      
    } catch (error) {
      console.error('Error deleting subscription:', error);
      // Show a user-friendly error message (e.g., using a toast library)
      alert('Failed to delete subscription. Please try again.'); 
    }
  };

  // Load subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Handler to trigger refresh manually
  const handleRefresh = () => {
    fetchSubscriptions();
  };

  // Loading State UI
  if (isLoading) {
    return (
      <div className={cn("flex justify-center items-center py-16", className)}>
        <div className="text-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-400" />
          <p>Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  // Error State UI
  if (error) {
    return (
      <div className={cn("text-center py-12 border border-red-700/50 bg-red-900/20 rounded-lg p-6", className)}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p className="text-red-300 mb-4">{error}</p>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          className="border-red-400 text-red-400 hover:bg-red-900/40"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty State UI
  if (subscriptions.length === 0) {
    return (
      <div className={cn("text-center py-16 border border-gray-700 bg-gray-800/50 rounded-lg p-6", className)}>
        <p className="text-gray-300 mb-4">You haven&apos;t added any subscriptions yet.</p>
        {/* Consider linking to the add subscription action */}
        <Button 
          onClick={handleRefresh} // Or link to add page: onClick={() => router.push('...')} 
          variant="outline"
          className="border-purple-500 text-purple-400 hover:bg-purple-900/50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh List
        </Button>
      </div>
    );
  }

  // Main List UI
  return (
    <div className={cn("space-y-4", className)}> {/* Use space-y for gap */}
      {/* Optional Header for Total */}
      <div className="flex justify-between items-baseline mb-4 pb-2 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Your Subscriptions ({subscriptions.length})</h2>
        <div className="text-right">
          <p className="text-sm text-gray-400">Total Monthly Est.</p>
          <p className="text-xl font-bold text-white">${totalMonthlyCost.toFixed(2)}</p>
        </div>
      </div>
            
      {subscriptions.map((subscription) => {
        const dueStatus = getDueStatus(subscription.next_due_date);
        const statusColorClasses = {
          overdue: 'text-red-400',
          'due-today': 'text-yellow-400',
          'due-soon': 'text-orange-400',
          upcoming: 'text-gray-400',
          error: 'text-red-600', 
          unknown: 'text-gray-600',
        };
        
        return (
          <div 
            key={subscription.id} 
            // Enhanced card styling
            className="border border-gray-700 bg-gradient-to-r from-gray-800/70 to-gray-900/60 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-800/90 transition-all duration-200 shadow-md"
          >
            {/* Subscription Details */}
            <div className="flex-1 mb-3 sm:mb-0 sm:mr-4 overflow-hidden">
              <h3 className="font-semibold text-lg text-white truncate">{subscription.service_name}</h3>
              <p className="text-gray-400 text-sm">
                ${subscription.amount.toFixed(2)} / {subscription.billing_cycle}
              </p>
              <div className={cn(
                "text-sm mt-1 font-medium",
                statusColorClasses[dueStatus.status as keyof typeof statusColorClasses] || 'text-gray-500'
              )}>
                {dueStatus.text}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2 flex-shrink-0">
              {onEdit && (
                <Button 
                  onClick={() => onEdit(subscription)} 
                  size="sm" 
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/50 px-3 py-1.5"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span> {/* Show text on larger screens */} 
                </Button>
              )}
              <Button 
                onClick={() => handleDelete(subscription.id!)} 
                size="sm" 
                variant="destructive"
                // Consistent destructive style
                className="text-red-400 hover:text-white px-3 py-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span> {/* Show text on larger screens */} 
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 