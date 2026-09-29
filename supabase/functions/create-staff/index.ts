// Edge Function: create-staff
// Membuat akun karyawan (auth.users + profil). Hanya boleh dipanggil oleh admin aktif.
//
// Mengapa di server: membuat user butuh secret key (service role) yang tidak boleh ada di browser.
// Secret key ini disuntikkan otomatis oleh Supabase ke fungsi (SUPABASE_SERVICE_ROLE_KEY),
// tidak perlu disimpan di repo.
//
// Deploy:  npx supabase functions deploy create-staff --no-verify-jwt --use-api
// (JWT diverifikasi manual di bawah lewat auth.getUser, jadi gateway tidak perlu memeriksanya.)

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
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Payload {
  email?: unknown;
  password?: unknown;
  full_name?: unknown;
  phone?: unknown;
  role?: unknown;
  job_title?: unknown;
  branch_id?: unknown;
  commission_rate?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metode tidak didukung.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Konfigurasi server belum lengkap.' }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. Pemanggil harus login
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Anda belum masuk.' }, 401);
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: 'Sesi tidak valid. Masuk ulang.' }, 401);

  // 2. Pemanggil harus admin aktif (dicek dari database, bukan dari klaim di token)
  const { data: callerProfile } = await admin
    .from('profiles').select('role, is_active').eq('id', caller.user.id).maybeSingle();
  if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
    return json({ error: 'Hanya admin yang boleh menambah karyawan.' }, 403);
  }

  // 3. Validasi input
  let body: Payload;
  try { body = await req.json(); } catch { return json({ error: 'Format permintaan tidak valid.' }, 400); }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
  const role = body.role === 'admin' ? 'admin' : body.role === 'employee' ? 'employee' : null;
  const jobTitle = typeof body.job_title === 'string' ? body.job_title.trim() : '';
  const branchId = typeof body.branch_id === 'string' && body.branch_id ? body.branch_id : null;
  const rate = Number(body.commission_rate ?? 0);

  if (!EMAIL.test(email) || email.length > 254) return json({ error: 'Email tidak valid.' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'Kata sandi harus 8 sampai 72 karakter.' }, 400);
  if (fullName.length < 2 || fullName.length > 100) return json({ error: 'Nama lengkap harus 2 sampai 100 karakter.' }, 400);
  if (!role) return json({ error: 'Peran tidak valid.' }, 400);
  if (jobTitle.length < 2 || jobTitle.length > 40) return json({ error: 'Jabatan harus 2 sampai 40 karakter.' }, 400);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return json({ error: 'Komisi harus antara 0 dan 100 persen.' }, 400);
  if (branchId && !UUID.test(branchId)) return json({ error: 'Cabang tidak valid.' }, 400);
  if (role === 'employee' && !branchId) return json({ error: 'Karyawan harus ditempatkan di sebuah cabang.' }, 400);

  if (branchId) {
    const { data: branch } = await admin.from('branches').select('id').eq('id', branchId).maybeSingle();
    if (!branch) return json({ error: 'Cabang tidak ditemukan.' }, 400);
  }

  // 4. Buat akun. Trigger database membuat profil dengan role 'employee' tanpa cabang.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    const already = /already|registered|exists/i.test(createError?.message ?? '');
    return json({ error: already ? 'Email sudah terdaftar.' : 'Gagal membuat akun.' }, already ? 409 : 400);
  }

  // 5. Lengkapi profil. Jika gagal, batalkan akun agar tidak ada akun setengah jadi.
  const { error: profileError } = await admin.from('profiles').update({
    full_name: fullName,
    phone,
    role,
    job_title: jobTitle,
    branch_id: role === 'admin' ? null : branchId,
    commission_rate: role === 'admin' ? 0 : rate,
    is_active: true,
  }).eq('id', created.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'Gagal menyimpan profil karyawan.' }, 500);
  }

  return json({ id: created.user.id }, 201);
});
