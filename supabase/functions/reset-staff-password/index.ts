// Edge Function: reset-staff-password
// Admin mengatur ulang kata sandi karyawan. Hanya boleh dipanggil oleh admin aktif.
//
// Deploy:  npx supabase functions deploy reset-staff-password --no-verify-jwt --use-api
// (JWT diverifikasi manual di bawah lewat auth.getUser.)

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metode tidak didukung.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Konfigurasi server belum lengkap.' }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Anda belum masuk.' }, 401);
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: 'Sesi tidak valid. Masuk ulang.' }, 401);

  const { data: callerProfile } = await admin
    .from('profiles').select('role, is_active').eq('id', caller.user.id).maybeSingle();
  if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
    return json({ error: 'Hanya admin yang boleh mengatur ulang kata sandi.' }, 403);
  }

  let body: { user_id?: unknown; password?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Format permintaan tidak valid.' }, 400); }

  const userId = typeof body.user_id === 'string' ? body.user_id : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!UUID.test(userId)) return json({ error: 'Karyawan tidak valid.' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'Kata sandi harus 8 sampai 72 karakter.' }, 400);
  if (userId === caller.user.id) return json({ error: 'Gunakan menu Ganti kata sandi untuk akun Anda sendiri.' }, 400);

  const { data: target } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!target) return json({ error: 'Karyawan tidak ditemukan.' }, 404);

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return json({ error: 'Gagal mengatur ulang kata sandi.' }, 400);

  return json({ ok: true });
});
