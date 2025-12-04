'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client for server-side operations
async function createServerClient() {
  const cookieStore = await cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// For now, we'll use the client-side approach
// This file provides the data fetching functions

import { supabase } from '@/lib/supabase';

export async function getProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject({ userId, name, painDescription, targetAudience }) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        user_id: userId,
        name,
        pain_description: painDescription,
        target_audience: targetAudience,
        status: 'validating',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: updates.name,
      pain_description: updates.painDescription,
      target_audience: updates.targetAudience,
      status: updates.status,
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
  return true;
}

// Get project stats (signals, outreach counts)
export async function getProjectStats(projectId) {
  const { data: signals, error: signalsError } = await supabase
    .from('signals')
    .select('id')
    .eq('project_id', projectId);

  if (signalsError) throw signalsError;

  const { data: outreach, error: outreachError } = await supabase
    .from('outreach')
    .select('status')
    .eq('project_id', projectId);

  if (outreachError) throw outreachError;

  const stats = {
    totalSignals: signals?.length || 0,
    contacted: outreach?.filter(o => o.status !== 'found').length || 0,
    replied: outreach?.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length || 0,
    wouldPay: outreach?.filter(o => o.status === 'would_pay').length || 0,
  };

  return stats;
}