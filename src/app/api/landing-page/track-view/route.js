import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, referrer, userAgent } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const { error } = await supabase.from('landing_page_views').insert({
      project_id: projectId,
      referrer: referrer || null,
      user_agent: userAgent || null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}