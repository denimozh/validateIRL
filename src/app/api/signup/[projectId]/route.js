import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Receive signup from embedded form
export async function POST(req, { params }) {
  const { projectId } = params;

  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400, headers });
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404, headers });
    }

    // Check for duplicate email in this project
    const { data: existing } = await supabase
      .from('landing_page_signups')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return Response.json({ success: true, message: 'Already signed up' }, { headers });
    }

    // Insert signup
    const { error: insertError } = await supabase
      .from('landing_page_signups')
      .insert([{
        project_id: projectId,
        email: email.toLowerCase(),
        source: 'embed',
      }]);

    if (insertError) throw insertError;

    return Response.json({ success: true }, { headers });
  } catch (error) {
    console.error('Embed signup error:', error);
    return Response.json({ error: 'Failed to save signup' }, { status: 500, headers });
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}