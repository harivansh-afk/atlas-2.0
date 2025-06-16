'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { Users, UserPlus, Search, BarChart3 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  free_users: number;
  pro_users: number;
}

interface UserSearchResult {
  user_id: string;
  email: string;
  found: boolean;
}

interface SubscriptionStatus {
  status: string;
  plan_name: string;
  price_id: string;
  messages_limit: number;
  current_usage: number;
  cancel_at_period_end?: boolean;
  current_period_end?: string;
}

interface UserSubscription {
  user_id: string;
  email: string;
  subscription_status: SubscriptionStatus;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingToPro, setAddingToPro] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast.error('Failed to load admin statistics');
    }
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!session?.access_token) {
      toast.error('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/search-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: searchEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResult(data);

        if (data.found) {
          // Load user subscription details
          await loadUserSubscription(data.user_id);
        } else {
          setUserSubscription(null);
          toast.error(`No user found with email: ${searchEmail}`);
        }
      } else {
        throw new Error('Failed to search user');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to search for user');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSubscription = async (userId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/admin/user/${userId}/subscription`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data);
      } else {
        throw new Error('Failed to load user subscription');
      }
    } catch (error) {
      console.error('Error loading user subscription:', error);
      toast.error('Failed to load user subscription details');
    }
  };

  const addUserToPro = async () => {
    if (!searchResult?.found || !searchResult.email) {
      toast.error('No user selected');
      return;
    }

    if (!session?.access_token) {
      toast.error('Not authenticated');
      return;
    }

    setAddingToPro(true);
    try {
      const response = await fetch(`${API_URL}/admin/add-user-to-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: searchResult.email,
          duration_months: 1
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);

        // Reload user subscription to show updated status
        if (searchResult.user_id) {
          await loadUserSubscription(searchResult.user_id);
        }

        // Reload stats
        await loadStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add user to pro plan');
      }
    } catch (error) {
      console.error('Error adding user to pro:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add user to pro plan');
    } finally {
      setAddingToPro(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'no_subscription':
        return 'secondary';
      case 'Admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-title">Admin Dashboard</h2>
        <p className="text-sm text-foreground/70">
          Manage users and subscriptions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.free_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pro_users}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* User Search and Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Search for users and manage their subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-email">Email Address</Label>
              <Input
                id="search-email"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchUser} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {searchResult && searchResult.found && userSubscription && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{userSubscription.email}</h4>
                  <p className="text-sm text-muted-foreground">User ID: {userSubscription.user_id}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(userSubscription.subscription_status.status)}>
                  {userSubscription.subscription_status.plan_name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span> {userSubscription.subscription_status.status}
                </div>
                <div>
                  <span className="font-medium">Messages Used:</span> {userSubscription.subscription_status.current_usage} / {userSubscription.subscription_status.messages_limit}
                </div>
              </div>

              {userSubscription.subscription_status.plan_name !== 'Admin' &&
               userSubscription.subscription_status.plan_name !== 'pro_75' && (
                <Button
                  onClick={addUserToPro}
                  disabled={addingToPro}
                  className="w-full"
                >
                  {addingToPro ? 'Adding to Pro...' : 'Add to Pro Plan'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
