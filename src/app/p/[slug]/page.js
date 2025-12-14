import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import PublicLandingPage from '@/components/PublicLandingPage';

// Create a server-side supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: project } = await supabase
    .from('projects')
    .select('name, landing_page')
    .eq('landing_page_slug', slug)
    .eq('landing_page_published', true)
    .single();

  if (!project) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: project.landing_page?.headline || project.name,
    description: project.landing_page?.subheadline || '',
  };
}

export default async function LandingPageRoute({ params }) {
  const { slug } = await params;
  
  // Fetch the project with this slug
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, landing_page, landing_page_published')
    .eq('landing_page_slug', slug)
    .eq('landing_page_published', true)
    .single();

  if (error || !project) {
    notFound();
  }

  // Track page view
  await supabase.from('landing_page_views').insert({
    project_id: project.id,
    referrer: null, // Will be set client-side
  });

  return (
    <PublicLandingPage
      projectId={project.id}
      projectName={project.name}
      landingPage={project.landing_page}
    />
  );
}