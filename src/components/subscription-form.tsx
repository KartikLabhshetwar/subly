'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type SubscriptionFormProps = {
  subscription?: Subscription | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
};

export function SubscriptionForm({
  subscription,
  onSuccess,
  onCancel,
  className,
}: SubscriptionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Subscription>>({
    service_name: '',
    amount: 0,
    billing_cycle: 'monthly',
    next_due_date: new Date().toISOString().split('T')[0],
  });

  const isEditing = !!subscription;

  useEffect(() => {
    if (isEditing && subscription) {
      setFormData({
        service_name: subscription.service_name || '',
        amount: subscription.amount || 0,
        billing_cycle: subscription.billing_cycle || 'monthly',
        next_due_date: subscription.next_due_date
          ? new Date(subscription.next_due_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        service_name: '',
        amount: 0,
        billing_cycle: 'monthly',
        next_due_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [subscription, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const dataToSave = {
        ...formData,
        user_id: user.id,
        amount: Number(formData.amount) || 0,
      };

      let error;

      if (isEditing && subscription?.id) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(dataToSave)
          .eq('id', subscription.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({ ...dataToSave, auto_detected: false });
        error = insertError;
      }
            
      if (error) {
        if (error.code === '23505') {
          toast.warning('This subscription already exists');
        } else {
          throw error;
        }
        return;
      }
      
      toast.success(isEditing ? 'Subscription updated!' : 'Subscription added!');
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error('Error saving subscription:', err);
      toast.error('Failed to save subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
    >
      <div className="space-y-2">
        <label htmlFor="service_name" className="block text-sm font-medium text-foreground/80">
          Service Name
        </label>
        <motion.div
          whileTap={{ scale: 0.995 }}
          className="relative group"
        >
          <input
            type="text"
            id="service_name"
            name="service_name"
            value={formData.service_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
            placeholder="e.g., Netflix, Spotify"
          />
          <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-foreground/80">
            Amount
          </label>
          <motion.div
            whileTap={{ scale: 0.995 }}
            className="relative group"
          >
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full pl-8 pr-4 py-2.5 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
                placeholder="0.00"
              />
            </div>
            <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </motion.div>
        </div>
        <div className="space-y-2">
          <label htmlFor="billing_cycle" className="block text-sm font-medium text-foreground/80">
            Billing Cycle
          </label>
          <motion.div
            whileTap={{ scale: 0.995 }}
            className="relative group"
          >
            <select
              id="billing_cycle"
              name="billing_cycle"
              value={formData.billing_cycle}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-background border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200 appearance-none"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </motion.div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="next_due_date" className="block text-sm font-medium text-foreground/80">
          Next Due Date
        </label>
        <motion.div
          whileTap={{ scale: 0.995 }}
          className="relative group"
        >
          <input
            type="date"
            id="next_due_date"
            name="next_due_date"
            value={formData.next_due_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-background border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
          />
          <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-end gap-3 pt-4 border-t"
      >
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="px-4 py-2 hover:bg-secondary/80"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? 'Updating...' : 'Saving...'}
            </span>
          ) : (
            isEditing ? 'Update Subscription' : 'Save Subscription'
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
} 