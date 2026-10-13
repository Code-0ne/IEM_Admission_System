import { createClient } from '@supabase/supabase-js';
import config from '../config.js';

let supabaseClient = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, serviceRoleKey, anonKey } = config.supabase;
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err.message);
    return null;
  }
}

export const supabase = getSupabaseClient();

/**
 * Health probe for Supabase connection.
 * Resolves with status object without throwing.
 */
export async function probeSupabase() {
  const { url, serviceRoleKey, anonKey } = config.supabase;
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    return {
      configured: false,
      ok: false,
      message: 'Supabase credentials not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)',
    };
  }

  try {
    const client = getSupabaseClient();
    if (!client) {
      return {
        configured: true,
        ok: false,
        message: 'Supabase client could not be initialized',
      };
    }

    // Lightweight query probe: attempts to read headers from users or courses table
    const { error } = await client.from('users').select('id', { head: true, count: 'exact' });

    if (error && error.code !== 'PGRST116') {
      return {
        configured: true,
        ok: false,
        message: error.message || 'Supabase query failed',
        code: error.code,
      };
    }

    return {
      configured: true,
      ok: true,
      message: 'Supabase connection healthy',
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      message: err.message || 'Supabase connection error',
    };
  }
}

export default supabase;
