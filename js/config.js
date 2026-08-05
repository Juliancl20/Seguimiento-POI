// ==== DATOS DE CONEXIÓN A SUPABASE (SEGUIMIENTO POI) ====
const SUPABASE_URL = 'https://ylpglzsjgblsvjgxqatm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscGdsenNqZ2Jsc3ZqZ3hxYXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDY5NTcsImV4cCI6MjEwMTUyMjk1N30.T-PlhfwgQzLuf7zyfWauEEPCoAgKXHHwEfBnqcPPu2s';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
