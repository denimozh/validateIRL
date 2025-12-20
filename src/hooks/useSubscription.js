'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_current_period_end, trial_end, stripe_customer_id')
        .eq('id', user.id)
        .single();

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = () => {
    if (!subscription) return false;
    
    const status = subscription.subscription_status;
    
    // Active statuses
    if (['active', 'trialing'].includes(status)) return true;
    
    // Check if still in grace period
    if (status === 'past_due') {
      const periodEnd = new Date(subscription.subscription_current_period_end);
      return periodEnd > new Date();
    }
    
    return false;
  };

  const isTrialing = () => {
    return subscription?.subscription_status === 'trialing';
  };

  const trialDaysRemaining = () => {
    if (!subscription?.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diff = trialEnd - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const startCheckout = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          returnUrl: window.location.origin,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  };

  const openPortal = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: window.location.href,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      throw error;
    }
  };

  return {
    subscription,
    loading,
    isActive: isActive(),
    isTrialing: isTrialing(),
    trialDaysRemaining: trialDaysRemaining(),
    startCheckout,
    openPortal,
    refresh: fetchSubscription,
  };
}