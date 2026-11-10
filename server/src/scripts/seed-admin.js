import bcrypt from 'bcrypt';
import { getSupabaseClient } from '../db/supabase.js';

const SALT_ROUNDS = 10;

export async function seedAdmin(options = {}) {
  const email = (options.email || process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  const password = options.password || process.env.ADMIN_SEED_PASSWORD || '';
  const fullName = options.fullName || process.env.ADMIN_SEED_NAME || 'IEM Admission Admin';
  const mobile = (options.mobile || process.env.ADMIN_SEED_MOBILE || '').trim();
  const countryCode = '+91';

  if (!email || !password || !mobile) {
    throw new Error('ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, and ADMIN_SEED_MOBILE must be configured.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_SEED_EMAIL must be a valid email address.');
  }
  if (!/^\d{10}$/.test(mobile)) {
    throw new Error('ADMIN_SEED_MOBILE must be a 10-digit number.');
  }

  console.log(`[Seed] Checking admin account for: ${email}`);

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Admin accounts must be seeded in the shared database.');
  }

  const { data: existingUser, error: lookupError } = await client
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Could not check the configured admin account: ${lookupError.message}`);
  }

  const { data: phoneOwner, error: phoneLookupError } = await client
    .from('users')
    .select('id, email')
    .eq('country_code', countryCode)
    .eq('mobile', mobile)
    .maybeSingle();

  if (phoneLookupError) {
    throw new Error(`Could not check the configured admin mobile: ${phoneLookupError.message}`);
  }
  if (phoneOwner && phoneOwner.id !== existingUser?.id) {
    throw new Error('ADMIN_SEED_MOBILE is already assigned to a different account.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const adminFields = {
    full_name: fullName,
    email,
    country_code: countryCode,
    mobile,
    password_hash: passwordHash,
    role: 'admin',
    is_verified: true,
    failed_login_attempts: 0,
    locked_until: null,
    consent: true,
    updated_at: new Date().toISOString(),
  };

  if (existingUser) {
    const { data: updatedAdmin, error } = await client
      .from('users')
      .update(adminFields)
      .eq('id', existingUser.id)
      .select('id, full_name, email, role, is_verified')
      .single();

    if (error) {
      console.error('Failed to update configured admin in Supabase:', error.message);
      throw error;
    }

    console.log(`✓ Updated configured admin account: ${updatedAdmin.email} (ID: ${updatedAdmin.id})`);
    return updatedAdmin;
  }

  const { data: newAdmin, error } = await client
    .from('users')
    .insert({
      ...adminFields,
      created_at: new Date().toISOString(),
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
