'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { scanSubscriptionsFromGmail } from '@/lib/gmail-parser';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/lib/supabase';
import { Scan, CheckCircle, XCircle } from 'lucide-react';

type ScanSubscriptionsProps = {
  onScanComplete?: () => void;
  onCancel?: () => void;
  className?: string;
};

export function ScanSubscriptions({ onScanComplete, onCancel, className }: ScanSubscriptionsProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSubscriptions, setScannedSubscriptions] = useState<Partial<Subscription>[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get access token from Supabase auth session
  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (!session) {
      throw new Error('No active session. Please sign in with your Google account.');
    }
    
    if (!session.provider_token) {
      throw new Error('No Gmail access token available. Please sign out and sign in again with Google.');
    }
    
    return session.provider_token;
  };

  // Handle scan button click
  const handleScan = async () => {
    try {
      setIsScanning(true);
      setError(null);
      setShowResults(false);
      setScannedSubscriptions([]);
      
      // Get access token
      const accessToken = await getAccessToken();
      
      // Scan Gmail
      try {
        const subscriptions = await scanSubscriptionsFromGmail(accessToken);
        
        // If no subscriptions found, show a message but don't treat as error
        if (subscriptions.length === 0) {
          setError("No subscription emails were found. This could be because there are no emails matching our subscription patterns, or your Gmail access permission needs to be refreshed.");
          return;
        }
        
        // Initialize selected state for all subscriptions (default to selected)
        const initialSelectedState: { [key: string]: boolean } = {};
        subscriptions.forEach(sub => {
          if (sub.service_name) {
            initialSelectedState[sub.service_name] = true;
          }
        });
        
        setScannedSubscriptions(subscriptions);
        setSelectedSubscriptions(initialSelectedState);
        setShowResults(true);
      } catch (scanError) {
        // Handle specific Gmail API errors
        if (scanError instanceof Error) {
          if (scanError.message.includes('Authentication error') || scanError.message.includes('401')) {
            setError('Your Google authentication has expired. Please sign out and sign in again.');
          } else if (scanError.message.includes('Permission denied') || scanError.message.includes('403')) {
            setError('Access to Gmail was denied. Make sure you granted the "gmail.readonly" permission when signing in.');
          } else {
            setError(`Gmail scan error: ${scanError.message}`);
          }
        } else {
          setError('An unknown error occurred while scanning Gmail.');
        }
      }
    } catch (error) {
      console.error('Error in scan process:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle selection for a subscription
  const toggleSelection = (serviceName: string) => {
    setSelectedSubscriptions(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  // Save selected subscriptions to database
  const saveSelectedSubscriptions = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to save subscriptions');
      }
      
      // Filter selected subscriptions
      const subscriptionsToSave = scannedSubscriptions.filter(
        sub => sub.service_name && selectedSubscriptions[sub.service_name]
      );
      
      if (subscriptionsToSave.length === 0) {
        setError('No subscriptions selected to save');
        return;
      }
      
      // Add user_id and auto_detected flag to each subscription
      const subscriptionsWithUserId = subscriptionsToSave.map(sub => ({
        ...sub,
        user_id: user.id,
        auto_detected: true
      }));
      
      // Save to Supabase
      const { error: supabaseError } = await supabase
        .from('subscriptions')
        .insert(subscriptionsWithUserId);
      
      if (supabaseError) {
        if (supabaseError.code === '42P01') {
          throw new Error('The subscriptions table doesn\'t exist. Please create it in Supabase using the provided SQL script.');
        } else if (supabaseError.code === '23505') {
          setError('Some of these subscriptions may already exist in your account. Duplicate entries were ignored.');
        } else {
          throw new Error(`Database error: ${supabaseError.message}`);
        }
      }
      
      // Reset state and notify parent
      setShowResults(false);
      setScannedSubscriptions([]);
      if (onScanComplete) {
        onScanComplete();
      }
      
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      setError(error instanceof Error ? error.message : 'Failed to save subscriptions');
    } finally {
      setIsSaving(false);
    }
  };

  // Render subscription items in the results
  const renderSubscriptionItems = () => {
    if (scannedSubscriptions.length === 0 && !isScanning && !error) {
      return null;
    }
    if (scannedSubscriptions.length === 0 && !isScanning && error) {
      return null;
    }
    
    return (
      <div className="space-y-2 mt-4 max-h-80 overflow-y-auto p-1">
        {scannedSubscriptions.map((subscription, index) => (
          <div 
            key={index} 
            className="flex items-center p-3 border border-gray-700 bg-gray-800/60 rounded-md hover:bg-gray-800 transition-colors"
          >
            <input
              type="checkbox"
              id={`subscription-${index}`}
              checked={subscription.service_name ? selectedSubscriptions[subscription.service_name] : false}
              onChange={() => {
                if (subscription.service_name) {
                  toggleSelection(subscription.service_name);
                }
              }}
              className="mr-3 h-5 w-5 accent-purple-500 bg-gray-800 border-gray-700 rounded focus:ring-purple-500 focus:ring-offset-0"
            />
            <label htmlFor={`subscription-${index}`} className="flex-1 cursor-pointer">
              <div className="font-medium text-white">{subscription.service_name || 'Unknown Service'}</div>
              <div className="text-sm text-gray-400">
                ${subscription.amount?.toFixed(2) || 'N/A'} / {subscription.billing_cycle || 'unknown'}
              </div>
              {subscription.next_due_date && (
                <div className="text-sm text-gray-400">
                  Next due: {new Date(subscription.next_due_date).toLocaleDateString()}
                </div>
              )}
            </label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white">Scan Gmail for Subscriptions</h2>
      <p className="text-gray-400 text-sm">
        Connect your Gmail to automatically find subscription emails. 
        We only need read-only access to scan for common patterns.
      </p>
      
      {!showResults && (
        <Button
          onClick={handleScan}
          disabled={isScanning}
          variant="outline"
          className="border-purple-500 text-purple-400 hover:bg-purple-900/50"
        >
          <Scan className="mr-2 h-4 w-4" />
          {isScanning ? 'Scanning... Please wait' : 'Start Gmail Scan'}
        </Button>
      )}

      {error && !isScanning && (
        <div className="bg-red-900/30 text-red-300 border border-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showResults && (
        <div className="mt-4 space-y-4">
          <h3 className="font-semibold text-white">Found Subscriptions:</h3>
          <p className="text-sm text-gray-400">
            Select the subscriptions you want to add to your account.
          </p>
          {renderSubscriptionItems()}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              type="button" 
              onClick={onCancel}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              disabled={isSaving}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveSelectedSubscriptions}
              disabled={isSaving || scannedSubscriptions.length === 0 || Object.values(selectedSubscriptions).every(v => !v)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Add Selected Subscriptions'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 