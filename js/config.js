// ==== CONEXIÓN SUPABASE (SEGUIMIENTO POI) ====
window.SUPABASE_URL = 'https://ylpglzsjgblsvjgxqatm.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscGdsenNqZ2Jsc3ZqZ3hxYXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDY5NTcsImV4cCI6MjEwMTUyMjk1N30.T-PlhfwgQzLuf7zyfWauEEPCoAgKXHHwEfBnqcPPu2s';

window.SB_LIB = window.supabase;
window.supabase = window.SB_LIB.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
window.crearCliente = function (opts) {
  return window.SB_LIB.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, opts);
};
