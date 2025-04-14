'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, isToday, isPast } from 'date-fns';
import { Loader2, AlertCircle, RefreshCw, Edit, Trash2, CreditCard } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      toast.success('Subscription deleted successfully');
      
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("flex justify-center items-center py-16", className)}
      >
        <div className="text-center text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
          <p>Loading subscriptions...</p>
        </div>
      </motion.div>
    );
  }

  // Error State UI
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("text-center py-12 border border-destructive/50 bg-destructive/10 rounded-lg p-6", className)}
      >
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
        <p className="text-destructive mb-4">{error}</p>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  // Empty State UI
  if (subscriptions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("text-center py-16 border border-border bg-card/50 rounded-lg p-6", className)}
      >
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">You haven&apos;t added any subscriptions yet.</p>
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh List
        </Button>
      </motion.div>
    );
  }

  // Main List UI
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-6", className)}
    >
      {/* Header with Total */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-baseline mb-6 pb-4 border-b"
      >
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Your Subscriptions</h2>
          <p className="text-muted-foreground mt-1">{subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Monthly Est.</p>
          <p className="text-2xl font-bold text-foreground">${totalMonthlyCost.toFixed(2)}</p>
        </div>
      </motion.div>
            
      {/* Subscription List */}
      <AnimatePresence mode="popLayout">
        {subscriptions.map((subscription, index) => {
          const dueStatus = getDueStatus(subscription.next_due_date);
          const statusColorClasses = {
            overdue: 'text-destructive',
            'due-today': 'text-yellow-500',
            'due-soon': 'text-orange-500',
            upcoming: 'text-muted-foreground',
            error: 'text-destructive', 
            unknown: 'text-muted-foreground',
          };
          
          return (
            <motion.div 
              key={subscription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/0 group-hover:from-primary/10 transition-all duration-300 rounded-lg" />
              <div className="border bg-card hover:bg-card/80 rounded-lg p-6 relative transition-all duration-200 shadow-lg hover:shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Subscription Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {subscription.service_name}
                    </h3>
                    <p className="text-muted-foreground">
                      ${subscription.amount.toFixed(2)} / {subscription.billing_cycle}
                    </p>
                    <div className={cn(
                      "text-sm mt-1 font-medium",
                      statusColorClasses[dueStatus.status as keyof typeof statusColorClasses]
                    )}>
                      {dueStatus.text}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-shrink-0">
                    {onEdit && (
                      <Button 
                        onClick={() => onEdit(subscription)} 
                        size="sm" 
                        variant="outline"
                        className="relative overflow-hidden group/btn"
                      >
                        <span className="absolute inset-0 bg-primary/10 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-200" />
                        <Edit className="h-4 w-4 mr-2" />
                        <span className="relative">Edit</span>
                      </Button>
                    )}
                    <Button 
                      onClick={() => handleDelete(subscription.id!)} 
                      size="sm" 
                      variant="destructive"
                      className="relative overflow-hidden group/btn"
                    >
                      <span className="absolute inset-0 bg-destructive/20 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-200" />
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="relative">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
} 