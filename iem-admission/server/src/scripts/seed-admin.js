import bcrypt from 'bcrypt';
import config from '../config.js';
import { getSupabaseClient } from '../db/supabase.js';

const SALT_ROUNDS = 10;

export async function seedAdmin(options = {}) {
  const email = (options.email || process.env.ADMIN_SEED_EMAIL || 'admin@iem.edu.in').trim().toLowerCase();
  const password = options.password || process.env.ADMIN_SEED_PASSWORD || 'Admin@IEM2026!';
  const fullName = options.fullName || process.env.ADMIN_SEED_NAME || 'IEM Admission Admin';
  const mobile = (options.mobile || process.env.ADMIN_SEED_MOBILE || '9876500000').trim();
  const countryCode = '+91';

  console.log(`[Seed] Checking admin account for: ${email}`);

  const client = getSupabaseClient();
  if (client) {
    const { data: existingAdmin } = await client
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    if (existingAdmin) {
      console.log(`✓ Admin user already exists with ID: ${existingAdmin.id}`);
      return existingAdmin;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { data: newAdmin, error } = await client
      .from('users')
      .insert({
        full_name: fullName,
        email,
        country_code: countryCode,
        mobile,
        password_hash: passwordHash,
        role: 'admin',
        is_verified: true,
        consent: true,
      })
      .select('id, full_name, email, role, is_verified')
      .single();

    if (error) {
      console.error('Failed to seed admin in Supabase:', error.message);
      throw error;
    }

    console.log(`✓ Successfully created admin user: ${newAdmin.email} (ID: ${newAdmin.id})`);
    return newAdmin;
  }

  console.log('Notice: Supabase credentials not set in .env. Admin seed script requires database connection.');
  return null;
}

// Run directly from command line
if (process.argv[1]?.endsWith('seed-admin.js')) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed script error:', err);
      process.exit(1);
    });
}

export default seedAdmin;
