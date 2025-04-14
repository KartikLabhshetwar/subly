import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a function to get subscriptions for a user
export async function getSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
  
  return data || [];
}

// Types for subscription data
export type Subscription = {
  id?: string;
  user_id?: string;
  service_name: string;
  amount: number;
  billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
  next_due_date: string;
  created_at?: string;
  logo_url?: string;
  category?: string;
  description?: string;
  auto_detected?: boolean;
}; 