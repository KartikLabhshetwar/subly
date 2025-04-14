'use client';

import { useState } from 'react';
import { SubscriptionList } from '@/components/subscription-list';
import { Button } from '@/components/ui/button';
import { PlusCircle, Scan } from 'lucide-react';
import { SubscriptionForm } from '@/components/subscription-form';
import { ScanSubscriptions } from '@/components/scan-subscriptions';
import { Subscription } from '@/lib/supabase';

export default function SubscriptionsPage() {
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const handleAddNew = () => {
    setEditingSubscription(null);
    setIsAddingOrEditing(true);
    setIsScanning(false);
  };

  const handleScan = () => {
    setIsScanning(true);
    setIsAddingOrEditing(false);
    setEditingSubscription(null);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsAddingOrEditing(true);
    setIsScanning(false);
  };

  const handleCloseForms = () => {
    setIsAddingOrEditing(false);
    setIsScanning(false);
    setEditingSubscription(null);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          
          {!isAddingOrEditing && !isScanning && (
            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                onClick={handleAddNew}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Subscription
              </Button>
              <Button
                onClick={handleScan}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-900/50"
              >
                <Scan className="mr-2 h-4 w-4" />
                Scan Gmail
              </Button>
            </div>
          )}

          {(isAddingOrEditing || isScanning) && (
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-5 mb-6 shadow-md">
              {isAddingOrEditing && (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-white">
                    {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
                  </h2>
                  <SubscriptionForm
                    subscription={editingSubscription}
                    onSuccess={handleCloseForms}
                    onCancel={handleCloseForms}
                  />
                </>
              )}
              {isScanning && (
                <ScanSubscriptions 
                  onScanComplete={handleCloseForms}
                  onCancel={handleCloseForms}
                />
              )}
            </div>
          )}

          <SubscriptionList 
            className="mt-0"
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
} 