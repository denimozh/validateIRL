import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  const { projectId } = params;

  // Verify project exists
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (!project) {
    return new Response('// Project not found', {
      status: 404,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://validateirl.com';

  const script = `
(function() {
  // ValidateIRL Embed Script
  var PROJECT_ID = '${projectId}';
  var API_URL = '${baseUrl}/api/embed/signup/' + PROJECT_ID;

  // Find the container
  var container = document.getElementById('validateirl-form');
  if (!container) {
    console.error('ValidateIRL: No element with id="validateirl-form" found');
    return;
  }

  // Get custom attributes
  var buttonText = container.getAttribute('data-button-text') || 'Join Waitlist';
  var placeholder = container.getAttribute('data-placeholder') || 'Enter your email';
  var successMessage = container.getAttribute('data-success') || 'You\\'re on the list! 🎉';
  var theme = container.getAttribute('data-theme') || 'dark';

  // Styles
  var isDark = theme === 'dark';
  var styles = {
    form: 'display:flex;gap:8px;flex-wrap:wrap;',
    input: 'flex:1;min-width:200px;padding:12px 16px;border-radius:8px;border:1px solid ' + (isDark ? '#333' : '#ddd') + ';background:' + (isDark ? '#1a1a1a' : '#fff') + ';color:' + (isDark ? '#fff' : '#000') + ';font-size:14px;outline:none;',
    button: 'padding:12px 24px;border-radius:8px;border:none;background:#22c55e;color:#000;font-weight:600;font-size:14px;cursor:pointer;transition:background 0.2s;',
    success: 'padding:12px 16px;border-radius:8px;background:' + (isDark ? '#052e16' : '#dcfce7') + ';color:#22c55e;font-size:14px;text-align:center;',
    error: 'padding:12px 16px;border-radius:8px;background:' + (isDark ? '#2d1b1b' : '#fee2e2') + ';color:#ef4444;font-size:14px;text-align:center;margin-top:8px;'
  };

  // Create form HTML
  container.innerHTML = '<form id="virl-form" style="' + styles.form + '">' +
    '<input type="email" id="virl-email" placeholder="' + placeholder + '" required style="' + styles.input + '">' +
    '<button type="submit" id="virl-btn" style="' + styles.button + '">' + buttonText + '</button>' +
    '</form>' +
    '<div id="virl-message" style="display:none;margin-top:8px;"></div>';

  // Handle submit
  var form = document.getElementById('virl-form');
  var emailInput = document.getElementById('virl-email');
  var button = document.getElementById('virl-btn');
  var messageDiv = document.getElementById('virl-message');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    var email = emailInput.value.trim();
    if (!email) return;

    button.disabled = true;
    button.textContent = 'Joining...';

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        form.style.display = 'none';
        messageDiv.style.cssText = styles.success + 'display:block;';
        messageDiv.textContent = successMessage;
      } else {
        throw new Error(data.error || 'Failed');
      }
    })
    .catch(function(err) {
      messageDiv.style.cssText = styles.error + 'display:block;';
      messageDiv.textContent = 'Something went wrong. Please try again.';
      button.disabled = false;
      button.textContent = buttonText;
    });
  });

  // Button hover effect
  button.addEventListener('mouseenter', function() { this.style.background = '#16a34a'; });
  button.addEventListener('mouseleave', function() { this.style.background = '#22c55e'; });
})();
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}