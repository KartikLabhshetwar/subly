'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { FileDown, Trash2, LogOut } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getUser();
        
        if (data?.user) {
          setUser(data.user);
        } else {
          // Redirect to login if no user and not loading
          // router.push('/'); // Consider adding this if you want forced redirect
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No subscription data to export.");
        return;
      }

      // Convert data to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map(row => 
          headers.map(header => 
            `"${String(row[header]).replace(/"/g, '""')}"`
          ).join(",")
        )
      ].join("\n");

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "subly_subscriptions.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (!user) return;
    
    if (!confirm("Are you absolutely sure? This will delete all your subscription data and cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      alert("All subscription data deleted successfully.");
      // Optionally refresh data or redirect
      
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Failed to delete data. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-300">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6 px-4 md:py-8 max-w-4xl">
        <Card className="bg-gray-800/80 border border-gray-700">
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>You need to sign in to access settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-white">Account Settings</h1>
      
      <div className="flex flex-col gap-6">
        <Card className="bg-gray-800/80 border border-gray-700">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-medium truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1 text-gray-200">Email</h4>
                <p className="p-2 bg-gray-900/50 rounded-md truncate">{user.email}</p>
              </div>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border border-gray-700">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or delete your subscription data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-lg font-medium mb-2 text-white">Export Data</h4>
              <p className="text-sm text-gray-400 mb-3">Download all your subscription data as a CSV file.</p>
              <Button 
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-900/50"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Subscription Data (CSV)'}
              </Button>
            </div>
            
            <div className="pt-6 border-t border-gray-700">
              <h4 className="text-lg font-medium mb-2 text-red-400">Danger Zone</h4>
              <p className="text-sm text-gray-400 mb-3">Deleting your data is irreversible. Please be certain before proceeding.</p>
              <Button 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteData}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete All Subscription Data'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border border-gray-700">
          <CardHeader>
            <CardTitle>App Information</CardTitle>
            <CardDescription>About Subly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1 text-gray-200">Version</h4>
              <p className="text-sm text-gray-400">1.0.0</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1 text-gray-200">Made with</h4>
              <p className="text-sm text-gray-400">Next.js, Supabase, Tailwind CSS</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 