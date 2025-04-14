'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

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
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
        throw new Error('You must be logged in');
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
          console.warn('Subscription might already exist or constraint violation:', error.message);
        } else {
          throw error;
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error('Error saving subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="service_name" className="block text-sm font-medium mb-1 text-gray-300">
          Service Name
        </label>
        <input
          type="text"
          id="service_name"
          name="service_name"
          value={formData.service_name}
          onChange={handleChange}
          required
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
          placeholder="e.g., Netflix, Spotify"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1 text-gray-300">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
            placeholder="e.g., 9.99"
          />
        </div>
        <div>
          <label htmlFor="billing_cycle" className="block text-sm font-medium mb-1 text-gray-300">
            Billing Cycle
          </label>
          <select
            id="billing_cycle"
            name="billing_cycle"
            value={formData.billing_cycle}
            onChange={handleChange}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors appearance-none"
            required
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="next_due_date" className="block text-sm font-medium mb-1 text-gray-300">
          Next Due Date
        </label>
        <input
          type="date"
          id="next_due_date"
          name="next_due_date"
          value={formData.next_due_date}
          onChange={handleChange}
          required
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-700/50 mt-5">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Subscription' : 'Save Subscription')}
        </Button>
      </div>
    </form>
  );
} 