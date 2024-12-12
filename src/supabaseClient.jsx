import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bveaeajkjyrnfjvhctcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZWFlYWpranlybmZqdmhjdGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc5Njc4OTksImV4cCI6MjA0MzU0Mzg5OX0.IXjolIrC0iLPa8fMwEK55y8tTHQMrrdv0i5c9BGn0Ms';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
