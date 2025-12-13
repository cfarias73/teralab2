
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwetcliokuoiybdboehe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZXRjbGlva3VvaXliZGJvZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjM4MjcsImV4cCI6MjA4MTEzOTgyN30.IAbJ13q1mVz4FcFJhklq8hY30gzINoyDf-GTbIV2Vqw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
