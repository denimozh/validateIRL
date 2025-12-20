'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SubscriptionGate({ userId, email, children }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [periodEnd, setPeriodEnd] = useState(null);

  useEffect(() => {
    if (userId) {
      checkSubscription();
    }
  }, [userId]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_current_period_end')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      // Check if canceled but still within billing period
      if (data?.subscription_status === 'canceled' && data?.subscription_current_period_end) {
        const periodEnd = new Date(data.subscription_current_period_end);
        if (periodEnd > new Date()) {
          // Still has access until period ends
          setStatus('active_until_period_end');
          setPeriodEnd(periodEnd);
        } else {
          setStatus('canceled');
        }
      } else {
        setStatus(data?.subscription_status);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus('none');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If subscribed (or canceled but still in billing period), show the app
  if (status === 'active' || status === 'active_until_period_end') {
    // Show cancellation banner if ending soon
    if (status === 'active_until_period_end' && periodEnd) {
      const daysLeft = Math.ceil((periodEnd - new Date()) / (1000 * 60 * 60 * 24));
      return (
        <>
          <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-yellow-400 text-sm">
                ⚠️ Your subscription ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Resubscribe to keep access.
              </p>
              <button
                onClick={handleCheckout}
                className="px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium transition-colors"
              >
                Resubscribe
              </button>
            </div>
          </div>
          {children}
        </>
      );
    }
    return children;
  }

  // Otherwise show paywall
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo.svg" alt="ValidateIRL" className="w-10 h-10 rounded-lg" />
          <span className="text-xl font-bold text-white">ValidateIRL</span>
        </div>

        {/* Lock icon */}
        <div className="w-20 h-20 bg-[#161618] border border-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔒</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Subscribe to Access ValidateIRL
        </h1>
        <p className="text-[#a1a1aa] mb-8">
          Find real people, validate your ideas, and launch to customers who already said yes.
        </p>

        {/* Pricing card */}
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6 mb-6">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-4xl font-extrabold text-[#22c55e]">$15</span>
            <span className="text-[#71717a]">/month</span>
          </div>

          <div className="space-y-3 text-left mb-6">
            {[
              'Unlimited projects',
              'AI-powered signal discovery',
              'Outreach pipeline & tracking',
              'Landing page builder',
              'Personalized launch roadmap',
              'CSV export',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#a1a1aa] text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-[#0a0a0b] font-bold hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(34,197,94,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {checkoutLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#0a0a0b] border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              'Subscribe Now'
            )}
          </button>
        </div>

        <p className="text-sm text-[#71717a]">
          30-day money-back guarantee. Cancel anytime.
        </p>

        {/* Past due state */}
        {status === 'past_due' && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">
              ⚠️ Your payment failed. Please update your payment method to continue.
            </p>
          </div>
        )}

        {/* Canceled state */}
        {status === 'canceled' && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm">
              Your subscription has ended. Subscribe again to regain access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}