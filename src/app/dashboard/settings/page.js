'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

function SettingsContent() {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_current_period_end, stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#22c55e]/20 text-[#22c55e]">Active</span>;
      case 'past_due':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Past Due</span>;
      case 'canceled':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#71717a]/20 text-[#71717a]">Canceled</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-[#71717a]/20 text-[#71717a]">No Subscription</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="ValidateIRL Logo" className="w-8 h-8 rounded-lg" />
              ValidateIRL
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#a1a1aa] hidden sm:block">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-[#71717a] hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-[#71717a] hover:text-white transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Section */}
            <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Account</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#27272a]">
                  <div>
                    <p className="text-sm text-[#71717a]">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-sm text-[#71717a]">Account created</p>
                    <p className="font-medium">{formatDate(user?.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Subscription</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#27272a]">
                  <div>
                    <p className="text-sm text-[#71717a]">Status</p>
                    <div className="mt-1">{getStatusBadge(subscription?.subscription_status)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#27272a]">
                  <div>
                    <p className="text-sm text-[#71717a]">Plan</p>
                    <p className="font-medium">
                      {subscription?.subscription_status === 'active' ? 'Pro — $15/month' : 'No active plan'}
                    </p>
                  </div>
                </div>

                {subscription?.subscription_current_period_end && subscription?.subscription_status === 'active' && (
                  <div className="flex justify-between items-center py-3 border-b border-[#27272a]">
                    <div>
                      <p className="text-sm text-[#71717a]">Next billing date</p>
                      <p className="font-medium">{formatDate(subscription.subscription_current_period_end)}</p>
                    </div>
                  </div>
                )}

                {subscription?.stripe_customer_id && (
                  <div className="pt-4">
                    <button
                      onClick={openBillingPortal}
                      disabled={portalLoading}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {portalLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Manage Billing
                        </>
                      )}
                    </button>
                    <p className="text-xs text-[#71717a] mt-2">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                )}

                {subscription?.subscription_status === 'past_due' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm">
                      ⚠️ Your payment failed. Please update your payment method to keep access.
                    </p>
                    <button
                      onClick={openBillingPortal}
                      className="mt-3 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                    >
                      Update Payment Method
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#161618] border border-red-500/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">Sign out of all devices</p>
                    <p className="text-sm text-[#71717a]">This will sign you out everywhere</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}