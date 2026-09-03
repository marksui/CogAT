import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredOrigins = (Deno.env.get('ANALYTICS_ALLOWED_ORIGINS') ?? 'https://marksui.github.io')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && configuredOrigins.includes(origin) ? origin : configuredOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function readIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'Unavailable';
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST' || (origin && !configuredOrigins.includes(origin))) {
    return jsonResponse({ error: 'Not allowed.' }, 403, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Analytics service is not configured.' }, 500, origin);
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400, origin);
  }

  if (body.action === 'report') {
    const configuredPassword = Deno.env.get('ADMIN_ANALYTICS_PASSWORD');
    if (!configuredPassword || body.password !== configuredPassword) {
      return jsonResponse({ error: 'Wrong admin password.' }, 401, origin);
    }
    const { data, error } = await admin
      .from('visit_sessions')
      .select('session_id, visitor_id, started_at, last_seen_at, ended_at, duration_seconds, device_type, browser, os, screen, page_path, ip_address')
      .order('last_seen_at', { ascending: false })
      .limit(100);
    return error
      ? jsonResponse({ error: error.message }, 500, origin)
      : jsonResponse({ sessions: data ?? [] }, 200, origin);
  }

  const action = String(body.action ?? '');
  const sessionId = String(body.sessionId ?? '');
  const visitorId = String(body.visitorId ?? '').slice(0, 120);
  if (!['start', 'heartbeat', 'end'].includes(action) || !sessionId || !visitorId) {
    return jsonResponse({ error: 'Invalid analytics event.' }, 400, origin);
  }

  const now = new Date().toISOString();
  const durationSeconds = Math.min(86_400, Math.max(0, Math.round(Number(body.durationSeconds) || 0)));
  const row = {
    session_id: sessionId,
    visitor_id: visitorId,
    last_seen_at: now,
    ended_at: action === 'end' ? now : null,
    duration_seconds: durationSeconds,
    device_type: String(body.deviceType ?? '').slice(0, 40),
    browser: String(body.browser ?? '').slice(0, 40),
    os: String(body.os ?? '').slice(0, 40),
    screen: String(body.screen ?? '').slice(0, 30),
    page_path: String(body.pagePath ?? '').slice(0, 300),
    ip_address: readIp(request).slice(0, 120),
    user_agent: String(request.headers.get('user-agent') ?? '').slice(0, 500),
  };

  const query = action === 'start'
    ? admin.from('visit_sessions').upsert({ ...row, started_at: now }, { onConflict: 'session_id' })
    : admin.from('visit_sessions').update(row).eq('session_id', sessionId);
  const { error } = await query;
  return error
    ? jsonResponse({ error: error.message }, 500, origin)
    : jsonResponse({ ok: true }, 200, origin);
});
