import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value) {
  if (!value) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const withoutQuotes = trimmedValue.replace(/^['"]+|['"]+$/g, '');
  const withoutTrailingSlash = withoutQuotes.replace(/\/+$|\/rest\/v1\/?$/i, '');
  const normalized = withoutTrailingSlash.endsWith('/rest/v1')
    ? withoutTrailingSlash.replace(/\/rest\/v1$/i, '')
    : withoutTrailingSlash;

  return normalized || null;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables are missing or invalid. File uploads will fail until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default supabase;
